<script setup lang="ts">
import type { ProductCategory } from '../../domain/marketplace.model'

// An empty `selected` is "All".
defineProps<{ categories: ProductCategory[]; selected: string }>()

const emit = defineEmits<{ select: [categoryId: string] }>()
</script>

<template>
  <div class="categories" role="group" aria-label="Product categories">
    <button type="button" :aria-pressed="!selected" @click="emit('select', '')">All</button>
    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      :aria-pressed="selected === category.id"
      @click="emit('select', category.id)"
    >
      {{ category.name }}
    </button>
  </div>
</template>

<style scoped>
.categories {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}
.categories button {
  min-height: 2.75rem;
  flex: 0 0 auto;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  background: white;
  font-weight: 700;
}
.categories button[aria-pressed='true'] {
  border-color: var(--color-brand-700);
  color: white;
  background: var(--color-brand-700);
}
.categories button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
