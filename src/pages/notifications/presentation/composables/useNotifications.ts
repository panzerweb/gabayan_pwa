import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Page } from '@core/http'
import { manilaDateToday } from '@core/utils/format'
import { homeKeys } from '@pages/home/data/home.keys'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { notificationsKeys } from '../../data/notifications.keys'
import { notificationsRepository } from '../../data/notifications.repository'
import {
  categoryOf,
  countUnread,
  groupNotificationsByDate,
  notificationFilterFrom,
  withAllNotificationsRead,
  withNotificationRead,
  type Notification,
  type NotificationFilter,
} from '../../domain/notifications.model'
import type { NotificationsRepository } from '../../domain/notifications.repository.interface'

const READ_FAILED = 'We couldn’t mark that notification as read. Please try again.'
const READ_ALL_FAILED = 'We couldn’t mark your notifications as read. Please try again.'

type ListSnapshot = [QueryKey, Page<Notification> | undefined][]

// The notification list with its category filter in `?category=`, grouped by Manila date.
// Contract §14 allows read state to be optimistic: every cached list shows the change at
// once, goes back if the server refuses, and the lists and Home's unread count refresh
// either way.
export function useNotifications(repository: NotificationsRepository = notificationsRepository) {
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const today = manilaDateToday()
  const accessToken = () => session.accessToken ?? ''

  const filter = computed(() => notificationFilterFrom(route.query.category))

  const query = useQuery({
    queryKey: computed(() => notificationsKeys.list(filter.value)),
    queryFn: () => repository.listNotifications(accessToken(), categoryOf(filter.value)),
  })

  const notifications = computed(() => query.data.value?.data ?? [])

  async function updateLists(
    update: (items: readonly Notification[]) => Notification[],
  ): Promise<ListSnapshot> {
    const queryKey = notificationsKeys.lists()
    await queryClient.cancelQueries({ queryKey })
    const snapshot = queryClient.getQueriesData<Page<Notification>>({ queryKey })
    queryClient.setQueriesData<Page<Notification>>({ queryKey }, (current) =>
      current ? { ...current, data: update(current.data) } : current,
    )
    return snapshot
  }

  function restoreLists(snapshot: ListSnapshot | undefined) {
    for (const [queryKey, data] of snapshot ?? []) queryClient.setQueryData(queryKey, data)
  }

  function refreshAfterRead() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all() }),
      queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
    ])
  }

  const readMutation = useMutation({
    mutationFn: (notificationId: string) =>
      repository.markNotificationRead(notificationId, accessToken()),
    onMutate: (notificationId) =>
      updateLists((items) => withNotificationRead(items, notificationId, new Date().toISOString())),
    onError: (_error, _notificationId, snapshot) => {
      restoreLists(snapshot)
      toast.show(READ_FAILED, 'danger')
    },
    onSettled: refreshAfterRead,
  })

  const readAllMutation = useMutation({
    mutationFn: (filterAtRequest: NotificationFilter) => {
      const category = categoryOf(filterAtRequest)
      return repository.markAllNotificationsRead(accessToken(), category ? { category } : undefined)
    },
    onMutate: (filterAtRequest) =>
      updateLists((items) =>
        withAllNotificationsRead(items, new Date().toISOString(), categoryOf(filterAtRequest)),
      ),
    onError: (_error, _filter, snapshot) => {
      restoreLists(snapshot)
      toast.show(READ_ALL_FAILED, 'danger')
    },
    onSettled: refreshAfterRead,
  })

  function selectFilter(next: NotificationFilter) {
    return router.replace({
      name: ROUTE_NAMES.notifications,
      query: next === 'all' ? {} : { category: next },
    })
  }

  function markRead(notification: Notification) {
    if (!notification.readAt) readMutation.mutate(notification.id)
  }

  // Marks the notification read and follows its action. The API publishes the deep link as
  // a path (contract §12); it is resolved to a named route, and one that matches no screen
  // leaves the farmer on the list.
  async function openNotification(notification: Notification) {
    markRead(notification)
    if (!notification.action) return
    const target = router.resolve(notification.action.deepLink)
    if (!target.name || target.name === ROUTE_NAMES.notFound) return
    await router.push({
      name: target.name,
      params: target.params,
      query: target.query,
      hash: target.hash,
    })
  }

  return {
    filter,
    selectFilter,
    groups: computed(() => groupNotificationsByDate(notifications.value, today)),
    isEmpty: computed(() => notifications.value.length === 0),
    unreadCount: computed(() => countUnread(notifications.value)),
    loading: computed(() => query.isPending.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
    markRead,
    markAllRead: () => readAllMutation.mutate(filter.value),
    markingAll: computed(() => readAllMutation.isPending.value),
    openNotification,
  }
}
