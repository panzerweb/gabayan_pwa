import { computed, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'

import { cultivationSectionFrom, type CultivationSection } from '../../domain/cultivations.model'

// The Overview / Timeline section of the cultivation detail, kept in `?section=` so a link
// or a reload opens the same section.
export function useCultivationSection(cultivationId: Ref<string>) {
  const route = useRoute()
  const router = useRouter()

  const section = computed(() => cultivationSectionFrom(route.query.section))

  function selectSection(next: CultivationSection) {
    return router.replace({
      name: ROUTE_NAMES.cultivationDetail,
      params: { cultivationId: cultivationId.value },
      query: next === 'overview' ? {} : { section: next },
    })
  }

  return { section, selectSection }
}
