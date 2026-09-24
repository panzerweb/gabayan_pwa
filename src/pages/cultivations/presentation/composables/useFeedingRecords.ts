import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// The feedings recorded for a cultivation, each one saved by completing a feeding task.
export function useFeedingRecords(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.feedingRecords(cultivationId.value)),
    queryFn: () => repository.listFeedingRecords(cultivationId.value, session.accessToken ?? ''),
  })

  return {
    records: computed(() => query.data.value?.data ?? []),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
