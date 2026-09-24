import { z } from 'zod'

import { apiRequest, envelopeSchema, pageSchema, sourceStatusSchema } from '@core/http'
import { moneySchema } from '@pages/marketplace/domain/marketplace.model'

import { cultivationDetailSchema, farmTaskSchema, quantitySchema } from './operations'

const compactUserSchema = z.object({ id: z.string(), fullName: z.string() })

export const growthMeasurementSchema = z.object({
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

export const feedingPlanSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  date: z.string(),
  dailyTotal: quantitySchema,
  feedings: z.array(
    z.object({
      label: z.string(),
      scheduledAt: z.string(),
      recommendedAmount: quantitySchema,
    }),
  ),
  estimatedLiveFish: z.number().int().nonnegative(),
  estimatedAverageWeight: quantitySchema,
  growthStage: z.string(),
  feedRatePercent: z.number().nonnegative(),
  explanation: z.string(),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export const harvestReadinessSchema = z.object({
  cultivationId: z.string(),
  status: z.enum(['NOT_READY', 'MONITOR', 'READY_SOON', 'POTENTIALLY_READY', 'INSUFFICIENT_DATA']),
  estimatedAverageWeight: quantitySchema.nullable(),
  targetWeightRange: z.object({ minimum: quantitySchema, maximum: quantitySchema }).nullable(),
  estimatedLiveFish: z.number().int().nonnegative(),
  estimatedBiomass: quantitySchema.nullable(),
  estimatedHarvestDate: z.string().nullable(),
  latestMeasurementOn: z.string().nullable(),
  basis: z.array(z.string()),
  message: z.string(),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

const growthMutationResultSchema = z.object({
  record: growthMeasurementSchema,
  previousAverageWeight: quantitySchema.nullable(),
  change: quantitySchema.nullable(),
  feedingPlan: feedingPlanSchema,
  harvestReadiness: harvestReadinessSchema,
})

export const mortalityRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  occurredOn: z.string(),
  fishCount: z.number().int().positive(),
  reason: z.enum(['UNKNOWN', 'WATER_QUALITY', 'DISEASE', 'HANDLING', 'PREDATION', 'OTHER']),
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

const mortalityMutationResultSchema = z.object({
  record: mortalityRecordSchema,
  stock: z.object({
    initialFingerlings: z.number().int().nonnegative(),
    recordedMortality: z.number().int().nonnegative(),
    estimatedLiveFish: z.number().int().nonnegative(),
  }),
  feedingPlan: feedingPlanSchema,
})

export const feedingRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  taskId: z.string(),
  fedAt: z.string(),
  amount: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

export const guidanceMessageSchema = z.object({
  severity: z.enum(['INFO', 'CAUTION', 'ACTION']),
  title: z.string(),
  message: z.string(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export const waterObservationSchema = z.object({
  temperatureC: z.number().optional(),
  dissolvedOxygenMgL: z.number().optional(),
  ph: z.number().optional(),
  clarity: z.string().optional(),
  odor: z.string().optional(),
  fishBehavior: z.string().optional(),
  unusualChanges: z.boolean(),
})

export const waterCheckSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  checkedAt: z.string(),
  observation: waterObservationSchema,
  actionTaken: z.string().nullable(),
  notes: z.string().nullable(),
  guidance: z.array(guidanceMessageSchema),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

const waterCheckMutationResultSchema = z.object({
  record: waterCheckSchema,
  generatedTasks: z.array(farmTaskSchema),
  guidance: z.array(guidanceMessageSchema),
})

export const harvestRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  harvestDate: z.string(),
  numberHarvested: z.number().int().positive(),
  totalHarvestWeight: quantitySchema,
  averageFishWeight: quantitySchema,
  sellingPricePerKg: moneySchema,
  notes: z.string().nullable(),
  estimatedRevenue: moneySchema,
  createdAt: z.string(),
  recordedBy: compactUserSchema,
})

export const cultivationCompletionSummarySchema = z.object({
  cultureDurationDays: z.number().int().positive(),
  fingerlingsStocked: z.number().int().positive(),
  fishHarvested: z.number().int().positive(),
  recordedMortality: z.number().int().nonnegative(),
  survivalRatePercent: z.number().min(0).max(100),
  totalHarvestWeight: quantitySchema,
  estimatedFeedUsed: quantitySchema,
  estimatedExpenses: moneySchema.nullable(),
  estimatedRevenue: moneySchema,
  isDemo: z.boolean(),
})

const harvestCompletionSchema = z.object({
  cultivation: cultivationDetailSchema,
  harvest: harvestRecordSchema,
  summary: cultivationCompletionSummarySchema,
})

export type GrowthMeasurement = z.infer<typeof growthMeasurementSchema>
export type FeedingPlan = z.infer<typeof feedingPlanSchema>
export type HarvestReadiness = z.infer<typeof harvestReadinessSchema>
export type MortalityRecord = z.infer<typeof mortalityRecordSchema>
export type FeedingRecord = z.infer<typeof feedingRecordSchema>
export type WaterCheck = z.infer<typeof waterCheckSchema>
export type GuidanceMessage = z.infer<typeof guidanceMessageSchema>
export type HarvestRecord = z.infer<typeof harvestRecordSchema>
export type CultivationCompletionSummary = z.infer<typeof cultivationCompletionSummarySchema>
export type HarvestCompletion = z.infer<typeof harvestCompletionSchema>

export type CreateGrowthMeasurementRequest = {
  measuredOn: string
  numberOfFishSampled: number
  averageWeight: { value: number; unit: 'G' | 'KG' }
  notes?: string | null
}

export type CreateMortalityRequest = {
  occurredOn: string
  fishCount: number
  reason: MortalityRecord['reason']
  notes?: string | null
}

export type CreateWaterCheckRequest = {
  checkedAt: string
  observation: z.infer<typeof waterObservationSchema>
  actionTaken?: string | null
  notes?: string | null
}

export type CreateHarvestRequest = {
  harvestDate: string
  numberHarvested: number
  totalHarvestWeight: { value: number; unit: 'KG' }
  averageFishWeight: { value: number; unit: 'G' | 'KG' }
  sellingPricePerKg: { amountMinor: number; currency: 'PHP' }
  notes?: string | null
}

export const recordsQueryKeys = {
  growth: (id: string) => ['growth-measurements', id] as const,
  mortality: (id: string) => ['mortality-records', id] as const,
  feedingPlan: (id: string) => ['feeding-plan', id] as const,
  feedingRecords: (id: string) => ['feeding-records', id] as const,
  waterChecks: (id: string) => ['water-checks', id] as const,
  readiness: (id: string) => ['harvest-readiness', id] as const,
}

export function listGrowthMeasurements(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/growth-measurements?limit=100`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(growthMeasurementSchema),
  })
}

export function createGrowthMeasurement(
  cultivationId: string,
  body: CreateGrowthMeasurementRequest,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest(`/cultivations/${cultivationId}/growth-measurements`, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(growthMutationResultSchema),
  })
}

export function listMortalityRecords(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/mortality-records?limit=100`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(mortalityRecordSchema),
  })
}

export function createMortalityRecord(
  cultivationId: string,
  body: CreateMortalityRequest,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest(`/cultivations/${cultivationId}/mortality-records`, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(mortalityMutationResultSchema),
  })
}

export function getFeedingPlan(cultivationId: string, accessToken: string, date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return apiRequest(`/cultivations/${cultivationId}/feeding-plan${query}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(feedingPlanSchema),
  })
}

export function listFeedingRecords(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/feeding-records?limit=100`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(feedingRecordSchema),
  })
}

export function listWaterChecks(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/water-checks?limit=100`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(waterCheckSchema),
  })
}

export function createWaterCheck(
  cultivationId: string,
  body: CreateWaterCheckRequest,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest(`/cultivations/${cultivationId}/water-checks`, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(waterCheckMutationResultSchema),
  })
}

export function getHarvestReadiness(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/harvest-readiness`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(harvestReadinessSchema),
  })
}

export function completeHarvest(
  cultivationId: string,
  body: CreateHarvestRequest,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest(`/cultivations/${cultivationId}/harvest`, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(harvestCompletionSchema),
  })
}
