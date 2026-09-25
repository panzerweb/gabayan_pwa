<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatQuantity } from '@core/utils/format'

import {
  harvestReadinessDisplay,
  readinessStatusWords,
  type HarvestReadiness,
} from '../../domain/cultivations.model'

// The server's readiness estimate: its status, the numbers it rests on, what it is based on
// and its estimate notice. Readiness comes from the latest sample, never from elapsed days.
const props = defineProps<{ readiness: HarvestReadiness }>()

const display = computed(() => harvestReadinessDisplay(props.readiness.status))
</script>

<template>
  <BaseCard class="readiness-card" padding="lg">
    <StatusChip
      :label="readinessStatusWords(readiness.status)"
      :tone="display.tone"
      :icon="display.icon"
    />
    <h1>{{ readiness.message }}</h1>
    <div class="readiness-metrics">
      <div>
        <span>Latest average</span>
        <strong>
          {{
            readiness.estimatedAverageWeight
              ? formatQuantity(
                  readiness.estimatedAverageWeight.value,
                  readiness.estimatedAverageWeight.unit,
                )
              : 'Not recorded'
          }}
        </strong>
      </div>
      <div>
        <span>Estimated biomass</span>
        <strong>
          {{
            readiness.estimatedBiomass
              ? formatQuantity(readiness.estimatedBiomass.value, readiness.estimatedBiomass.unit)
              : 'Unavailable'
          }}
        </strong>
      </div>
    </div>
    <ul aria-label="What this estimate is based on">
      <li v-for="basis in readiness.basis" :key="basis">{{ basis }}</li>
    </ul>
    <aside>
      <strong>Estimate notice</strong>
      <span>{{ readiness.disclaimer }}</span>
      <small>Rule {{ readiness.ruleVersion }}</small>
    </aside>
  </BaseCard>
</template>

<style scoped>
.readiness-card {
  display: grid;
  gap: var(--space-4);
}
h1 {
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.35;
}
.readiness-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.readiness-metrics div {
  display: grid;
  gap: var(--space-1);
}
.readiness-metrics span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
ul {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.55;
}
aside {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.75rem;
  line-height: 1.45;
}
</style>
