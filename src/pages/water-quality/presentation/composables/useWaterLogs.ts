import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { requiredTierOf } from '@pages/tiers/domain/tiers.model'
import { useSessionStore } from '@stores/session.store'

import { waterQualityKeys } from '../../data/water-quality.keys'
import { waterQualityRepository } from '../../data/water-quality.repository'
import type { WaterQualityRepository } from '../../domain/water-quality.repository.interface'

// A cultivation's saved water-parameter logs (Pro), newest first as the server lists them.
// A plan refusal is returned as the plan it needs rather than as a failure to retry.
export function useWaterLogs(
  cultivationId: Ref<string>,
  repository: WaterQualityRepository = waterQualityRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => waterQualityKeys.logs(cultivationId.value)),
    queryFn: () =>
      repository.listWaterParameterLogs(cultivationId.value, session.accessToken ?? ''),
  })

  const requiredTier = computed(() => requiredTierOf(query.error.value))

  return {
    logs: computed(() => query.data.value?.data ?? []),
    loading: computed(() => query.isPending.value && !query.isError.value),
    loadFailed: computed(() => query.isError.value && !requiredTier.value),
    requiredTier,
    refetch: query.refetch,
  }
}
