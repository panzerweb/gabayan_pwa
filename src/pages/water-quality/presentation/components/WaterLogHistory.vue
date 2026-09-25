<script setup lang="ts">
import { useId } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate, formatManilaTime, formatQuantity } from '@core/utils/format'

import {
  WATER_READING_FIELDS,
  outOfRangeSummary,
  readingStatusPresentation,
  type WaterParameterLog,
} from '../../domain/water-quality.model'

// Every saved log, newest first: when it was taken, how many readings fell outside their
// range, each reading with its saved status, the parameters not measured, and the notes.
defineProps<{ logs: WaterParameterLog[] }>()

const headingId = useId()

function notLoggedText(log: WaterParameterLog) {
  return log.notLogged.map((code) => WATER_READING_FIELDS[code].label).join(', ')
}
</script>

<template>
  <section class="water-history" :aria-labelledby="headingId">
    <h2 :id="headingId">History</h2>
    <ol class="water-history__logs">
      <li v-for="log in logs" :key="log.id" class="water-history__log">
        <div class="water-history__heading">
          <strong>
            {{ formatManilaDate(log.loggedAt) }}, {{ formatManilaTime(log.loggedAt) }}
          </strong>
          <StatusChip
            :label="outOfRangeSummary(log.outOfRangeCount)"
            :tone="log.outOfRangeCount ? 'warning' : 'success'"
            :icon="log.outOfRangeCount ? 'warning' : 'check'"
          />
        </div>
        <ul
          class="water-history__readings"
          :aria-label="`Readings of ${formatManilaDate(log.loggedAt)}`"
        >
          <li v-for="result in log.results" :key="result.parameter">
            <span>{{ result.name }}</span>
            <strong>{{ formatQuantity(result.value, result.unit) }}</strong>
            <StatusChip
              v-if="result.status !== 'WITHIN_RANGE'"
              :label="readingStatusPresentation(result.status).label"
              :tone="readingStatusPresentation(result.status).tone"
              :icon="readingStatusPresentation(result.status).icon"
            />
          </li>
        </ul>
        <p v-if="log.notLogged.length" class="water-history__note">
          Not measured: {{ notLoggedText(log) }}.
        </p>
        <p v-if="log.notes" class="water-history__note">{{ log.notes }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.water-history {
  display: grid;
  gap: var(--space-3);
}
h2 {
  margin: 0;
  font-size: 1rem;
}
.water-history__logs,
.water-history__readings {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.water-history__logs {
  gap: var(--space-3);
}
.water-history__log {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.water-history__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 0.85rem;
}
.water-history__readings {
  gap: var(--space-1);
}
.water-history__readings li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.8rem;
}
.water-history__readings span {
  min-width: 8.5rem;
  color: var(--color-text-muted);
}
.water-history__note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}
</style>
