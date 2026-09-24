import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  NOTIFICATION_LIST_LIMIT,
  notificationSchema,
  unreadCountSchema,
  type NotificationCategory,
  type ReadAllNotificationsRequest,
} from '../domain/notifications.model'

// Newest first, as the API orders them; `category` narrows to one kind.
export async function listNotificationsApi(accessToken: string, category?: NotificationCategory) {
  const query = new URLSearchParams({ limit: String(NOTIFICATION_LIST_LIMIT) })
  if (category) query.set('category', category)
  return apiRequest(`${ENDPOINTS.notifications.root}?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(notificationSchema),
  })
}

export async function getUnreadCountApi(accessToken: string) {
  return apiRequest(ENDPOINTS.notifications.unreadCount, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(unreadCountSchema),
  })
}

export async function markNotificationReadApi(notificationId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.notifications.read(notificationId), {
    method: 'POST',
    accessToken,
    schema: envelopeSchema(notificationSchema),
  })
}

// Without a body every notification is marked read; `category` and `through` narrow it.
export async function markAllNotificationsReadApi(
  accessToken: string,
  body?: ReadAllNotificationsRequest,
) {
  return apiRequest(ENDPOINTS.notifications.readAll, {
    method: 'POST',
    accessToken,
    body,
    schema: envelopeSchema(unreadCountSchema),
  })
}
