<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { formatQuantity } from '@core/utils/format'

import type { StockingEstimate } from '../../domain/setup.model'

defineProps<{ estimate: StockingEstimate }>()

const fish = (count: number) => `${formatQuantity(count, 'COUNT')} fish`
</script>

<template>
  <BaseCard class="result-card" padding="lg">
    <div>
      <span>Your plan</span><strong>{{ fish(estimate.plannedFingerlings) }}</strong>
    </div>
    <div>
      <span>Estimated range</span
      ><strong
        >{{ formatQuantity(estimate.recommendedMinimum, 'COUNT') }}–{{
          fish(estimate.recommendedMaximum)
        }}</strong
      >
    </div>
    <div>
      <span>Estimated water volume</span
      ><strong>{{ formatQuantity(estimate.estimatedWaterVolumeM3, 'M3') }}</strong>
    </div>
  </BaseCard>
  <p class="result-basis">{{ estimate.basis.explanation }}</p>
  <p class="result-disclaimer">
    <AppIcon name="info" :size="18" />
    <span>
      <strong v-if="estimate.isDemo">Demo estimate. </strong>{{ estimate.disclaimer }}
      <small>Rule version {{ estimate.ruleVersion }}</small>
    </span>
  </p>
</template>

<style scoped>
.result-card {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.result-card div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.result-card span {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.result-card strong {
  font-size: 0.875rem;
  text-align: right;
}

.result-basis {
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.result-disclaimer {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.6875rem;
  line-height: 1.5;
}

.result-disclaimer small {
  display: block;
  margin-top: var(--space-1);
}
</style>
