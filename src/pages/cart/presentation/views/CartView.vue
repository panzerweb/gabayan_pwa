<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import CartItemCard from '../components/CartItemCard.vue'
import CartTotals from '../components/CartTotals.vue'
import { useCart } from '../composables/useCart'

const {
  cart,
  loading,
  loadFailed,
  refetch,
  isOnline,
  pendingItemId,
  actionError,
  changeQuantity,
  remove,
} = useCart()
</script>

<template>
  <div>
    <AppHeader
      title="Your cart"
      :subtitle="cart ? `${cart.itemCount} items` : ''"
      show-back
      :back-to="{ name: ROUTE_NAMES.marketplace }"
    />
    <main class="cart-page">
      <LoadingState v-if="loading" label="Loading your cart…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <EmptyState
        v-else-if="!cart?.items.length"
        icon="bag"
        title="Your cart is empty"
        message="Browse farm supplies and add only what supports your current needs."
        action-label="Explore supplies"
        :action-to="{ name: ROUTE_NAMES.marketplace }"
      />
      <template v-else>
        <p v-if="!isOnline" class="cart-note">
          Reconnect to change quantities. Cart changes are not queued offline.
        </p>
        <p v-if="actionError" class="cart-error" role="alert">{{ actionError }}</p>
        <section class="cart-items" aria-label="Cart items">
          <CartItemCard
            v-for="item in cart.items"
            :key="item.id"
            :item="item"
            :disabled="!isOnline || pendingItemId !== null"
            @quantity="changeQuantity(item, $event)"
            @remove="remove(item)"
          />
        </section>
        <CartTotals :cart="cart" />
        <BaseButton :to="{ name: ROUTE_NAMES.checkout }">Continue to checkout</BaseButton>
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
.cart-note,
.cart-error {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
  line-height: 1.5;
}
.cart-error {
  font-weight: 700;
}
</style>
