<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { formatPhp } from '@core/utils/format'

import type { OrderItem } from '../../domain/orders.model'

defineProps<{ items: OrderItem[] }>()
</script>

<template>
  <BaseCard padding="md">
    <h2 class="items-title">Items</h2>
    <ul class="items">
      <li v-for="item in items" :key="item.id">
        <span aria-hidden="true"><AppIcon name="bag" /></span>
        <div>
          <strong>{{ item.name }}</strong
          ><small>{{ item.quantity }} × {{ formatPhp(item.unitPrice.amountMinor) }}</small>
        </div>
        <b>{{ formatPhp(item.lineTotal.amountMinor) }}</b>
      </li>
    </ul>
  </BaseCard>
</template>

<style scoped>
.items-title,
.items {
  margin: 0;
}
.items-title {
  font-size: 1rem;
}
.items {
  padding: 0;
  list-style: none;
}
.items li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.items li:last-child {
  border-bottom: 0;
}
.items li > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}
.items small {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.items b {
  font-size: 0.75rem;
}
</style>
