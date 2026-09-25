<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import { formatManilaDate, formatPhp } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import { itemCountLabel, type OrderSummary } from '../../domain/orders.model'
import OrderStatusChip from './OrderStatusChip.vue'

defineProps<{ order: OrderSummary }>()
</script>

<template>
  <RouterLink
    class="order-link"
    :to="{ name: ROUTE_NAMES.orderDetail, params: { orderId: order.id } }"
  >
    <BaseCard class="order-card" padding="md">
      <div class="order-card__topline">
        <div>
          <p>{{ order.orderNumber }}</p>
          <h2>{{ itemCountLabel(order.itemCount) }}</h2>
        </div>
        <OrderStatusChip :status="order.status" />
      </div>
      <div class="order-card__bottom">
        <span>Placed {{ formatManilaDate(order.placedAt) }}</span
        ><strong>{{ formatPhp(order.total.amountMinor) }}</strong>
      </div>
    </BaseCard>
  </RouterLink>
</template>

<style scoped>
.order-link {
  color: inherit;
  text-decoration: none;
}
.order-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: var(--radius-lg);
}
.order-card {
  display: grid;
  gap: var(--space-4);
}
.order-card__topline,
.order-card__bottom {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.order-card p,
.order-card h2 {
  margin: 0;
}
.order-card p {
  color: var(--color-brand-800);
  font-size: 0.75rem;
  font-weight: 800;
}
.order-card h2 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
.order-card__bottom {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.order-card__bottom strong {
  color: var(--color-text);
  font-size: 0.875rem;
}
</style>
