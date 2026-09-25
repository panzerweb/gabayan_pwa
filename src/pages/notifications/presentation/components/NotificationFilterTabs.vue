<script setup lang="ts">
import { NOTIFICATION_FILTERS, type NotificationFilter } from '../../domain/notifications.model'

defineProps<{ selected: NotificationFilter }>()

const emit = defineEmits<{ select: [filter: NotificationFilter] }>()
</script>

<template>
  <div class="filters" role="group" aria-label="Filter notifications">
    <button
      v-for="filter in NOTIFICATION_FILTERS"
      :key="filter.value"
      type="button"
      :aria-pressed="selected === filter.value"
      @click="emit('select', filter.value)"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}
.filters button {
  min-height: 2.75rem;
  flex: 0 0 auto;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  font-weight: 700;
}
.filters button[aria-pressed='true'] {
  border-color: var(--color-brand-700);
  color: white;
  background: var(--color-brand-700);
}
.filters button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
