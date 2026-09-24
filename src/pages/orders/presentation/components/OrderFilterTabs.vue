<script setup lang="ts">
import { ORDER_FILTERS, type OrderFilter } from '../../domain/orders.model'

defineProps<{ selected: OrderFilter }>()

const emit = defineEmits<{ select: [filter: OrderFilter] }>()
</script>

<template>
  <div class="filters" role="group" aria-label="Filter orders">
    <button
      v-for="filter in ORDER_FILTERS"
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}
.filters button {
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  background: white;
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
