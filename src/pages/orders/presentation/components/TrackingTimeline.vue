<script setup lang="ts">
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate, formatManilaTime } from '@core/utils/format'

import type { TrackingEvent } from '../../domain/orders.model'

defineProps<{ events: TrackingEvent[] }>()
</script>

<template>
  <ol class="timeline" aria-label="Order progress">
    <li
      v-for="event in events"
      :key="event.id"
      :class="{ current: event.current, completed: event.completed }"
      :aria-current="event.current ? 'step' : undefined"
    >
      <span aria-hidden="true" />
      <div>
        <StatusChip v-if="event.current" label="Current" tone="info" />
        <h2>{{ event.label }}</h2>
        <p>{{ event.description }}</p>
        <small v-if="event.occurredAt"
          >{{ formatManilaDate(event.occurredAt) }} ·
          {{ formatManilaTime(event.occurredAt) }}</small
        ><small v-else>Upcoming</small>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  display: grid;
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
  border: 3px solid white;
  border-radius: 50%;
  background: var(--color-border-strong);
  box-shadow: 0 0 0 1px var(--color-border-strong);
}
.timeline li.completed > span {
  background: var(--color-success-700);
}
.timeline li.current > span {
  background: var(--color-brand-600);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}
.timeline h2,
.timeline p,
.timeline small {
  margin: 0;
}
.timeline h2 {
  margin-top: var(--space-2);
  font-size: 1rem;
}
.timeline p,
.timeline small {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
</style>
