<script setup lang="ts">
import { CULTIVATION_VIEWS, type CultivationView } from '../../domain/cultivations.model'

defineProps<{ selected: CultivationView }>()
const emit = defineEmits<{ select: [view: CultivationView] }>()

const LABELS: Record<CultivationView, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}
</script>

<template>
  <nav class="filters" aria-label="Filter cultivations">
    <button
      v-for="option in CULTIVATION_VIEWS"
      :key="option"
      type="button"
      :aria-current="selected === option ? 'page' : undefined"
      @click="emit('select', option)"
    >
      {{ LABELS[option] }}
    </button>
  </nav>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.filters button {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  font-weight: 750;
}
.filters button[aria-current='page'] {
  color: var(--color-brand-800);
  background: white;
  box-shadow: var(--shadow-sm);
}
.filters button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
