<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'
import { formatQuantity } from '@core/utils/format'
import { ROUTE_NAMES, type RouteName } from '@router/route-names'

import { stockingStatusLabel, type StockingEstimate } from '../../domain/setup.model'

const props = defineProps<{ estimate: StockingEstimate }>()

// Each answer with the step that changes it.
const rows = computed<{ label: string; value: string; action: string; step: RouteName }[]>(() => {
  const { dimensions } = props.estimate
  return [
    {
      label: 'Species',
      value: props.estimate.species.commonName,
      action: 'Edit',
      step: ROUTE_NAMES.setupSpecies,
    },
    {
      label: 'Environment',
      value: props.estimate.environment.name,
      action: 'Edit',
      step: ROUTE_NAMES.setupEnvironment,
    },
    {
      label: 'Dimensions',
      value: `${dimensions.lengthM} × ${dimensions.widthM} × ${formatQuantity(dimensions.waterDepthM, 'M')}`,
      action: 'Edit',
      step: ROUTE_NAMES.setupDimensions,
    },
    {
      label: 'Fingerlings',
      value: `${formatQuantity(props.estimate.plannedFingerlings, 'COUNT')} fish`,
      action: 'Edit',
      step: ROUTE_NAMES.setupFingerlings,
    },
    {
      label: 'Estimate',
      value: stockingStatusLabel(props.estimate.status),
      action: 'View',
      step: ROUTE_NAMES.setupStockingResult,
    },
  ]
})
</script>

<template>
  <BaseCard class="review-list" padding="none">
    <div v-for="row in rows" :key="row.label">
      <span>{{ row.label }}</span
      ><strong>{{ row.value }}</strong
      ><RouterLink
        :to="{ name: row.step }"
        :aria-label="`${row.action} ${row.label.toLowerCase()}`"
      >
        {{ row.action }}
      </RouterLink>
    </div>
  </BaseCard>
</template>

<style scoped>
.review-list {
  margin-top: var(--space-6);
  overflow: hidden;
}

.review-list > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.review-list > div:last-child {
  border-bottom: 0;
}
.review-list span {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.review-list strong {
  grid-column: 1;
  font-size: 0.875rem;
}
.review-list a {
  display: grid;
  min-width: 2.75rem;
  min-height: 2.75rem;
  place-items: center;
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: center;
  color: var(--color-brand-700);
  font-size: 0.75rem;
  font-weight: 750;
}
</style>
