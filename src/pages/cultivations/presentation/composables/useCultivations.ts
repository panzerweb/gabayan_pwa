import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

import { cultivationsKeys } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import {
  cultivationViewFrom,
  filterCultivations,
  type CultivationView,
} from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

// The farmer's cultivations with the All / Active / Completed tab, which lives in `?view=`.
export function useCultivations(repository: CultivationsRepository = cultivationsRepository) {
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()

  const query = useQuery({
    queryKey: cultivationsKeys.list(),
    queryFn: () => repository.listCultivations(session.accessToken ?? ''),
  })

  const view = computed(() => cultivationViewFrom(route.query.view))
  const cultivations = computed(() => filterCultivations(query.data.value?.data ?? [], view.value))

  function selectView(next: CultivationView) {
    return router.replace({
      name: ROUTE_NAMES.cultivations,
      query: next === 'all' ? {} : { view: next },
    })
  }

  return {
    cultivations,
    view,
    selectView,
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
