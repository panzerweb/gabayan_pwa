import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// Every scheduled task of one cultivation, earliest first as the server orders them.
export function useCultivationTasks(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: computed(() => cultivationsKeys.taskList(cultivationId.value)),
    queryFn: () =>
      repository.listTasks({ cultivationId: cultivationId.value }, session.accessToken ?? ''),
  })

  return {
    tasks: computed(() => query.data.value?.data ?? []),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
