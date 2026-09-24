import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { marketplaceKeys } from '../../data/marketplace.keys'
import { marketplaceRepository } from '../../data/marketplace.repository'
import type { ProductFilters } from '../../domain/marketplace.model'
import type { MarketplaceRepository } from '../../domain/marketplace.repository.interface'

// The category chips and the products matching the current filters.
export function useProductCatalog(
  filters: Ref<ProductFilters>,
  repository: MarketplaceRepository = marketplaceRepository,
) {
  const session = useSessionStore()

  const categoriesQuery = useQuery({
    queryKey: marketplaceKeys.categories(),
    queryFn: () => repository.listProductCategories(),
  })

  const productsQuery = useQuery({
    queryKey: computed(() => marketplaceKeys.productList(filters.value)),
    queryFn: () => repository.listProducts(filters.value, session.accessToken ?? ''),
  })

  return {
    categories: computed(() => categoriesQuery.data.value?.data ?? []),
    products: computed(() => productsQuery.data.value?.data ?? []),
    total: computed(() => productsQuery.data.value?.page.total ?? 0),
    loading: computed(() => productsQuery.isPending.value),
    loadFailed: computed(() => productsQuery.isError.value),
    refetch: productsQuery.refetch,
  }
}
