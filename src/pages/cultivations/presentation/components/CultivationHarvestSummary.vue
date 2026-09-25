<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate, formatQuantity } from '@core/utils/format'

import { harvestReadinessDisplay, type CultivationDetail } from '../../domain/cultivations.model'

// The server's harvest outlook. Readiness comes from recent growth measurements, never from
// elapsed days, and the dates shown are estimates.
const props = defineProps<{ harvest: CultivationDetail['harvestSummary'] }>()

const readiness = computed(() => harvestReadinessDisplay(props.harvest.readinessStatus))
</script>

<template>
  <BaseCard class="harvest-summary" padding="md">
    <div class="harvest-summary__heading">
      <h2>Harvest outlook</h2>
      <StatusChip :label="readiness.label" :tone="readiness.tone" :icon="readiness.icon" />
    </div>
    <dl>
      <div>
        <dt>Target weight</dt>
        <dd>
          {{
            harvest.targetWeight
              ? formatQuantity(harvest.targetWeight.value, harvest.targetWeight.unit)
              : 'Not set'
          }}
        </dd>
      </div>
      <div>
        <dt>Estimated harvest</dt>
        <dd>
          {{
            harvest.estimatedHarvestDate
              ? formatManilaDate(harvest.estimatedHarvestDate)
              : 'Not estimated yet'
          }}
        </dd>
      </div>
    </dl>
    <p>
      An estimate from your latest growth sample. Weigh a fresh sample before deciding to harvest.
    </p>
  </BaseCard>
</template>

<style scoped>
.harvest-summary {
  display: grid;
  gap: var(--space-3);
}
.harvest-summary__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
h2,
dl,
dt,
dd,
p {
  margin: 0;
}
h2 {
  font-size: 1rem;
}
dl {
  display: grid;
  gap: var(--space-2);
}
dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
dt,
p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
dd {
  font-size: 0.75rem;
  font-weight: 750;
  text-align: right;
}
p {
  line-height: 1.5;
}
</style>
