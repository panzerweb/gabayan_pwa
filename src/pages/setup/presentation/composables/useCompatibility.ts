import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { setupKeys } from '../../data/setup.keys'
import { setupRepository } from '../../data/setup.repository'
import { canContinueFromEnvironment } from '../../domain/setup.model'
import type { SetupRepository } from '../../domain/setup.repository.interface'
import { useSetupStore } from '../stores/setup.store'

// The server's compatibility check for the species and environment in the draft, asked again
// whenever either pick changes. The environment step stays closed until it has answered.
export function useCompatibility(repository: SetupRepository = setupRepository) {
  const setup = useSetupStore()
  const speciesId = computed(() => setup.draft.speciesId ?? '')
  const environmentId = computed(() => setup.draft.environmentId ?? '')
  const enabled = computed(() => Boolean(speciesId.value && environmentId.value))

  const query = useQuery({
    queryKey: computed(() => setupKeys.compatibility(speciesId.value, environmentId.value)),
    queryFn: () => repository.getCompatibility(speciesId.value, environmentId.value),
    enabled,
  })

  const compatibility = computed(() => (enabled.value ? query.data.value?.data : undefined))
  const checking = computed(() => enabled.value && query.isFetching.value)

  return {
    compatibility,
    checking,
    checkFailed: computed(() => enabled.value && query.isError.value),
    recheck: query.refetch,
    canContinue: computed(() =>
      canContinueFromEnvironment(setup.draft.environmentId, compatibility.value, checking.value),
    ),
  }
}
