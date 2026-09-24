<script setup lang="ts">
import type { PaymentMethodType } from '@pages/orders/domain/orders.model'

import type { PaymentOption } from '../../domain/cart.model'

defineProps<{ options: PaymentOption[] }>()

const paymentMethod = defineModel<PaymentMethodType>({ required: true })
</script>

<template>
  <fieldset class="payment-options">
    <legend>Payment method</legend>
    <label
      v-for="option in options"
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
</template>

<style scoped>
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
.payment-options label:focus-within {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
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
</style>
