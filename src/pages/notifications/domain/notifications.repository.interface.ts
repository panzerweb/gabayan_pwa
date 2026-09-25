import type { Envelope, Page } from '@core/http'

import type {
  Notification,
  NotificationCategory,
  ReadAllNotificationsRequest,
  UnreadCount,
} from './notifications.model'

export interface NotificationsRepository {
  listNotifications(
    accessToken: string,
    category?: NotificationCategory,
  ): Promise<Page<Notification>>
  getUnreadCount(accessToken: string): Promise<Envelope<UnreadCount>>
  markNotificationRead(notificationId: string, accessToken: string): Promise<Envelope<Notification>>
  markAllNotificationsRead(
    accessToken: string,
    body?: ReadAllNotificationsRequest,
  ): Promise<Envelope<UnreadCount>>
}
