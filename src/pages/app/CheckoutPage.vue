<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import {
  ApiError,
  commerceQueryKeys,
  createCheckoutQuote,
  createOrder,
  getCart,
  listAddresses,
  listPaymentOptions,
  type PaymentOption,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { formatPhp } from '@core/utils/format'

const session = useSessionStore()
const router = useRouter()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const fullName = ref(session.user?.fullName ?? '')
const mobileNumber = ref(session.user?.mobileNumber ?? '')
const email = ref(session.user?.email ?? '')
const paymentMethod = ref<PaymentOption['type']>('CASH_ON_DELIVERY')
const formError = ref('')
const idempotencyKey = crypto.randomUUID()

const cartQuery = useQuery({
  queryKey: commerceQueryKeys.cart,
  queryFn: () => getCart(session.accessToken!),
})
const addressQuery = useQuery({
  queryKey: commerceQueryKeys.addresses,
  queryFn: () => listAddresses(session.accessToken!),
})
const paymentQuery = useQuery({
  queryKey: commerceQueryKeys.paymentOptions,
  queryFn: () => listPaymentOptions(session.accessToken!),
})
const cart = computed(() => cartQuery.data.value?.data)
const address = computed(
  () =>
    addressQuery.data.value?.data.find((item) => item.isDefault) ??
    addressQuery.data.value?.data[0],
)
const quoteMutation = useMutation({
  mutationFn: () => {
    if (!cart.value || !address.value) throw new Error('Checkout details are unavailable.')
    return createCheckoutQuote(
      {
        addressId: address.value.id,
        contact: {
          fullName: fullName.value.trim(),
          mobileNumber: mobileNumber.value.trim(),
          email: email.value.trim(),
        },
        paymentMethod: paymentMethod.value,
        cartVersion: cart.value.version,
      },
      session.accessToken!,
    )
  },
})
const quote = computed(() => quoteMutation.data.value?.data)
const orderMutation = useMutation({
  mutationFn: () => {
    if (!quote.value) throw new Error('Request a checkout total first.')
    return createOrder(quote.value.quoteId, quote.value.total, session.accessToken!, idempotencyKey)
  },
})

async function requestQuote() {
  formError.value = ''
  if (!fullName.value.trim() || !mobileNumber.value.trim() || !email.value.trim()) {
    formError.value = 'Complete all contact details before reviewing the total.'
    return
  }
  try {
    await quoteMutation.mutateAsync()
  } catch (error) {
    formError.value =
      error instanceof ApiError ? error.message : 'We couldn’t prepare the checkout total.'
  }
}

async function placeOrder() {
  formError.value = ''
  if (!isOnline.value) {
    formError.value = 'Reconnect before placing the order. Orders are not queued offline.'
    return
  }
  try {
    const result = await orderMutation.mutateAsync()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: commerceQueryKeys.cart }),
      queryClient.invalidateQueries({ queryKey: commerceQueryKeys.orders }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] }),
    ])
    await router.replace({ path: `/app/orders/${result.data.id}`, query: { placed: '1' } })
  } catch (error) {
    formError.value =
      error instanceof ApiError ? error.message : 'We couldn’t place this order. Please try again.'
  }
}

function retryCheckout() {
  cartQuery.refetch()
  addressQuery.refetch()
  paymentQuery.refetch()
}
</script>

<template>
  <div>
    <AppHeader title="Checkout" show-back back-to="/app/cart" />
    <main class="checkout-page">
      <LoadingState
        v-if="
          cartQuery.isPending.value || addressQuery.isPending.value || paymentQuery.isPending.value
        "
        label="Preparing checkout…"
      />
      <ErrorState
        v-else-if="
          cartQuery.isError.value || addressQuery.isError.value || paymentQuery.isError.value
        "
        @retry="retryCheckout"
      />
      <EmptyState
        v-else-if="!cart?.items.length"
        icon="bag"
        title="Your cart is empty"
        message="Add a product before starting checkout."
        action-label="Explore supplies"
        action-to="/app/marketplace"
      />
      <template v-else>
        <BaseCard v-if="address" padding="md">
          <p class="eyebrow">Deliver to</p>
          <h2>{{ address.label }}</h2>
          <address>
            {{ address.recipientName }}<br />{{ address.line1 }}, {{ address.barangay }}<br />{{
              address.cityMunicipality
            }}, {{ address.province }} {{ address.postalCode }}
          </address>
        </BaseCard>
        <BaseCard v-else padding="md"
          ><p>No delivery address is available. Address management arrives in Phase 6.</p></BaseCard
        >

        <section class="checkout-section" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Contact details</h2>
          <BaseInput v-model="fullName" label="Full name" autocomplete="name" required />
          <BaseInput
            v-model="mobileNumber"
            label="Mobile number"
            type="tel"
            autocomplete="tel"
            required
          />
          <BaseInput
            v-model="email"
            label="Email address"
            type="email"
            autocomplete="email"
            required
          />
        </section>

        <fieldset class="payment-options">
          <legend>Payment method</legend>
          <label
            v-for="option in paymentQuery.data.value?.data"
            :key="option.type"
            :class="{ 'payment-option--disabled': !option.enabled }"
          >
            <input
              v-model="paymentMethod"
              type="radio"
              name="payment"
              :value="option.type"
              :disabled="!option.enabled"
            />
            <span
              ><strong>{{ option.label }}</strong
              ><small>{{ option.disabledReason ?? option.description }}</small></span
            >
          </label>
        </fieldset>

        <BaseCard class="checkout-total" padding="md">
          <template v-if="quote">
            <div>
              <span>Subtotal</span><strong>{{ formatPhp(quote.subtotal.amountMinor) }}</strong>
            </div>
            <div>
              <span>Delivery</span><strong>{{ formatPhp(quote.deliveryFee.amountMinor) }}</strong>
            </div>
            <div class="checkout-total__grand">
              <span>Total</span><strong>{{ formatPhp(quote.total.amountMinor) }}</strong>
            </div>
            <p>
              Quote valid until
              {{
                new Date(quote.expiresAt).toLocaleTimeString('en-PH', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
              }}.
            </p>
          </template>
          <template v-else
            ><p>Request the final server total before placing your order.</p></template
          >
        </BaseCard>

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BaseButton
          v-if="!quote"
          :loading="quoteMutation.isPending.value"
          :disabled="!address || !isOnline"
          @click="requestQuote"
          >Review final total</BaseButton
        >
        <BaseButton
          v-else
          :loading="orderMutation.isPending.value"
          :disabled="!isOnline"
          @click="placeOrder"
          >Place order · {{ formatPhp(quote.total.amountMinor) }}</BaseButton
        >
        <p class="safe-write">Order placement is confirmed online and is never silently queued.</p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.checkout-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.eyebrow,
.checkout-page h2,
address {
  margin: 0;
}
.eyebrow {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 750;
}
.checkout-page h2 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
address {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-style: normal;
  line-height: 1.55;
}
.checkout-section {
  display: grid;
  gap: var(--space-3);
}
.checkout-section > h2 {
  margin-bottom: var(--space-1);
}
.payment-options {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}
.payment-options legend {
  margin-bottom: var(--space-3);
  font-size: 1rem;
  font-weight: 800;
}
.payment-options label {
  display: grid;
  min-height: 4rem;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
}
.payment-options input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-brand-700);
}
.payment-options span {
  display: grid;
  gap: var(--space-1);
}
.payment-options small {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.4;
}
.payment-option--disabled {
  opacity: 0.58;
}
.checkout-total {
  display: grid;
  gap: var(--space-2);
}
.checkout-total > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.checkout-total__grand {
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text) !important;
  font-size: 1rem !important;
}
.checkout-total p,
.safe-write,
.form-error {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
}
.form-error {
  color: var(--color-danger-700);
  font-weight: 700;
}
.safe-write {
  text-align: center;
}
</style>
