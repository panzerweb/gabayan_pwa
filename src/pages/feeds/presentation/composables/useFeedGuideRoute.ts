import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'

function queryText(value: unknown) {
  return typeof value === 'string' && value ? value : null
}

// What the feed-guide route names: the species, and when opened from a cultivation, that
// cultivation and its stage, so the stage can be marked and "back" returns to its feed plan.
export function useFeedGuideRoute() {
  const route = useRoute()

  const speciesId = computed(() => String(route.params.speciesId ?? ''))
  const cultivationId = computed(() => queryText(route.query.cultivationId))
  const stage = computed(() => queryText(route.query.stage))
  const backTo = computed(() =>
    cultivationId.value
      ? {
          name: ROUTE_NAMES.cultivationRecords,
          params: { cultivationId: cultivationId.value },
          query: { tab: 'plan' },
        }
      : { name: ROUTE_NAMES.home },
  )

  return { speciesId, cultivationId, stage, backTo }
}
