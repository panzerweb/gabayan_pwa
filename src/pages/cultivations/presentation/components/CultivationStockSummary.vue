<script setup lang="ts">
import { computed } from 'vue'

import { formatManilaDate, formatQuantity } from '@core/utils/format'

import type { CultivationDetail } from '../../domain/cultivations.model'
import CultivationMetric from './CultivationMetric.vue'

// The stock: live fish after recorded mortality, and the latest sampled average weight.
const props = defineProps<{ cultivation: CultivationDetail }>()

const liveFish = computed(() => props.cultivation.estimatedLiveFish.toLocaleString('en-PH'))
const latest = computed(() => props.cultivation.latestGrowthMeasurement)
</script>

<template>
  <section class="metrics" aria-label="Stock">
    <CultivationMetric
      label="Estimated live fish"
      :value="liveFish"
      :note="`${cultivation.recordedMortality} mortality recorded`"
    />
    <CultivationMetric
      label="Latest average weight"
      :value="
        latest
          ? formatQuantity(latest.averageWeight.value, latest.averageWeight.unit)
          : 'Not recorded'
      "
      :note="latest ? formatManilaDate(latest.measuredOn) : 'Add a sample later'"
    />
  </section>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
</style>
