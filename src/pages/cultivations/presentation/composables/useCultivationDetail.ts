import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// One cultivation's stock, feeding and harvest summaries as the server last calculated them.
export function useCultivationDetail(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.detail(cultivationId.value)),
    queryFn: () => repository.getCultivation(cultivationId.value, session.accessToken ?? ''),
  })

  return {
    cultivation: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
