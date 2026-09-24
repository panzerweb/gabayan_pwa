import type { NotificationsRepository } from '../domain/notifications.repository.interface'
import {
  getUnreadCountApi,
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from './notifications.api'

export const notificationsRepository: NotificationsRepository = {
  listNotifications: listNotificationsApi,
  getUnreadCount: getUnreadCountApi,
  markNotificationRead: markNotificationReadApi,
  markAllNotificationsRead: markAllNotificationsReadApi,
}
