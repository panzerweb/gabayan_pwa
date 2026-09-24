import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import { canRecordHarvest } from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// The server's harvest-readiness estimate from the latest growth sample, and whether it is far
// enough along for the harvest form to be offered.
export function useHarvestReadiness(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.harvestReadiness(cultivationId.value)),
    queryFn: () => repository.getHarvestReadiness(cultivationId.value, session.accessToken ?? ''),
  })

  const readiness = computed(() => query.data.value?.data ?? null)

  return {
    readiness,
    canRecord: computed(() => (readiness.value ? canRecordHarvest(readiness.value.status) : false)),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
