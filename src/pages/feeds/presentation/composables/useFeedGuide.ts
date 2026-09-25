import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { ApiError } from '@core/http'
import { useSessionStore } from '@stores/session.store'

import { feedsKeys } from '../../data/feeds.keys'
import { feedsRepository } from '../../data/feeds.repository'
import { feedStageFor } from '../../domain/feeds.model'
import type { FeedsRepository } from '../../domain/feeds.repository.interface'

// One species' feed guide, and the stage matching a cultivation's current growth stage when
// one is given. A species with no guide answers 404, which is shown as "no guide yet" rather
// than a failure to retry.
export function useFeedGuide(
  speciesId: Ref<string>,
  growthStageCode: Ref<string | null> = computed(() => null),
  repository: FeedsRepository = feedsRepository,
) {
  const session = useSessionStore()
  const enabled = computed(() => Boolean(speciesId.value))

  const query = useQuery({
    queryKey: computed(() => feedsKeys.guide(speciesId.value)),
    queryFn: () => repository.getFeedGuide(speciesId.value, session.accessToken ?? ''),
    enabled,
  })

  const guide = computed(() => (enabled.value ? (query.data.value?.data ?? null) : null))
  const notFound = computed(() => {
    const error = query.error.value
    return error instanceof ApiError && error.status === 404
  })

  return {
    guide,
    currentStage: computed(() =>
      guide.value && growthStageCode.value
        ? feedStageFor(guide.value, growthStageCode.value)
        : null,
    ),
    loading: computed(() => enabled.value && query.isPending.value),
    loadFailed: computed(() => query.isError.value && !notFound.value),
    notFound,
    refetch: query.refetch,
  }
}
