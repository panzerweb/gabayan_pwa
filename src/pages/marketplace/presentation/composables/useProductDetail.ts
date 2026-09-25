import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { marketplaceKeys } from '../../data/marketplace.keys'
import { marketplaceRepository } from '../../data/marketplace.repository'
import type { MarketplaceRepository } from '../../domain/marketplace.repository.interface'

// One product with its description, specifications and any setup recommendation.
export function useProductDetail(
  productId: Ref<string>,
  repository: MarketplaceRepository = marketplaceRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => marketplaceKeys.product(productId.value)),
    queryFn: () => repository.getProduct(productId.value, session.accessToken ?? ''),
  })

  return {
    product: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
