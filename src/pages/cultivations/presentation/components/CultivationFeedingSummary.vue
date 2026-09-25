<script setup lang="ts">
import { computed } from 'vue'

import { formatManilaTime, formatQuantity } from '@core/utils/format'

import type { CultivationDetail } from '../../domain/cultivations.model'
import CultivationMetric from './CultivationMetric.vue'

// The active feeding plan's daily estimate and the next scheduled feeding.
const props = defineProps<{ feeding: CultivationDetail['feedingSummary'] }>()

const dailyFeed = computed(() =>
  props.feeding
    ? formatQuantity(props.feeding.dailyFeed.value, props.feeding.dailyFeed.unit)
    : 'Not set',
)
</script>

<template>
  <section class="metrics" aria-label="Feeding">
    <CultivationMetric
      label="Daily feed estimate"
      :value="dailyFeed"
      :note="feeding ? `${feeding.feedingsPerDay} feedings per day` : 'No active plan'"
    />
    <CultivationMetric
      label="Next feeding"
      :value="feeding ? formatManilaTime(feeding.nextFeedingAt) : 'Not scheduled'"
      note="Asia/Manila time"
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
