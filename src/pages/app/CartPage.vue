<script setup lang="ts">
import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import {
  ApiError,
  commerceQueryKeys,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@stores/toast.store'
import { formatPhp } from '@core/utils/format'

const session = useSessionStore()
const toast = useToastStore()
const queryClient = useQueryClient()
const query = useQuery({
  queryKey: commerceQueryKeys.cart,
  queryFn: () => getCart(session.accessToken!),
})
const cart = computed(() => query.data.value?.data)
const updateMutation = useMutation({
  mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
    updateCartItem(itemId, quantity, session.accessToken!),
  onSuccess: async () => queryClient.invalidateQueries({ queryKey: commerceQueryKeys.cart }),
  onError: (error) =>
    toast.show(error instanceof ApiError ? error.message : 'Could not update this item.', 'danger'),
})
const removeMutation = useMutation({
  mutationFn: (itemId: string) => removeCartItem(itemId, session.accessToken!),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.cart })
    toast.show('Item removed from cart.', 'info')
  },
  onError: () => toast.show('Could not remove this item.', 'danger'),
})
</script>

<template>
  <div>
    <AppHeader
      title="Your cart"
      :subtitle="cart ? `${cart.itemCount} items` : ''"
      show-back
      back-to="/app/marketplace"
    />
    <main class="cart-page">
      <LoadingState v-if="query.isPending.value" label="Loading your cart…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <EmptyState
        v-else-if="!cart?.items.length"
        icon="bag"
        title="Your cart is empty"
        message="Browse farm supplies and add only what supports your current needs."
        action-label="Explore supplies"
        action-to="/app/marketplace"
      />
      <template v-else>
        <section class="cart-items" aria-label="Cart items">
          <BaseCard v-for="item in cart.items" :key="item.id" class="cart-item" padding="md">
            <div class="cart-item__visual" aria-hidden="true"><AppIcon name="bag" /></div>
            <div class="cart-item__body">
              <h2>{{ item.product.name }}</h2>
              <p>{{ formatPhp(item.unitPrice.amountMinor) }} each</p>
              <div class="cart-item__actions">
                <div class="quantity-control">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    :disabled="item.quantity <= 1 || updateMutation.isPending.value"
                    @click="updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })"
                  >
                    <AppIcon name="minus" :size="16" />
                  </button>
                  <strong>{{ item.quantity }}</strong>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    :disabled="updateMutation.isPending.value"
                    @click="updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })"
                  >
                    <AppIcon name="plus" :size="16" />
                  </button>
                </div>
                <strong>{{ formatPhp(item.lineTotal.amountMinor) }}</strong>
              </div>
              <button
                class="remove"
                type="button"
                :disabled="removeMutation.isPending.value"
                @click="removeMutation.mutate(item.id)"
              >
                Remove
              </button>
            </div>
          </BaseCard>
        </section>

        <BaseCard class="totals" padding="md">
          <h2>Order estimate</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{{ formatPhp(cart.subtotal.amountMinor) }}</dd>
            </div>
            <div>
              <dt>Estimated delivery</dt>
              <dd>{{ formatPhp(cart.estimatedDeliveryFee.amountMinor) }}</dd>
            </div>
            <div class="totals__grand">
              <dt>Estimated total</dt>
              <dd>{{ formatPhp(cart.estimatedTotal.amountMinor) }}</dd>
            </div>
          </dl>
          <p>Final prices and delivery are confirmed by the server during checkout.</p>
        </BaseCard>
        <BaseButton to="/app/checkout">Continue to checkout</BaseButton>
      </template>
    </main>
  </div>
</template>

<style scoped>
.cart-page,
.cart-items {
  display: grid;
  gap: var(--space-3);
}
.cart-page {
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.cart-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-3);
}
.cart-item__visual {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}
.cart-item h2,
.cart-item p {
  margin: 0;
}
.cart-item h2 {
  font-size: 0.9375rem;
}
.cart-item p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.cart-item__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.quantity-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.quantity-control button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-brand-800);
  background: white;
}
.remove {
  min-height: 2.75rem;
  padding: 0;
  border: 0;
  color: var(--color-danger-700);
  background: transparent;
  font-weight: 700;
}
.totals h2,
.totals dl,
.totals dt,
.totals dd,
.totals p {
  margin: 0;
}
.totals h2 {
  font-size: 1rem;
}
.totals dl {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.totals dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.totals__grand {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text) !important;
  font-weight: 800;
}
.totals p {
  margin-top: var(--space-3);
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
}
button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
