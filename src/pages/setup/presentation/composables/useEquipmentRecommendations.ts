import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { setupKeys } from '../../data/setup.keys'
import { setupRepository } from '../../data/setup.repository'
import { recommendedProducts } from '../../domain/setup.model'
import type { SetupRepository } from '../../domain/setup.repository.interface'

// The optional equipment the server suggests for a newly created cultivation. The list is
// supporting material: a failure here never hides that the cultivation was saved.
export function useEquipmentRecommendations(
  cultivationId: Ref<string>,
  repository: SetupRepository = setupRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => setupKeys.equipmentRecommendations(cultivationId.value)),
    queryFn: () =>
      repository.getEquipmentRecommendations(cultivationId.value, session.accessToken ?? ''),
  })

  const recommendations = computed(() => query.data.value?.data ?? null)

  return {
    recommendations,
    products: computed(() =>
      recommendations.value ? recommendedProducts(recommendations.value) : [],
    ),
    // Opens the marketplace filtered to the cultivation's species and environment.
    marketplaceQuery: computed(() => {
      const context = recommendations.value?.context
      return context ? { speciesId: context.species.id, environmentId: context.environment.id } : {}
    }),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
