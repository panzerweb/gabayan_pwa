import type { NotificationFilter } from '../domain/notifications.model'

// Query keys for notifications, all under `['notifications']`, the prefix task completion
// and order placement invalidate.
export const notificationsKeys = {
  all: () => ['notifications'] as const,
  lists: () => ['notifications', 'list'] as const,
  list: (filter: NotificationFilter) => ['notifications', 'list', filter] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
}
