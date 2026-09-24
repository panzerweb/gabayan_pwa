import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { ApiError } from '@core/http'

import { setupKeys } from '../../data/setup.keys'
import { setupRepository } from '../../data/setup.repository'
import type { SetupRepository } from '../../domain/setup.repository.interface'

// Sizing figures are reference data, so one read serves the wizard.
const SIZING_STALE_TIME = 10 * 60_000

// The suggested pond or cage size and depth for one fish in one culture system. A pairing the
// profile advises against has no size; its message is returned instead of a retry.
export function useSizingGuidance(
  speciesId: Ref<string>,
  environmentId: Ref<string>,
  repository: SetupRepository = setupRepository,
) {
  const enabled = computed(() => Boolean(speciesId.value && environmentId.value))

  const query = useQuery({
    queryKey: computed(() => setupKeys.sizing(speciesId.value, environmentId.value)),
    queryFn: () => repository.getSizingGuidance(speciesId.value, environmentId.value),
    enabled,
    staleTime: SIZING_STALE_TIME,
  })

  const incompatibleMessage = computed(() => {
    const error = query.error.value
    return error instanceof ApiError && error.code === 'INCOMPATIBLE_SELECTION'
      ? error.message
      : null
  })

  return {
    guidance: computed(() => (enabled.value ? (query.data.value?.data ?? null) : null)),
    loading: computed(() => enabled.value && query.isPending.value),
    loadFailed: computed(() => query.isError.value && !incompatibleMessage.value),
    incompatibleMessage,
    refetch: query.refetch,
  }
}
