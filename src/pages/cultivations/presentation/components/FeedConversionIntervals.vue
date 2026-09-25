<script setup lang="ts">
import { useId } from 'vue'

import { formatManilaDate, formatQuantity } from '@core/utils/format'

import type { FeedConversionInterval } from '../../domain/cultivations.model'

// The ratio between each pair of consecutive growth samples, oldest first, so a change in
// how well the feed turns into growth shows over time.
defineProps<{ intervals: FeedConversionInterval[] }>()

const headingId = useId()
</script>

<template>
  <section class="fcr-intervals" :aria-labelledby="headingId">
    <h2 :id="headingId">Between growth samples</h2>
    <ol>
      <li v-for="interval in intervals" :key="interval.periodStart">
        <span>
          {{ formatManilaDate(interval.periodStart) }} to {{ formatManilaDate(interval.periodEnd) }}
        </span>
        <strong>{{ interval.ratio === null ? 'No ratio' : `FCR ${interval.ratio}` }}</strong>
        <small>
          {{ formatQuantity(interval.feedGiven.value, interval.feedGiven.unit) }} of feed,
          {{ formatQuantity(interval.biomassGain.value, interval.biomassGain.unit) }} gained
        </small>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.fcr-intervals {
  display: grid;
  gap: var(--space-2);
}
h2 {
  margin: 0;
  font-size: 0.95rem;
}
ol {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  font-size: 0.8rem;
}
span,
small {
  color: var(--color-text-muted);
}
small {
  grid-column: 1 / -1;
  font-size: 0.75rem;
}
</style>
