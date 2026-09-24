import { z } from 'zod'

import {
  apiRequest,
  envelopeSchema,
  mediaAssetSchema,
  pageSchema,
  sourceStatusSchema,
} from '@core/http'

import {
  cultivationSummarySchema,
  farmTaskSchema,
  quantitySchema,
} from '@pages/cultivations/domain/cultivations.model'

const educationalTipSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  image: mediaAssetSchema.nullable(),
  learnMoreUrl: z.string().nullable(),
  sourceStatus: sourceStatusSchema,
  isDemo: z.boolean(),
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export const homeDashboardSchema = z.object({
  date: z.string(),
  greetingName: z.string(),
  primaryCultivation: cultivationSummarySchema.nullable(),
  taskSummary: z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  tasks: z.array(farmTaskSchema),
  farmOverview: z
    .object({
      fishAgeDays: z.number().int().nullable(),
      estimatedAverageWeight: quantitySchema.nullable(),
      dailyFeed: quantitySchema.nullable(),
      daysUntilHarvest: z.number().int().nonnegative().nullable(),
    })
    .nullable(),
  tip: educationalTipSchema,
  unreadNotificationCount: z.number().int().nonnegative(),
})

export const notificationSchema = z.object({
  id: z.string(),
  category: z.enum(['CULTIVATION', 'ORDER', 'EDUCATION', 'SYSTEM']),
  type: z.enum([
    'FEEDING_DUE',
    'WATER_CHECK_DUE',
    'GROWTH_SAMPLE_DUE',
    'HARVEST_APPROACHING',
    'ORDER_UPDATE',
    'EDUCATIONAL_TIP',
    'SYSTEM',
  ]),
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

const unreadCountSchema = z.object({ count: z.number().int().nonnegative() })

export type {
  CultivationDetail,
  CultivationTimeline,
  FarmTask,
  Quantity,
} from '@pages/cultivations/domain/cultivations.model'
export type HomeDashboard = z.infer<typeof homeDashboardSchema>
export type Notification = z.infer<typeof notificationSchema>

export const operationalQueryKeys = {
  home: (date: string) => ['home-dashboard', date] as const,
  notifications: (category?: string) => ['notifications', category ?? 'all'] as const,
  unreadNotifications: ['notifications', 'unread-count'] as const,
}

export function getHomeDashboard(date: string, accessToken: string) {
  return apiRequest(`/dashboard/home?date=${encodeURIComponent(date)}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(homeDashboardSchema),
  })
}

export function listNotifications(accessToken: string, category?: Notification['category']) {
  const query = new URLSearchParams({ limit: '100' })
  if (category) query.set('category', category)
  return apiRequest(`/notifications?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(notificationSchema),
  })
}

export function getUnreadNotificationCount(accessToken: string) {
  return apiRequest('/notifications/unread-count', {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(unreadCountSchema),
  })
}

export function markNotificationRead(notificationId: string, accessToken: string) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'POST',
    accessToken,
    schema: envelopeSchema(notificationSchema),
  })
}

export function markAllNotificationsRead(accessToken: string) {
  return apiRequest('/notifications/read-all', {
    method: 'POST',
    accessToken,
    schema: envelopeSchema(unreadCountSchema),
  })
}
