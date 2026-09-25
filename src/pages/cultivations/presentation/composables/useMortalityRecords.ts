import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// The losses recorded for a cultivation, which the server subtracts from its live-fish estimate.
export function useMortalityRecords(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.mortality(cultivationId.value)),
    queryFn: () => repository.listMortalityRecords(cultivationId.value, session.accessToken ?? ''),
  })

  return {
    records: computed(() => query.data.value?.data ?? []),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
