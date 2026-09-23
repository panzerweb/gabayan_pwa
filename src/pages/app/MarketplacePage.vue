<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'

import CartLink from '@/components/commerce/CartLink.vue'
import ProductCard from '@/components/commerce/ProductCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import {
  commerceQueryKeys,
  listProductCategories,
  listProducts,
  type ProductFilters,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const search = ref(String(route.query.search ?? ''))
const selectedCategory = computed(() => String(route.query.categoryId ?? ''))
const selectedSort = computed(() => String(route.query.sortBy ?? 'name_asc'))
const filters = computed<ProductFilters>(() => {
  const parts = selectedSort.value.split('_')
  const sort = (parts[0] as NonNullable<ProductFilters['sort']>) || 'name'
  const order = (parts[1] as NonNullable<ProductFilters['order']>) || 'asc'
  return {
    ...(route.query.search ? { search: String(route.query.search) } : {}),
    ...(selectedCategory.value ? { categoryId: selectedCategory.value } : {}),
    ...(route.query.speciesId ? { suitableSpeciesId: String(route.query.speciesId) } : {}),
    ...(route.query.environmentId
      ? { suitableEnvironmentId: String(route.query.environmentId) }
      : {}),
    sort,
    order,
  }
})
const categoriesQuery = useQuery({
  queryKey: commerceQueryKeys.categories,
  queryFn: listProductCategories,
})
const productsQuery = useQuery({
  queryKey: computed(() => commerceQueryKeys.products(filters.value)),
  queryFn: () => listProducts(filters.value, session.accessToken!),
})

function updateQuery(changes: Record<string, string | undefined>) {
  const next = { ...route.query, ...changes }
  Object.keys(next).forEach((key) => {
    if (!next[key]) delete next[key]
  })
  router.replace({ query: next })
}

function submitSearch() {
  updateQuery({ search: search.value.trim() || undefined })
}

function clearFilters() {
  search.value = ''
  router.replace({ query: {} })
}
</script>

<template>
  <div>
    <AppHeader
      title="Marketplace"
      subtitle="Supplies that support your farm"
      show-back
      back-to="/app/orders"
    >
      <template #trailing><CartLink /></template>
    </AppHeader>
    <main class="marketplace-page">
      <form class="search" role="search" @submit.prevent="submitSearch">
        <AppIcon name="search" :size="20" aria-hidden="true" />
        <label class="sr-only" for="marketplace-search">Search marketplace</label>
        <input
          id="marketplace-search"
          v-model="search"
          type="search"
          placeholder="Search feed, aeration, tools…"
        />
        <button type="submit">Search</button>
      </form>

      <div v-if="categoriesQuery.data.value" class="categories" aria-label="Product categories">
        <button
          type="button"
          :aria-pressed="!selectedCategory"
          @click="updateQuery({ categoryId: undefined })"
        >
          All
        </button>
        <button
          v-for="category in categoriesQuery.data.value.data"
          :key="category.id"
          type="button"
          :aria-pressed="selectedCategory === category.id"
          @click="updateQuery({ categoryId: category.id })"
        >
          {{ category.name }}
        </button>
      </div>

      <div class="results-heading">
        <div>
          <p>Marketplace</p>
          <h1>{{ productsQuery.data.value?.page.total ?? 0 }} products</h1>
        </div>
        <label
          >Sort<span class="sr-only"> products</span>
          <select
            :value="selectedSort"
            @change="updateQuery({ sortBy: ($event.target as HTMLSelectElement).value })"
          >
            <option value="name_asc">Name</option>
            <option value="rating_desc">Top rated</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <LoadingState v-if="productsQuery.isPending.value" label="Loading farm supplies…" />
      <ErrorState v-else-if="productsQuery.isError.value" @retry="productsQuery.refetch()" />
      <div v-else-if="productsQuery.data.value?.data.length" class="product-grid">
        <ProductCard
          v-for="product in productsQuery.data.value.data"
          :key="product.id"
          :product="product"
        />
      </div>
      <EmptyState
        v-else
        icon="search"
        title="No products found"
        message="Try another search or clear the selected category."
        action-label="Clear filters"
        @action="clearFilters"
      />
      <p class="marketplace-note">
        Products support the cultivation journey, but they do not replace site-specific aquaculture
        guidance.
      </p>
    </main>
  </div>
</template>

<style scoped>
.marketplace-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.search {
  display: grid;
  min-height: 3.25rem;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  padding-left: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.search:focus-within {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 3px rgb(14 165 233 / 15%);
}
.search input {
  min-width: 0;
  align-self: stretch;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
}
.search button {
  min-height: 2.75rem;
  align-self: stretch;
  padding-inline: var(--space-3);
  border: 0;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: white;
  background: var(--color-brand-700);
  font-weight: 750;
}
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
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.marketplace-note {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
  text-align: center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
button:focus-visible,
select:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
