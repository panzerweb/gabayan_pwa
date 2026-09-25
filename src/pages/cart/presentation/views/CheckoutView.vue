<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { formatPhp } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import { CHECKOUT_OFFLINE_MESSAGE } from '../../domain/cart.model'
import CheckoutAddress from '../components/CheckoutAddress.vue'
import CheckoutContactForm from '../components/CheckoutContactForm.vue'
import CheckoutPaymentOptions from '../components/CheckoutPaymentOptions.vue'
import CheckoutQuoteSummary from '../components/CheckoutQuoteSummary.vue'
import { useCheckout } from '../composables/useCheckout'

const {
  cart,
  address,
  paymentOptions,
  loading,
  loadFailed,
  retry,
  isOnline,
  contact,
  paymentMethod,
  fieldErrors,
  formError,
  quote,
  requesting,
  placing,
  requestQuote,
  placeOrder,
} = useCheckout()
</script>

<template>
  <div>
    <AppHeader title="Checkout" show-back :back-to="{ name: ROUTE_NAMES.cart }" />
    <main class="checkout-page">
      <LoadingState v-if="loading" label="Preparing checkout…" />
      <ErrorState v-else-if="loadFailed" @retry="retry" />
      <EmptyState
        v-else-if="!cart?.items.length"
        icon="bag"
        title="Your cart is empty"
        message="Add a product before starting checkout."
        action-label="Explore supplies"
        :action-to="{ name: ROUTE_NAMES.marketplace }"
      />
      <template v-else>
        <CheckoutAddress :address="address" />
        <CheckoutContactForm
          v-model:full-name="contact.fullName"
          v-model:mobile-number="contact.mobileNumber"
          v-model:email="contact.email"
          :errors="fieldErrors"
        />
        <CheckoutPaymentOptions v-model="paymentMethod" :options="paymentOptions" />
        <CheckoutQuoteSummary :quote="quote" />

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <p v-else-if="!isOnline" class="offline-note">{{ CHECKOUT_OFFLINE_MESSAGE }}</p>
        <BaseButton
          v-if="!quote"
          :loading="requesting"
          :disabled="!address || !isOnline"
          @click="requestQuote"
          >Review final total</BaseButton
        >
        <BaseButton v-else :loading="placing" :disabled="!isOnline" @click="placeOrder"
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
.safe-write,
.form-error,
.offline-note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
}
.form-error,
.offline-note {
  color: var(--color-danger-700);
  font-weight: 700;
}
.safe-write {
  text-align: center;
}
</style>
