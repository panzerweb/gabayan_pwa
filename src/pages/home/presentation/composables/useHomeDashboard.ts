import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { manilaDateToday } from '@core/utils/format'
import { useSessionStore } from '@stores/session.store'

import { homeKeys } from '../../data/home.keys'
import { homeRepository } from '../../data/home.repository'
import { homeHeadline } from '../../domain/home.model'
import type { HomeRepository } from '../../domain/home.repository.interface'

// Today's dashboard: the primary cultivation, today's tasks, the farm overview and a tip.
// The date is fixed when Home opens so the tasks shown match the day they were asked for.
export function useHomeDashboard(repository: HomeRepository = homeRepository) {
  const session = useSessionStore()
  const today = manilaDateToday()

  const query = useQuery({
    queryKey: homeKeys.dashboard(today),
    queryFn: () => repository.getHomeDashboard(today, session.accessToken ?? ''),
  })

  const dashboard = computed(() => query.data.value?.data ?? null)

  return {
    dashboard,
    headline: computed(() => (dashboard.value ? homeHeadline(dashboard.value) : '')),
    unreadCount: computed(() => dashboard.value?.unreadNotificationCount ?? 0),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
