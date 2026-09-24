<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import { formatManilaTime, formatPhp } from '@core/utils/format'

import type { CheckoutQuote } from '../../domain/cart.model'

defineProps<{ quote: CheckoutQuote | null }>()
</script>

<template>
  <BaseCard class="checkout-total" padding="md" aria-live="polite">
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
      <p>Quote valid until {{ formatManilaTime(quote.expiresAt) }}.</p>
      <p v-for="warning in quote.warnings" :key="warning" class="checkout-total__warning">
        {{ warning }}
      </p>
    </template>
    <p v-else>Request the final server total before placing your order.</p>
  </BaseCard>
</template>

<style scoped>
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
.checkout-total > .checkout-total__grand {
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 1rem;
}
.checkout-total p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
}
.checkout-total .checkout-total__warning {
  color: var(--color-warning-700);
  font-weight: 700;
}
</style>
