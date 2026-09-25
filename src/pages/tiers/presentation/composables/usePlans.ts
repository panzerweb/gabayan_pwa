import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { tiersKeys } from '../../data/tiers.keys'
import { tiersRepository } from '../../data/tiers.repository'
import type { TiersRepository } from '../../domain/tiers.repository.interface'

// The plans an account can be on, from Free upward, as the server lists them.
export function usePlans(repository: TiersRepository = tiersRepository) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: tiersKeys.plans(),
    queryFn: () => repository.listPlans(session.accessToken ?? ''),
  })

  return {
    plans: computed(() => query.data.value?.data ?? []),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
