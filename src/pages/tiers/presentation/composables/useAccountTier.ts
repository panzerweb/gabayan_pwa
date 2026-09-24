import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { tiersKeys } from '../../data/tiers.keys'
import { tiersRepository } from '../../data/tiers.repository'
import type { TiersRepository } from '../../domain/tiers.repository.interface'

// The signed-in account's plan, how many culture systems it has in use, and any plan
// request still waiting for review.
export function useAccountTier(repository: TiersRepository = tiersRepository) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: tiersKeys.account(),
    queryFn: () => repository.getAccountTier(session.accessToken ?? ''),
  })

  return {
    accountTier: computed(() => query.data.value?.data ?? null),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
