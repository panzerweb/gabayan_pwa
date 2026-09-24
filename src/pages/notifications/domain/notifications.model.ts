import { z } from 'zod'

import { formatManilaDate, manilaDateOf } from '@core/utils/format'
import { quantitySchema, type StatusDisplay } from '@pages/cultivations/domain/cultivations.model'

export const notificationCategorySchema = z.enum(['CULTIVATION', 'ORDER', 'EDUCATION', 'SYSTEM'])

export const notificationTypeSchema = z.enum([
  'FEEDING_DUE',
  'WATER_CHECK_DUE',
  'GROWTH_SAMPLE_DUE',
  'HARVEST_APPROACHING',
  'ORDER_UPDATE',
  'EDUCATIONAL_TIP',
  'SYSTEM',
])

export const notificationSchema = z.object({
  id: z.string(),
  category: notificationCategorySchema,
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  recommendedAmount: quantitySchema.nullable(),
  occurredAt: z.string(),
  readAt: z.string().nullable(),
  action: z.object({ label: z.string(), deepLink: z.string().startsWith('/') }).nullable(),
  cultivationId: z.string().nullable(),
  orderId: z.string().nullable(),
  taskId: z.string().nullable(),
})

export const unreadCountSchema = z.object({ count: z.number().int().nonnegative() })

export type NotificationCategory = z.infer<typeof notificationCategorySchema>
export type NotificationType = z.infer<typeof notificationTypeSchema>
export type Notification = z.infer<typeof notificationSchema>
export type UnreadCount = z.infer<typeof unreadCountSchema>

export interface ReadAllNotificationsRequest {
  category?: NotificationCategory | null
  through?: string | null
}

// One page of 100 covers the notifications a small farm accumulates.
export const NOTIFICATION_LIST_LIMIT = 100

// The filter chips, kept in `?category=`. System notices only appear under All.
export const NOTIFICATION_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Cultivation', value: 'CULTIVATION' },
  { label: 'Orders', value: 'ORDER' },
  { label: 'Learning', value: 'EDUCATION' },
] as const satisfies ReadonlyArray<{ label: string; value: 'all' | NotificationCategory }>

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]['value']

export function notificationFilterFrom(value: unknown): NotificationFilter {
  return NOTIFICATION_FILTERS.find((filter) => filter.value === value)?.value ?? 'all'
}

// The category the API is asked for, or none for All.
export function categoryOf(filter: NotificationFilter): NotificationCategory | undefined {
  return filter === 'all' ? undefined : filter
}

export function notificationCategoryDisplay(category: NotificationCategory): StatusDisplay {
  const displays: Record<NotificationCategory, StatusDisplay> = {
    CULTIVATION: { label: 'Cultivation', tone: 'info', icon: 'fish' },
    ORDER: { label: 'Order', tone: 'info', icon: 'truck' },
    EDUCATION: { label: 'Learning', tone: 'warning', icon: 'star' },
    SYSTEM: { label: 'Gabayan', tone: 'neutral', icon: 'info' },
  }
  return displays[category]
}

export function countUnread(notifications: readonly Pick<Notification, 'readAt'>[]) {
  return notifications.filter((notification) => !notification.readAt).length
}

export interface NotificationDateGroup {
  date: string
  label: string
  notifications: Notification[]
}

// Labels a Manila calendar date relative to today, as contract §12 leaves to the client.
export function notificationDateLabel(date: string, today: string) {
  if (date === today) return 'Today'
  const yesterday = new Date(`${today}T12:00:00+08:00`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  if (date === manilaDateOf(yesterday)) return 'Yesterday'
  return formatManilaDate(`${date}T12:00:00+08:00`)
}

// Groups notifications by the Manila date they occurred on, keeping the server's order.
export function groupNotificationsByDate(
  notifications: readonly Notification[],
  today: string,
): NotificationDateGroup[] {
  const groups: NotificationDateGroup[] = []
  for (const notification of notifications) {
    const date = manilaDateOf(notification.occurredAt)
    let group = groups.find((candidate) => candidate.date === date)
    if (!group) {
      group = { date, label: notificationDateLabel(date, today), notifications: [] }
      groups.push(group)
    }
    group.notifications.push(notification)
  }
  return groups
}

// The optimistic answer to marking one notification read; an already read one keeps its time.
export function withNotificationRead(
  notifications: readonly Notification[],
  notificationId: string,
  readAt: string,
): Notification[] {
  return notifications.map((notification) =>
    notification.id === notificationId && !notification.readAt
      ? { ...notification, readAt }
      : notification,
  )
}

// The optimistic answer to "Mark all read", limited to one category when one is given.
export function withAllNotificationsRead(
  notifications: readonly Notification[],
  readAt: string,
  category?: NotificationCategory,
): Notification[] {
  return notifications.map((notification) =>
    notification.readAt || (category && notification.category !== category)
      ? notification
      : { ...notification, readAt },
  )
}
