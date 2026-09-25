<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import { formatPhp } from '@core/utils/format'

import type { Cart } from '../../domain/cart.model'

defineProps<{ cart: Cart }>()
</script>

<template>
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
</template>

<style scoped>
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
.totals dl > .totals__grand {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 800;
}
.totals p {
  margin-top: var(--space-3);
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
}
</style>
