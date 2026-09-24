import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { setupKeys } from '../../data/setup.keys'
import { setupRepository } from '../../data/setup.repository'
import type { SetupRepository } from '../../domain/setup.repository.interface'
import { useSetupStore } from '../stores/setup.store'

// Species and culture environments rarely change, so one read serves the whole wizard.
const REFERENCE_STALE_TIME = 10 * 60_000

// The species and culture environments the farmer picks from, and their picks. Both lists
// load together, so the environment step usually opens with its list already in hand.
export function useSetupOptions(repository: SetupRepository = setupRepository) {
  const setup = useSetupStore()

  const speciesQuery = useQuery({
    queryKey: setupKeys.species(),
    queryFn: () => repository.listSpecies({ active: true }),
    staleTime: REFERENCE_STALE_TIME,
  })
  const environmentsQuery = useQuery({
    queryKey: setupKeys.environments(),
    queryFn: () => repository.listCultureEnvironments(),
    staleTime: REFERENCE_STALE_TIME,
  })

  return {
    species: computed(() => speciesQuery.data.value?.data ?? []),
    speciesLoading: computed(() => speciesQuery.isPending.value),
    speciesLoadFailed: computed(() => speciesQuery.isError.value),
    refetchSpecies: speciesQuery.refetch,
    environments: computed(() => environmentsQuery.data.value?.data ?? []),
    environmentsLoading: computed(() => environmentsQuery.isPending.value),
    environmentsLoadFailed: computed(() => environmentsQuery.isError.value),
    refetchEnvironments: environmentsQuery.refetch,
    selectedSpeciesId: computed(() => setup.draft.speciesId),
    selectedEnvironmentId: computed(() => setup.draft.environmentId),
    selectSpecies: setup.selectSpecies,
    selectEnvironment: setup.selectEnvironment,
  }
}
