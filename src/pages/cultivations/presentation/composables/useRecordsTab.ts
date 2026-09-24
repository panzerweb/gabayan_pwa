import { computed, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'

import { recordsTabFrom, type RecordsTab } from '../../domain/cultivations.model'

// The Feeding / Mortality / Water / Feed plan tab of the farm records, kept in `?tab=` so a
// link or a reload opens the same tab. Feeding, the default, leaves the query empty.
export function useRecordsTab(cultivationId: Ref<string>) {
  const route = useRoute()
  const router = useRouter()

  const tab = computed(() => recordsTabFrom(route.query.tab))

  function selectTab(next: RecordsTab) {
    return router.replace({
      name: ROUTE_NAMES.cultivationRecords,
      params: { cultivationId: cultivationId.value },
      query: next === 'feeding' ? {} : { tab: next },
    })
  }

  return { tab, selectTab }
}
