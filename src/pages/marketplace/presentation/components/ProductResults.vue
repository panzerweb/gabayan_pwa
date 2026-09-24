<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'

import {
  PRODUCT_SORT_OPTIONS,
  type ProductSortOption,
  type ProductSummary,
} from '../../domain/marketplace.model'
import ProductCard from './ProductCard.vue'

defineProps<{
  products: ProductSummary[]
  total: number
  loading: boolean
  failed: boolean
  sortBy: ProductSortOption
}>()

const emit = defineEmits<{ sort: [sortBy: ProductSortOption]; retry: []; clear: [] }>()

function onSort(event: Event) {
  emit('sort', (event.target as HTMLSelectElement).value as ProductSortOption)
}
</script>

<template>
  <section class="results" aria-labelledby="results-heading">
    <div class="results-heading">
      <div>
        <p>Marketplace</p>
        <h1 id="results-heading">{{ total }} products</h1>
      </div>
      <label
        >Sort<span class="sr-only"> products</span>
        <select :value="sortBy" @change="onSort">
          <option v-for="option in PRODUCT_SORT_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <LoadingState v-if="loading" label="Loading farm supplies…" />
    <ErrorState v-else-if="failed" @retry="emit('retry')" />
    <div v-else-if="products.length" class="product-grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
    <EmptyState
      v-else
      icon="search"
      title="No products found"
      message="Try another search or clear the selected category."
      action-label="Clear filters"
      @action="emit('clear')"
    />
  </section>
</template>

<style scoped>
.results {
  display: grid;
  gap: var(--space-4);
}
.results-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}
.results-heading p,
.results-heading h1 {
  margin: 0;
}
.results-heading p {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.results-heading h1 {
  margin-top: var(--space-1);
  font-size: 1.2rem;
}
.results-heading label {
  display: grid;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.results-heading select {
  min-height: 2.75rem;
  max-width: 9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: white;
  font: inherit;
}
.results-heading select:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
