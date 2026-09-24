import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { ApiError } from '@core/http'
import { useSessionStore } from '@stores/session.store'

import { waterQualityKeys } from '../../data/water-quality.keys'
import { waterQualityRepository } from '../../data/water-quality.repository'
import type { WaterQualityRepository } from '../../domain/water-quality.repository.interface'

// The suggested water ranges for one species in one culture system, asked again whenever
// either changes. A pairing the profile advises against has no ranges; its message is
// returned instead of a retry.
export function useWaterThresholds(
  speciesId: Ref<string>,
  environmentId: Ref<string>,
  repository: WaterQualityRepository = waterQualityRepository,
) {
  const session = useSessionStore()
  const enabled = computed(() => Boolean(speciesId.value && environmentId.value))

  const query = useQuery({
    queryKey: computed(() => waterQualityKeys.thresholds(speciesId.value, environmentId.value)),
    queryFn: () =>
      repository.getWaterThresholds(
        speciesId.value,
        environmentId.value,
        session.accessToken ?? '',
      ),
    enabled,
  })

  const incompatibleMessage = computed(() => {
    const error = query.error.value
    return error instanceof ApiError && error.code === 'INCOMPATIBLE_SELECTION'
      ? error.message
      : null
  })

  return {
    thresholdSet: computed(() => (enabled.value ? (query.data.value?.data ?? null) : null)),
    loading: computed(() => enabled.value && query.isPending.value),
    loadFailed: computed(() => query.isError.value && !incompatibleMessage.value),
    incompatibleMessage,
    refetch: query.refetch,
  }
}
