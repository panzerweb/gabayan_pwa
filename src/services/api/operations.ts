import { z } from 'zod'

import { apiRequest } from './http'
import { cultivationSummarySchema, dimensionsSchema, stockingEstimateSchema } from './onboarding'
import { envelopeSchema, mediaAssetSchema, pageSchema, sourceStatusSchema } from './schemas'

export const quantitySchema = z.object({
  value: z.number().finite(),
  unit: z.enum(['G', 'KG', 'M', 'M2', 'M3', 'CELSIUS', 'COUNT', 'PERCENT']),
})

const auditSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const farmTaskSchema = z.object({
  id: z.string().min(1),
  cultivationId: z.string().min(1),
  type: z.enum([
    'FEEDING',
    'WATER_CHECK',
    'WATER_MAINTENANCE',
    'EQUIPMENT_INSPECTION',
    'GROWTH_SAMPLING',
    'CAGE_NET_INSPECTION',
    'HARVEST_PREPARATION',
    'CUSTOM',
  ]),
  title: z.string().min(1),
  instruction: z.string().min(1),
  scheduledAt: z.string().min(1),
  dueAt: z.string().min(1),
  status: z.enum(['UPCOMING', 'DUE', 'COMPLETED', 'MISSED', 'CANCELLED']),
  recommendedAmount: quantitySchema.nullable(),
  completedAt: z.string().nullable(),
  completionRecordType: z.string().nullable(),
  completionRecordId: z.string().nullable(),
  deepLink: z.string().startsWith('/'),
  audit: auditSchema,
})

const growthMeasurementSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  measuredOn: z.string(),
  numberOfFishSampled: z.number().int().positive(),
  averageWeight: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: z.object({ id: z.string(), fullName: z.string() }),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const cultivationDetailSchema = cultivationSummarySchema.extend({
  dimensions: dimensionsSchema,
  surfaceAreaM2: z.number().positive(),
  estimatedWaterVolumeM3: z.number().positive(),
  stockedOn: z.string().nullable(),
  recordedMortality: z.number().int().nonnegative(),
  latestGrowthMeasurement: growthMeasurementSchema.nullable(),
  growthStage: z.object({ code: z.string(), name: z.string(), isEstimated: z.boolean() }),
  feedingSummary: z
    .object({
      dailyFeed: quantitySchema,
      feedingsPerDay: z.number().int().positive(),
      nextFeedingAt: z.string(),
      planId: z.string(),
    })
    .nullable(),
  harvestSummary: z.object({
    targetWeight: quantitySchema.nullable(),
    readinessStatus: z.enum([
      'NOT_READY',
      'MONITOR',
      'READY_SOON',
      'POTENTIALLY_READY',
      'INSUFFICIENT_DATA',
    ]),
    estimatedHarvestDate: z.string().nullable(),
  }),
  stockingEstimateSnapshot: stockingEstimateSchema,
  recommendationDisclaimer: z.string().min(1),
  notes: z.string().nullable(),
})

export const cultivationTimelineSchema = z.object({
  cultivationId: z.string(),
  currentStage: z.object({ code: z.string(), name: z.string(), isEstimated: z.boolean() }),
  events: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      label: z.string(),
      status: z.enum(['COMPLETED', 'CURRENT', 'UPCOMING']),
      occurredOn: z.string().nullable(),
      estimatedOn: z.string().nullable(),
      detail: z.string().nullable(),
    }),
  ),
})

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

const feedingRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  taskId: z.string(),
  fedAt: z.string(),
  amount: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: z.object({ id: z.string(), fullName: z.string() }),
  createdAt: z.string(),
})

const taskCompletionResultSchema = z.object({
  task: farmTaskSchema,
  linkedRecord: feedingRecordSchema.nullable(),
  cultivationSnapshot: cultivationSummarySchema,
})

const unreadCountSchema = z.object({ count: z.number().int().nonnegative() })

export type Quantity = z.infer<typeof quantitySchema>
export type FarmTask = z.infer<typeof farmTaskSchema>
export type CultivationDetail = z.infer<typeof cultivationDetailSchema>
export type CultivationTimeline = z.infer<typeof cultivationTimelineSchema>
export type HomeDashboard = z.infer<typeof homeDashboardSchema>
export type Notification = z.infer<typeof notificationSchema>

export const operationalQueryKeys = {
  home: (date: string) => ['home-dashboard', date] as const,
  cultivations: ['cultivations'] as const,
  cultivation: (id: string) => ['cultivation', id] as const,
  timeline: (id: string) => ['cultivation-timeline', id] as const,
  tasks: (cultivationId?: string) => ['tasks', cultivationId ?? 'all'] as const,
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

export function getCultivation(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(cultivationDetailSchema),
  })
}

export function getCultivationTimeline(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/timeline`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(cultivationTimelineSchema),
  })
}

export function listTasks(
  accessToken: string,
  params: { date?: string; cultivationId?: string } = {},
) {
  const query = new URLSearchParams({ limit: '100' })
  if (params.date) query.set('date', params.date)
  if (params.cultivationId) query.set('cultivationId', params.cultivationId)
  return apiRequest(`/tasks?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(farmTaskSchema),
  })
}

export function completeTask(
  taskId: string,
  body: { completedAt: string; actualAmount?: Quantity; notes?: string | null },
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest(`/tasks/${taskId}/complete`, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(taskCompletionResultSchema),
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
