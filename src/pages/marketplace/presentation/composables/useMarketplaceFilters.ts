import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'

import {
  DEFAULT_PRODUCT_SORT,
  marketplaceQueryFrom,
  productFiltersFrom,
  type MarketplaceQuery,
  type ProductSortOption,
} from '../../domain/marketplace.model'

// The marketplace filters, held in the route query so a filtered list can be shared and
// survives a reload. The search box keeps its own draft until it is submitted.
export function useMarketplaceFilters() {
  const route = useRoute()
  const router = useRouter()

  const state = computed(() => marketplaceQueryFrom(route.query))
  const filters = computed(() => productFiltersFrom(state.value))
  const search = ref(state.value.search)

  watch(
    () => state.value.search,
    (value) => {
      search.value = value
    },
  )

  function update(changes: Partial<MarketplaceQuery>) {
    const next = { ...state.value, ...changes }
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === 'sortBy' && value === DEFAULT_PRODUCT_SORT)) query[key] = value
    }
    return router.replace({ name: ROUTE_NAMES.marketplace, query })
  }

  function submitSearch() {
    return update({ search: search.value.trim() })
  }

  function selectCategory(categoryId: string) {
    return update({ categoryId })
  }

  function selectSort(sortBy: ProductSortOption) {
    return update({ sortBy })
  }

  function clear() {
    search.value = ''
    return router.replace({ name: ROUTE_NAMES.marketplace, query: {} })
  }

  return {
    search,
    selectedCategoryId: computed(() => state.value.categoryId),
    sortBy: computed(() => state.value.sortBy),
    filters,
    submitSearch,
    selectCategory,
    selectSort,
    clear,
  }
}
