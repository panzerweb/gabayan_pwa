import { z } from 'zod'

import { mediaAssetSchema, sourceStatusSchema } from '@core/http'
import {
  cultivationSummarySchema,
  farmTaskSchema,
  quantitySchema,
  type StatusDisplay,
} from '@pages/cultivations/domain/cultivations.model'

export const educationalTipSchema = z.object({
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

export const taskSummarySchema = z.object({
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})

export const farmOverviewSchema = z.object({
  fishAgeDays: z.number().int().nullable(),
  estimatedAverageWeight: quantitySchema.nullable(),
  dailyFeed: quantitySchema.nullable(),
  daysUntilHarvest: z.number().int().nonnegative().nullable(),
})

export const homeDashboardSchema = z.object({
  date: z.string(),
  greetingName: z.string(),
  primaryCultivation: cultivationSummarySchema.nullable(),
  taskSummary: taskSummarySchema,
  tasks: z.array(farmTaskSchema),
  farmOverview: farmOverviewSchema.nullable(),
  tip: educationalTipSchema,
  unreadNotificationCount: z.number().int().nonnegative(),
})

export type EducationalTip = z.infer<typeof educationalTipSchema>
export type TaskSummary = z.infer<typeof taskSummarySchema>
export type FarmOverview = z.infer<typeof farmOverviewSchema>
export type HomeDashboard = z.infer<typeof homeDashboardSchema>

// Tasks still open today; never negative when the server counts extra completions.
export function tasksRemaining(summary: TaskSummary) {
  return Math.max(summary.total - summary.completed, 0)
}

export function homeHeadline(dashboard: Pick<HomeDashboard, 'primaryCultivation'>) {
  return dashboard.primaryCultivation ? 'Here’s today’s farm plan.' : 'Ready when you are.'
}

// A cultivation that has not been stocked yet has no day count to show.
export function cultivationDayLabel(dayNumber: number | null) {
  return dayNumber ? `Day ${dayNumber}` : 'Planning'
}

// Days to the estimated harvest window, or a dash while the server has no estimate.
export function daysUntilHarvestLabel(overview: FarmOverview | null) {
  const days = overview?.daysUntilHarvest
  if (days === null || days === undefined) return '—'
  return days === 1 ? '1 day' : `${days} days`
}

// How far a tip's guidance has been reviewed, in words beside an icon and colour.
export function tipSourceDisplay(
  tip: Pick<EducationalTip, 'isDemo' | 'sourceStatus'>,
): StatusDisplay {
  if (tip.isDemo || tip.sourceStatus === 'DEMO') {
    return { label: 'Demo guidance', tone: 'warning', icon: 'warning' }
  }
  if (tip.sourceStatus === 'VERIFIED') {
    return { label: 'Reviewed guidance', tone: 'success', icon: 'check' }
  }
  if (tip.sourceStatus === 'DRAFT')
    return { label: 'Draft guidance', tone: 'warning', icon: 'info' }
  return { label: 'Retired guidance', tone: 'neutral', icon: 'info' }
}
