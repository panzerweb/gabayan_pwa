<script setup lang="ts">
import AppHeader from '@components/navigation/AppHeader.vue'
import CartLink from '@pages/cart/presentation/components/CartLink.vue'
import { ROUTE_NAMES } from '@router/route-names'

import CategoryFilter from '../components/CategoryFilter.vue'
import MarketplaceSearch from '../components/MarketplaceSearch.vue'
import ProductResults from '../components/ProductResults.vue'
import { useMarketplaceFilters } from '../composables/useMarketplaceFilters'
import { useProductCatalog } from '../composables/useProductCatalog'

const {
  search,
  selectedCategoryId,
  sortBy,
  filters,
  submitSearch,
  selectCategory,
  selectSort,
  clear,
} = useMarketplaceFilters()
const { categories, products, total, loading, loadFailed, refetch } = useProductCatalog(filters)
</script>

<template>
  <div>
    <AppHeader
      title="Marketplace"
      subtitle="Supplies that support your farm"
      show-back
      :back-to="{ name: ROUTE_NAMES.orders }"
    >
      <template #trailing><CartLink /></template>
    </AppHeader>
    <main class="marketplace-page">
      <MarketplaceSearch v-model="search" @submit="submitSearch" />
      <CategoryFilter
        v-if="categories.length"
        :categories="categories"
        :selected="selectedCategoryId"
        @select="selectCategory"
      />
      <ProductResults
        :products="products"
        :total="total"
        :loading="loading"
        :failed="loadFailed"
        :sort-by="sortBy"
        @sort="selectSort"
        @retry="refetch()"
        @clear="clear"
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
.marketplace-note {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
  text-align: center;
}
</style>
