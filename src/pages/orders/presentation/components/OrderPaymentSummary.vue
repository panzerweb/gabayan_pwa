<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import { formatPhp } from '@core/utils/format'

import { paymentMethodLabel, type OrderDetail } from '../../domain/orders.model'

defineProps<{ order: OrderDetail }>()
</script>

<template>
  <BaseCard class="summary" padding="md">
    <h2>Payment summary</h2>
    <dl>
      <div>
        <dt>Subtotal</dt>
        <dd>{{ formatPhp(order.subtotal.amountMinor) }}</dd>
      </div>
      <div>
        <dt>Delivery</dt>
        <dd>{{ formatPhp(order.deliveryFee.amountMinor) }}</dd>
      </div>
      <div>
        <dt>Payment</dt>
        <dd>{{ paymentMethodLabel(order.paymentMethod) }}</dd>
      </div>
      <div class="summary__total">
        <dt>Total</dt>
        <dd>{{ formatPhp(order.total.amountMinor) }}</dd>
      </div>
    </dl>
  </BaseCard>
</template>

<style scoped>
.summary h2,
.summary dl,
.summary dt,
.summary dd {
  margin: 0;
}
.summary h2 {
  font-size: 1rem;
}
.summary dl {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.summary dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.summary dd {
  text-align: right;
}
.summary dl > .summary__total {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 800;
}
</style>
