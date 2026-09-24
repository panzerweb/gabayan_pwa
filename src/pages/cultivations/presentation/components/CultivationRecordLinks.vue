<script setup lang="ts">
import { ROUTE_NAMES } from '@router/route-names'

// Entry points to the cultivation's growth, farm records and harvest screens.
const props = defineProps<{ cultivationId: string }>()

const links = [
  { name: ROUTE_NAMES.cultivationGrowth, label: 'Growth', detail: 'Measurements and chart' },
  {
    name: ROUTE_NAMES.cultivationRecords,
    label: 'Farm records',
    detail: 'Feeding, mortality, and water',
  },
  { name: ROUTE_NAMES.cultivationHarvest, label: 'Harvest', detail: 'Readiness and completion' },
]
</script>

<template>
  <section class="record-actions" aria-label="Cultivation records and harvest">
    <RouterLink
      v-for="link in links"
      :key="link.name"
      :to="{ name: link.name, params: { cultivationId: props.cultivationId } }"
    >
      <span>{{ link.label }}</span
      ><strong>{{ link.detail }}</strong
      ><small>›</small>
    </RouterLink>
  </section>
</template>

<style scoped>
.record-actions {
  display: grid;
  gap: var(--space-2);
}
.record-actions a {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  min-height: 4.5rem;
  align-content: center;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: inherit;
  background: var(--color-surface);
  text-decoration: none;
}
.record-actions a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
span,
strong {
  grid-column: 1;
}
span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
strong {
  font-size: 0.85rem;
}
small {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  color: var(--color-brand-700);
  font-size: 1.5rem;
}
</style>
