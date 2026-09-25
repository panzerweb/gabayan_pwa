<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate, formatQuantity } from '@core/utils/format'

import {
  WATER_PARAMETERS,
  WATER_READING_FIELDS,
  formatThresholdRange,
  readingStatusPresentation,
  waterTrendPoints,
  type WaterParameter,
  type WaterParameterLog,
} from '../../domain/water-quality.model'

// One parameter's saved readings over time: the suggested range as a band, each reading as a
// point, and a reading saved out of range drawn as a warning diamond. The same readings are
// listed below with their status as label, icon and colour, so nothing depends on the chart.
const props = defineProps<{ logs: WaterParameterLog[] }>()

const groupName = useId()
const headingId = useId()

// Opens on the first parameter with a reading out of range, else the first one measured.
function initialParameter(): WaterParameter {
  const flagged = WATER_PARAMETERS.find((code) =>
    waterTrendPoints(props.logs, code).some((point) => point.status !== 'WITHIN_RANGE'),
  )
  const measured = WATER_PARAMETERS.find((code) => waterTrendPoints(props.logs, code).length)
  return flagged ?? measured ?? 'DISSOLVED_OXYGEN'
}

const parameter = ref<WaterParameter>(initialParameter())
const points = computed(() => waterTrendPoints(props.logs, parameter.value))
const label = computed(() => WATER_READING_FIELDS[parameter.value].label)
const latest = computed(() => points.value.at(-1) ?? null)

const TOP = 16
const BOTTOM = 124
const LEFT = 16
const RIGHT = 284

// The value range the chart spans: every reading and both bounds, with a little headroom.
const scale = computed(() => {
  const values = points.value.map((point) => point.value)
  const bound = latest.value
  const all = [...values, bound?.minimum, bound?.maximum].filter(
    (value): value is number => typeof value === 'number',
  )
  const low = Math.min(...all, 0)
  const high = Math.max(...all)
  const padding = (high - low || 1) * 0.1
  return { low, high: high + padding }
})

function y(value: number) {
  const { low, high } = scale.value
  return BOTTOM - ((value - low) / (high - low)) * (BOTTOM - TOP)
}

const plotted = computed(() =>
  points.value.map((point, index) => ({
    ...point,
    x:
      points.value.length === 1
        ? (LEFT + RIGHT) / 2
        : LEFT + (index / (points.value.length - 1)) * (RIGHT - LEFT),
    y: y(point.value),
    flagged: point.status !== 'WITHIN_RANGE',
  })),
)
const polyline = computed(() => plotted.value.map((point) => `${point.x},${point.y}`).join(' '))

const band = computed(() => {
  const bound = latest.value
  if (!bound || (bound.minimum === null && bound.maximum === null)) return null
  const top = bound.maximum === null ? TOP : Math.max(TOP, y(bound.maximum))
  const bottom = bound.minimum === null ? BOTTOM : Math.min(BOTTOM, y(bound.minimum))
  return { y: top, height: Math.max(0, bottom - top) }
})

function diamond(x: number, pointY: number) {
  return `M ${x} ${pointY - 7} L ${x + 7} ${pointY} L ${x} ${pointY + 7} L ${x - 7} ${pointY} Z`
}

const unit = computed(
  () =>
    props.logs.flatMap((log) => log.results).find((result) => result.parameter === parameter.value)
      ?.unit ?? 'MG_PER_L',
)

function valueText(value: number) {
  return formatQuantity(value, unit.value)
}
</script>

<template>
  <section class="water-trend" :aria-labelledby="headingId">
    <h2 :id="headingId">Trend</h2>
    <fieldset class="water-trend__parameters">
      <legend>Show readings of</legend>
      <label
        v-for="code in WATER_PARAMETERS"
        :key="code"
        :class="['water-trend__choice', { 'water-trend__choice--active': parameter === code }]"
      >
        <input v-model="parameter" type="radio" :name="groupName" :value="code" />
        {{ WATER_READING_FIELDS[code].label }}
      </label>
    </fieldset>

    <template v-if="points.length">
      <svg
        viewBox="0 0 300 140"
        role="img"
        :aria-label="`${label} trend with ${points.length} ${points.length === 1 ? 'reading' : 'readings'}`"
      >
        <rect
          v-if="band"
          class="water-trend__band"
          :x="LEFT"
          :y="band.y"
          :width="RIGHT - LEFT"
          :height="band.height"
        />
        <line :x1="LEFT" :y1="BOTTOM" :x2="RIGHT" :y2="BOTTOM" />
        <polyline v-if="plotted.length > 1" :points="polyline" />
        <g v-for="point in plotted" :key="point.logId">
          <path v-if="point.flagged" class="water-trend__flagged" :d="diamond(point.x, point.y)">
            <title>
              {{ formatManilaDate(point.loggedAt) }}: {{ valueText(point.value) }},
              {{ readingStatusPresentation(point.status).label.toLowerCase() }}
            </title>
          </path>
          <circle v-else :cx="point.x" :cy="point.y" r="5">
            <title>{{ formatManilaDate(point.loggedAt) }}: {{ valueText(point.value) }}</title>
          </circle>
        </g>
      </svg>
      <p v-if="latest" class="water-trend__range">
        Suggested range (shaded): {{ formatThresholdRange({ ...latest, unit }) }}
      </p>
      <ol class="water-trend__list" :aria-label="`${label} readings, newest first`">
        <li v-for="point in [...points].reverse()" :key="point.logId">
          <span>{{ formatManilaDate(point.loggedAt) }}</span>
          <strong>{{ valueText(point.value) }}</strong>
          <StatusChip
            :label="readingStatusPresentation(point.status).label"
            :tone="readingStatusPresentation(point.status).tone"
            :icon="readingStatusPresentation(point.status).icon"
          />
        </li>
      </ol>
    </template>
    <p v-else class="water-trend__empty">No {{ label.toLowerCase() }} readings saved yet.</p>
  </section>
</template>

<style scoped>
.water-trend {
  display: grid;
  gap: var(--space-3);
}
h2 {
  margin: 0;
  font-size: 1rem;
}
.water-trend__parameters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}
.water-trend__parameters legend {
  margin-bottom: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.water-trend__choice {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  font-size: 0.8rem;
  cursor: pointer;
}
.water-trend__choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.water-trend__choice--active {
  border-color: var(--color-brand-600);
  color: var(--color-brand-900);
  background: var(--color-brand-50);
  font-weight: 700;
}
.water-trend__choice:focus-within {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
svg {
  width: 100%;
  min-height: 9rem;
}
line {
  stroke: var(--color-border-strong);
  stroke-width: 1;
}
polyline {
  fill: none;
  stroke: var(--color-brand-600);
  stroke-width: 3;
  stroke-linejoin: round;
}
circle {
  fill: var(--color-aqua-600);
  stroke: white;
  stroke-width: 2;
}
.water-trend__band {
  fill: var(--color-brand-50);
}
.water-trend__flagged {
  fill: var(--color-warning-700);
  stroke: white;
  stroke-width: 2;
}
.water-trend__range,
.water-trend__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
.water-trend__list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.water-trend__list li {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  font-size: 0.8rem;
}
.water-trend__list span {
  color: var(--color-text-muted);
}
.water-trend__list :deep(.status-chip) {
  grid-column: 1 / -1;
  justify-self: start;
}
</style>
