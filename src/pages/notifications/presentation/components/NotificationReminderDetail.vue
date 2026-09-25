<script setup lang="ts">
import { computed } from 'vue'

import StatusChip from '@components/ui/StatusChip.vue'

import {
  HARVEST_DECISION_NOTE,
  harvestSampleLine,
  harvestWindowHint,
  waterChangeLine,
  type NotificationType,
  type ReminderDetail,
} from '../../domain/notifications.model'

// The figures behind a reminder: the share of water to change, or the sample against the
// harvest target with the culture-length hint, and always the estimate's provenance.
const props = defineProps<{ type: NotificationType; reminder: ReminderDetail }>()

const waterChange = computed(() =>
  props.type === 'WATER_CHANGE_DUE' && props.reminder.waterChangePercent !== null
    ? waterChangeLine(props.reminder.waterChangePercent)
    : null,
)
const isHarvestAlert = computed(() => props.type === 'HARVEST_APPROACHING')
const sample = computed(() => (isHarvestAlert.value ? harvestSampleLine(props.reminder) : null))
const windowHint = computed(() =>
  isHarvestAlert.value && props.reminder.harvestWindowDays
    ? harvestWindowHint(props.reminder.harvestWindowDays)
    : null,
)
</script>

<template>
  <div class="reminder-detail">
    <p v-if="waterChange" class="reminder-detail__lead">{{ waterChange }}</p>
    <template v-if="isHarvestAlert">
      <p v-if="sample" class="reminder-detail__lead">{{ sample }}</p>
      <p class="reminder-detail__decision">{{ HARVEST_DECISION_NOTE }}</p>
      <p v-if="windowHint" class="reminder-detail__hint">{{ windowHint }}</p>
    </template>
    <aside
      v-if="reminder.isDemo"
      class="reminder-detail__provenance"
      aria-label="About this reminder"
    >
      <StatusChip label="Demo estimate" tone="warning" icon="info" />
      <p>{{ reminder.disclaimer }}</p>
      <small>Rule {{ reminder.ruleVersion }}</small>
    </aside>
  </div>
</template>

<style scoped>
.reminder-detail {
  display: grid;
  gap: var(--space-2);
}
p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.reminder-detail__lead {
  color: var(--color-brand-800);
  font-weight: 700;
}
.reminder-detail__decision {
  color: var(--color-text);
  font-weight: 650;
}
.reminder-detail__provenance {
  display: grid;
  gap: var(--space-1);
  justify-items: start;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.reminder-detail__provenance p,
.reminder-detail__provenance small {
  font-size: 0.75rem;
}
</style>
