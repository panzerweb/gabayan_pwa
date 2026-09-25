<script setup lang="ts">
import { RECORDS_TABS, RECORDS_TAB_LABELS, type RecordsTab } from '../../domain/cultivations.model'

// The four farm record categories; the selected one is marked as the current page.
defineProps<{ selected: RecordsTab }>()
const emit = defineEmits<{ select: [tab: RecordsTab] }>()
</script>

<template>
  <nav class="record-tabs" aria-label="Farm record categories">
    <button
      v-for="tab in RECORDS_TABS"
      :key="tab"
      type="button"
      :aria-current="selected === tab ? 'page' : undefined"
      @click="emit('select', tab)"
    >
      {{ RECORDS_TAB_LABELS[tab] }}
    </button>
  </nav>
</template>

<style scoped>
.record-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.record-tabs button {
  min-height: 2.75rem;
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  font-size: 0.7rem;
  font-weight: 750;
}
.record-tabs button[aria-current='page'] {
  color: var(--color-brand-800);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.record-tabs button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
