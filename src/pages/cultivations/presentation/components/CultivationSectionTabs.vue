<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import type { CultivationSection } from '../../domain/cultivations.model'

// Overview and Timeline switch in place; Tasks opens the cultivation's task list.
defineProps<{ selected: CultivationSection; cultivationId: string }>()
const emit = defineEmits<{ select: [section: CultivationSection] }>()
</script>

<template>
  <nav class="tabs" aria-label="Cultivation sections">
    <button
      type="button"
      :aria-current="selected === 'overview' ? 'page' : undefined"
      @click="emit('select', 'overview')"
    >
      Overview
    </button>
    <button
      type="button"
      :aria-current="selected === 'timeline' ? 'page' : undefined"
      @click="emit('select', 'timeline')"
    >
      Timeline
    </button>
    <BaseButton
      variant="text"
      :to="{ name: ROUTE_NAMES.cultivationTasks, params: { cultivationId } }"
    >
      Tasks
    </BaseButton>
  </nav>
</template>

<style scoped>
.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.tabs button {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  font-weight: 750;
}
.tabs button[aria-current='page'] {
  color: var(--color-brand-800);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.tabs button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
