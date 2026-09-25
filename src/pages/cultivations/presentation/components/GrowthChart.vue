<script setup lang="ts">
import { computed } from 'vue'

import { formatManilaDate, formatQuantity } from '@core/utils/format'

import type { GrowthMeasurement } from '../../domain/cultivations.model'

// Sampled average weights plotted oldest to newest, with the same samples listed newest
// first so the values are readable without the chart.
const props = defineProps<{ measurements: GrowthMeasurement[] }>()

function grams(record: GrowthMeasurement) {
  return record.averageWeight.unit === 'KG'
    ? record.averageWeight.value * 1000
    : record.averageWeight.value
}

const ordered = computed(() =>
  [...props.measurements].sort((left, right) => left.measuredOn.localeCompare(right.measuredOn)),
)
const maxWeight = computed(() => Math.max(1, ...ordered.value.map(grams)))
const points = computed(() =>
  ordered.value.map((record, index) => ({
    record,
    x: ordered.value.length === 1 ? 150 : 16 + (index / (ordered.value.length - 1)) * 268,
    y: 116 - (grams(record) / maxWeight.value) * 92,
  })),
)
const polyline = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '))
</script>

<template>
  <div class="growth-chart">
    <svg
      v-if="measurements.length"
      viewBox="0 0 300 140"
      role="img"
      :aria-label="`Growth chart with ${measurements.length} measurements`"
    >
      <line x1="16" y1="116" x2="284" y2="116" />
      <line x1="16" y1="24" x2="16" y2="116" />
      <polyline :points="polyline" />
      <g v-for="point in points" :key="point.record.id">
        <circle :cx="point.x" :cy="point.y" r="5">
          <title>
            {{ formatManilaDate(point.record.measuredOn) }}:
            {{ formatQuantity(point.record.averageWeight.value, point.record.averageWeight.unit) }}
          </title>
        </circle>
      </g>
    </svg>
    <p v-else class="growth-chart__empty">No growth samples recorded yet.</p>
    <ul v-if="measurements.length" class="growth-chart__legend" aria-label="Growth measurements">
      <li v-for="record in [...ordered].reverse()" :key="record.id">
        <span>{{ formatManilaDate(record.measuredOn) }}</span>
        <strong>{{ formatQuantity(record.averageWeight.value, record.averageWeight.unit) }}</strong>
        <small>{{ record.numberOfFishSampled }} fish sampled</small>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.growth-chart {
  display: grid;
  gap: var(--space-4);
}
svg {
  width: 100%;
  min-height: 10rem;
}
line {
  stroke: var(--color-border-strong);
  stroke-width: 1;
}
polyline {
  fill: none;
  stroke: var(--color-brand-600);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}
circle {
  fill: var(--color-aqua-600);
  stroke: white;
  stroke-width: 2;
}
.growth-chart__empty {
  margin: 0;
  padding: var(--space-6) var(--space-3);
  color: var(--color-text-muted);
  text-align: center;
}
.growth-chart__legend {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.growth-chart__legend li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}
.growth-chart__legend span,
.growth-chart__legend small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.growth-chart__legend small {
  grid-column: 1 / -1;
}
</style>
