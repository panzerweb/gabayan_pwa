<script setup lang="ts">
import { computed } from 'vue'

import { formatQuantity } from '@core/utils/format'
import type { Quantity } from '@pages/cultivations/domain/cultivations.model'

import { daysUntilHarvestLabel, type FarmOverview } from '../../domain/home.model'

// The primary cultivation's figures at a glance. Every value is the server's estimate.
const props = defineProps<{ overview: FarmOverview | null }>()

function quantityLabel(quantity: Quantity | null | undefined) {
  return quantity ? formatQuantity(quantity.value, quantity.unit) : 'Not recorded'
}

const metrics = computed(() => {
  const overview = props.overview
  const age = overview?.fishAgeDays
  return [
    { label: 'Fish age', value: age === null || age === undefined ? '—' : `${age} days` },
    { label: 'Average weight', value: quantityLabel(overview?.estimatedAverageWeight) },
    { label: 'Daily feed', value: quantityLabel(overview?.dailyFeed) },
    { label: 'Est. harvest', value: daysUntilHarvestLabel(overview) },
  ]
})
</script>

<template>
  <dl class="farm-overview">
    <div v-for="metric in metrics" :key="metric.label">
      <dt>{{ metric.label }}</dt>
      <dd>{{ metric.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.farm-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin: 0;
}
.farm-overview div {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-brand-50);
}
.farm-overview dt {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.farm-overview dd {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
}
</style>
