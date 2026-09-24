<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'

import { clampQuantity } from '../../domain/marketplace.model'

const props = defineProps<{ maximum: number }>()

const quantity = defineModel<number>({ required: true })

function step(by: number) {
  quantity.value = clampQuantity(quantity.value + by, props.maximum)
}
</script>

<template>
  <div class="quantity-control">
    <span id="product-quantity-label">Quantity</span>
    <div role="group" aria-labelledby="product-quantity-label">
      <button
        type="button"
        aria-label="Decrease quantity"
        :disabled="quantity <= 1"
        @click="step(-1)"
      >
        <AppIcon name="minus" :size="18" />
      </button>
      <strong aria-live="polite">{{ quantity }}</strong>
      <button
        type="button"
        aria-label="Increase quantity"
        :disabled="quantity >= maximum"
        @click="step(1)"
      >
        <AppIcon name="plus" :size="18" />
      </button>
    </div>
    <small v-if="quantity >= maximum">Up to {{ maximum }} per order.</small>
  </div>
</template>

<style scoped>
.quantity-control {
  display: flex;
  min-height: 3rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
}
.quantity-control > span {
  font-size: 0.875rem;
  font-weight: 750;
}
.quantity-control > div {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.quantity-control > small {
  flex-basis: 100%;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-align: right;
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
.quantity-control button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
