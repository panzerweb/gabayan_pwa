import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { manilaDateToday } from '@core/utils/format'
import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// Today's demo feeding plan in Manila, as the server calculates it from the latest sample and
// the estimated live fish.
export function useFeedingPlan(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()
  const today = manilaDateToday()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.feedingPlan(cultivationId.value, today)),
    queryFn: () => repository.getFeedingPlan(cultivationId.value, session.accessToken ?? '', today),
  })

  return {
    plan: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
