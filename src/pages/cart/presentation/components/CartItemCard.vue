<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { formatPhp } from '@core/utils/format'

import type { CartItem } from '../../domain/cart.model'

defineProps<{ item: CartItem; disabled?: boolean }>()

const emit = defineEmits<{ quantity: [quantity: number]; remove: [] }>()
</script>

<template>
  <BaseCard class="cart-item" padding="md">
    <div class="cart-item__visual" aria-hidden="true"><AppIcon name="bag" /></div>
    <div class="cart-item__body">
      <h2>{{ item.product.name }}</h2>
      <p>{{ formatPhp(item.unitPrice.amountMinor) }} each</p>
      <div class="cart-item__actions">
        <div class="quantity-control" role="group" :aria-label="`Quantity of ${item.product.name}`">
          <button
            type="button"
            aria-label="Decrease quantity"
            :disabled="item.quantity <= 1 || disabled"
            @click="emit('quantity', item.quantity - 1)"
          >
            <AppIcon name="minus" :size="16" />
          </button>
          <strong aria-live="polite">{{ item.quantity }}</strong>
          <button
            type="button"
            aria-label="Increase quantity"
            :disabled="disabled"
            @click="emit('quantity', item.quantity + 1)"
          >
            <AppIcon name="plus" :size="16" />
          </button>
        </div>
        <strong>{{ formatPhp(item.lineTotal.amountMinor) }}</strong>
      </div>
      <button class="remove" type="button" :disabled="disabled" @click="emit('remove')">
        Remove
      </button>
    </div>
  </BaseCard>
</template>

<style scoped>
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
.quantity-control button:disabled {
  opacity: 0.45;
}
.remove {
  min-height: 2.75rem;
  padding: 0;
  border: 0;
  color: var(--color-danger-700);
  background: transparent;
  font-weight: 700;
}
button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
