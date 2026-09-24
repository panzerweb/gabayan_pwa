import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// A cultivation's stages from stocking to the estimated harvest window. Fetched only while
// `enabled` is true, so the overview does not wait on it.
export function useCultivationTimeline(
  cultivationId: Ref<string>,
  enabled: Ref<boolean>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.timeline(cultivationId.value)),
    queryFn: () =>
      repository.getCultivationTimeline(cultivationId.value, session.accessToken ?? ''),
    enabled,
  })

  return {
    timeline: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
