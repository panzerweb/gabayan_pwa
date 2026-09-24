import { z } from 'zod'

import type { AppIconName } from '@components/ui/AppIcon.vue'
import { mediaAssetSchema } from '@core/http'
import { dimensionsSchema, stockingEstimateSchema } from '@/services/api/onboarding'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type StatusDisplay = { label: string; tone: StatusTone; icon: AppIconName }

export const quantitySchema = z.object({
  value: z.number().finite(),
  unit: z.enum(['G', 'KG', 'M', 'M2', 'M3', 'CELSIUS', 'COUNT', 'PERCENT']),
})

const compactSpeciesSchema = z.object({
  id: z.string(),
  commonName: z.string(),
  localName: z.string(),
  image: mediaAssetSchema,
})

const compactEnvironmentSchema = z.object({ id: z.string(), code: z.string(), name: z.string() })

const compactUserSchema = z.object({ id: z.string(), fullName: z.string() })

export const cultivationStatusSchema = z.enum([
  'PLANNING',
  'ACTIVE',
  'GROWING',
  'PRE_HARVEST',
  'COMPLETED',
  'CANCELLED',
])

export const cultivationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  species: compactSpeciesSchema,
  environment: compactEnvironmentSchema,
  status: cultivationStatusSchema,
  dayNumber: z.number().int().nullable(),
  estimatedDurationDays: z.number().int().nullable(),
  progressPercent: z.number().min(0).max(100),
  initialFingerlings: z.number().int().positive(),
  estimatedLiveFish: z.number().int().nonnegative(),
  estimatedHarvestDate: z.string().nullable(),
  nextTaskAt: z.string().nullable(),
  stockingStatus: z.enum(['BELOW_RANGE', 'RECOMMENDED', 'ABOVE_RANGE']),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

const latestGrowthMeasurementSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  measuredOn: z.string(),
  numberOfFishSampled: z.number().int().positive(),
  averageWeight: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

const growthStageSchema = z.object({ code: z.string(), name: z.string(), isEstimated: z.boolean() })

export const harvestReadinessStatusSchema = z.enum([
  'NOT_READY',
  'MONITOR',
  'READY_SOON',
  'POTENTIALLY_READY',
  'INSUFFICIENT_DATA',
])

export const cultivationDetailSchema = cultivationSummarySchema.extend({
  dimensions: dimensionsSchema,
  surfaceAreaM2: z.number().positive(),
  estimatedWaterVolumeM3: z.number().positive(),
  stockedOn: z.string().nullable(),
  recordedMortality: z.number().int().nonnegative(),
  latestGrowthMeasurement: latestGrowthMeasurementSchema.nullable(),
  growthStage: growthStageSchema,
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
    readinessStatus: harvestReadinessStatusSchema,
    estimatedHarvestDate: z.string().nullable(),
  }),
  stockingEstimateSnapshot: stockingEstimateSchema,
  recommendationDisclaimer: z.string().min(1),
  notes: z.string().nullable(),
})

export const timelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  status: z.enum(['COMPLETED', 'CURRENT', 'UPCOMING']),
  occurredOn: z.string().nullable(),
  estimatedOn: z.string().nullable(),
  detail: z.string().nullable(),
})

export const cultivationTimelineSchema = z.object({
  cultivationId: z.string(),
  currentStage: growthStageSchema,
  events: z.array(timelineEventSchema),
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
  audit: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number().int().positive(),
  }),
})

const feedingRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  taskId: z.string(),
  fedAt: z.string(),
  amount: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

export const taskCompletionResultSchema = z.object({
  task: farmTaskSchema,
  linkedRecord: feedingRecordSchema.nullable(),
  cultivationSnapshot: cultivationSummarySchema,
})

export type Quantity = z.infer<typeof quantitySchema>
export type CultivationStatus = z.infer<typeof cultivationStatusSchema>
export type CultivationSummary = z.infer<typeof cultivationSummarySchema>
export type CultivationDetail = z.infer<typeof cultivationDetailSchema>
export type HarvestReadinessStatus = z.infer<typeof harvestReadinessStatusSchema>
export type TimelineEvent = z.infer<typeof timelineEventSchema>
export type CultivationTimeline = z.infer<typeof cultivationTimelineSchema>
export type FarmTask = z.infer<typeof farmTaskSchema>
export type TaskCompletionResult = z.infer<typeof taskCompletionResultSchema>

export interface TaskFilters {
  cultivationId?: string
  date?: string
}

export interface CompleteTaskRequest {
  completedAt: string
  actualAmount?: Quantity
  notes?: string | null
}

// One page of 100 covers every cultivation a small farm runs.
export const CULTIVATION_LIST_LIMIT = 100

export const TASK_COMPLETION_OFFLINE_MESSAGE =
  'Reconnect before recording this feeding. It has not been queued.'

// The All / Active / Completed tab of the cultivation list, held in `?view=`.
export const CULTIVATION_VIEWS = ['all', 'active', 'completed'] as const
export type CultivationView = (typeof CULTIVATION_VIEWS)[number]

export function cultivationViewFrom(value: unknown): CultivationView {
  return value === 'active' || value === 'completed' ? value : 'all'
}

const CLOSED_STATUSES: readonly CultivationStatus[] = ['COMPLETED', 'CANCELLED']

export function filterCultivations<T extends Pick<CultivationSummary, 'status'>>(
  cultivations: readonly T[],
  view: CultivationView,
): T[] {
  if (view === 'completed') return cultivations.filter(({ status }) => status === 'COMPLETED')
  if (view === 'active')
    return cultivations.filter(({ status }) => !CLOSED_STATUSES.includes(status))
  return [...cultivations]
}

// The Overview / Timeline section of a cultivation's detail, held in `?section=`.
export type CultivationSection = 'overview' | 'timeline'

export function cultivationSectionFrom(value: unknown): CultivationSection {
  return value === 'timeline' ? 'timeline' : 'overview'
}

const CULTIVATION_STATUS_DISPLAY: Record<CultivationStatus, StatusDisplay> = {
  PLANNING: { label: 'Planning', tone: 'info', icon: 'info' },
  ACTIVE: { label: 'Active', tone: 'success', icon: 'fish' },
  GROWING: { label: 'Growing', tone: 'success', icon: 'fish' },
  PRE_HARVEST: { label: 'Nearing harvest', tone: 'warning', icon: 'star' },
  COMPLETED: { label: 'Completed', tone: 'neutral', icon: 'check' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: 'warning' },
}

export function cultivationStatusDisplay(status: CultivationStatus): StatusDisplay {
  return CULTIVATION_STATUS_DISPLAY[status]
}

// Readiness is the server's estimate from current measurements; these labels only word it.
const READINESS_DISPLAY: Record<HarvestReadinessStatus, StatusDisplay> = {
  NOT_READY: { label: 'Not ready yet', tone: 'neutral', icon: 'info' },
  MONITOR: { label: 'Keep monitoring', tone: 'info', icon: 'info' },
  READY_SOON: { label: 'May be ready soon', tone: 'warning', icon: 'star' },
  POTENTIALLY_READY: { label: 'May be ready', tone: 'success', icon: 'check' },
  INSUFFICIENT_DATA: { label: 'Needs a recent growth sample', tone: 'warning', icon: 'warning' },
}

export function harvestReadinessDisplay(status: HarvestReadinessStatus): StatusDisplay {
  return READINESS_DISPLAY[status]
}

const TIMELINE_EVENT_DISPLAY: Record<TimelineEvent['status'], StatusDisplay> = {
  COMPLETED: { label: 'Done', tone: 'success', icon: 'check' },
  CURRENT: { label: 'Now', tone: 'info', icon: 'fish' },
  UPCOMING: { label: 'Upcoming', tone: 'neutral', icon: 'info' },
}

export function timelineEventDisplay(status: TimelineEvent['status']): StatusDisplay {
  return TIMELINE_EVENT_DISPLAY[status]
}

// The date a timeline event carries: when it happened, or failing that when it is expected.
export function timelineEventDate(
  event: Pick<TimelineEvent, 'occurredOn' | 'estimatedOn'>,
): { date: string; estimated: boolean } | null {
  if (event.occurredOn) return { date: event.occurredOn, estimated: false }
  if (event.estimatedOn) return { date: event.estimatedOn, estimated: true }
  return null
}

export function taskStatusTone(status: FarmTask['status']): StatusTone {
  if (status === 'COMPLETED') return 'success'
  if (status === 'MISSED') return 'danger'
  return 'info'
}

export function taskIcon(task: Pick<FarmTask, 'status' | 'type'>): AppIconName {
  if (task.status === 'COMPLETED') return 'check'
  if (task.type === 'WATER_CHECK') return 'droplet'
  return 'fish'
}

// Only an open feeding task is completed from a task card; other task types have their
// own record forms.
export function canRecordFeeding(task: Pick<FarmTask, 'status' | 'type'>) {
  return task.type === 'FEEDING' && task.status !== 'COMPLETED'
}

// Validates the amount typed into the feeding form without coercing blanks to zero.
export function feedingAmountError(input: string): string | null {
  const trimmed = input.trim()
  const amount = Number(trimmed)
  if (trimmed === '' || !Number.isFinite(amount) || amount <= 0) {
    return 'Enter an amount greater than 0.'
  }
  return null
}

export function feedingCompletionRequest(
  amount: number,
  unit: Quantity['unit'],
  notes: string,
  completedAt: string,
): CompleteTaskRequest {
  return {
    completedAt,
    actualAmount: { value: amount, unit },
    notes: notes.trim() || null,
  }
}
