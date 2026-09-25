import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { requiredTierOf } from '@pages/tiers/domain/tiers.model'
import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// The feed conversion ratio (Pro) the server derives from the cultivation's records. A plan
// refusal is returned as the plan it needs rather than as a failure to retry.
export function useFeedConversion(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.feedConversion(cultivationId.value)),
    queryFn: () => repository.getFeedConversion(cultivationId.value, session.accessToken ?? ''),
  })

  const requiredTier = computed(() => requiredTierOf(query.error.value))

  return {
    conversion: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value && !query.isError.value),
    loadFailed: computed(() => query.isError.value && !requiredTier.value),
    requiredTier,
    refetch: query.refetch,
  }
}
