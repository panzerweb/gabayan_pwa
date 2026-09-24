<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate } from '@core/utils/format'

import {
  timelineEventDate,
  timelineEventDisplay,
  type CultivationTimeline,
  type TimelineEvent,
} from '../../domain/cultivations.model'

// The cultivation's stages in order, with loading, failure and empty states of its own.
defineProps<{ timeline: CultivationTimeline | null; loading: boolean; failed: boolean }>()
const emit = defineEmits<{ retry: [] }>()

function dateLabel(event: TimelineEvent) {
  const when = timelineEventDate(event)
  if (!when) return ''
  const date = formatManilaDate(when.date)
  return when.estimated ? `Estimated ${date}` : date
}
</script>

<template>
  <LoadingState v-if="loading" compact label="Loading timeline…" />
  <ErrorState
    v-else-if="failed"
    message="We couldn’t load this timeline. Check your connection and try again."
    @retry="emit('retry')"
  />
  <EmptyState
    v-else-if="!timeline || timeline.events.length === 0"
    title="No timeline yet"
    message="Stages appear here once fingerlings are stocked and records are added."
  />
  <ol v-else class="timeline">
    <li
      v-for="event in timeline.events"
      :key="event.id"
      :class="`timeline--${event.status.toLowerCase()}`"
    >
      <span aria-hidden="true" />
      <div>
        <StatusChip
          :label="timelineEventDisplay(event.status).label"
          :tone="timelineEventDisplay(event.status).tone"
          :icon="timelineEventDisplay(event.status).icon"
        />
        <h2>{{ event.label }}</h2>
        <p v-if="event.detail">{{ event.detail }}</p>
        <small>{{ dateLabel(event) }}</small>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.timeline li {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
}
.timeline li::before {
  position: absolute;
  top: 1rem;
  bottom: 0;
  left: 0.45rem;
  width: 2px;
  background: var(--color-border);
  content: '';
}
.timeline li:last-child::before {
  display: none;
}
.timeline li > span {
  z-index: 1;
  width: 1rem;
  height: 1rem;
  margin-top: 0.35rem;
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-border-strong);
  box-shadow: 0 0 0 1px var(--color-border-strong);
}
.timeline--current > span {
  background: var(--color-brand-600) !important;
}
h2,
p,
small {
  margin: 0;
}
h2 {
  margin-top: var(--space-2);
  font-size: 1rem;
}
p,
small {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
</style>
