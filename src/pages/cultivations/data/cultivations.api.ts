import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  CULTIVATION_LIST_LIMIT,
  RECORD_LIST_LIMIT,
  cultivationDetailSchema,
  cultivationSummarySchema,
  cultivationTimelineSchema,
  farmTaskSchema,
  feedingPlanSchema,
  feedingRecordSchema,
  growthMeasurementSchema,
  growthMutationResultSchema,
  harvestCompletionSchema,
  harvestReadinessSchema,
  mortalityMutationResultSchema,
  mortalityRecordSchema,
  taskCompletionResultSchema,
  waterCheckMutationResultSchema,
  waterCheckSchema,
  type CompleteTaskRequest,
  type CreateGrowthMeasurementRequest,
  type CreateHarvestRequest,
  type CreateMortalityRequest,
  type CreateWaterCheckRequest,
  type TaskFilters,
} from '../domain/cultivations.model'

// A record history's path with its one page of `RECORD_LIST_LIMIT` asked for.
function firstPage(path: `/${string}`): `/${string}` {
  return `${path}?${new URLSearchParams({ limit: String(RECORD_LIST_LIMIT) }).toString()}`
}

export async function listCultivationsApi(accessToken: string, limit = CULTIVATION_LIST_LIMIT) {
  const query = new URLSearchParams({ limit: String(limit) })
  return apiRequest(`${ENDPOINTS.cultivations.root}?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(cultivationSummarySchema),
  })
}

export async function getCultivationApi(cultivationId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.cultivations.detail(cultivationId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(cultivationDetailSchema),
  })
}

export async function getCultivationTimelineApi(cultivationId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.cultivations.timeline(cultivationId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(cultivationTimelineSchema),
  })
}

// A day's tasks for one cultivation fit in one page of 100.
export async function listTasksApi(filters: TaskFilters, accessToken: string) {
  const query = new URLSearchParams({ limit: '100' })
  if (filters.date) query.set('date', filters.date)
  if (filters.cultivationId) query.set('cultivationId', filters.cultivationId)
  return apiRequest(`${ENDPOINTS.tasks.root}?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(farmTaskSchema),
  })
}

export async function completeTaskApi(
  taskId: string,
  body: CompleteTaskRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.tasks.complete(taskId), {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(taskCompletionResultSchema),
  })
}

export async function listGrowthMeasurementsApi(cultivationId: string, accessToken: string) {
  return apiRequest(firstPage(ENDPOINTS.cultivations.growth(cultivationId)), {
    method: 'GET',
    accessToken,
    schema: pageSchema(growthMeasurementSchema),
  })
}

export async function createGrowthMeasurementApi(
  cultivationId: string,
  body: CreateGrowthMeasurementRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cultivations.growth(cultivationId), {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(growthMutationResultSchema),
  })
}

export async function listMortalityRecordsApi(cultivationId: string, accessToken: string) {
  return apiRequest(firstPage(ENDPOINTS.cultivations.mortality(cultivationId)), {
    method: 'GET',
    accessToken,
    schema: pageSchema(mortalityRecordSchema),
  })
}

export async function createMortalityRecordApi(
  cultivationId: string,
  body: CreateMortalityRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cultivations.mortality(cultivationId), {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(mortalityMutationResultSchema),
  })
}

// The plan for `date` (YYYY-MM-DD); without one the server plans for its own today.
export async function getFeedingPlanApi(cultivationId: string, accessToken: string, date?: string) {
  const query = date ? `?${new URLSearchParams({ date }).toString()}` : ''
  return apiRequest(`${ENDPOINTS.cultivations.feedingPlan(cultivationId)}${query}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(feedingPlanSchema),
  })
}

export async function listFeedingRecordsApi(cultivationId: string, accessToken: string) {
  return apiRequest(firstPage(ENDPOINTS.cultivations.feedingRecords(cultivationId)), {
    method: 'GET',
    accessToken,
    schema: pageSchema(feedingRecordSchema),
  })
}

export async function listWaterChecksApi(cultivationId: string, accessToken: string) {
  return apiRequest(firstPage(ENDPOINTS.cultivations.waterChecks(cultivationId)), {
    method: 'GET',
    accessToken,
    schema: pageSchema(waterCheckSchema),
  })
}

export async function createWaterCheckApi(
  cultivationId: string,
  body: CreateWaterCheckRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cultivations.waterChecks(cultivationId), {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(waterCheckMutationResultSchema),
  })
}

export async function getHarvestReadinessApi(cultivationId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.cultivations.harvestReadiness(cultivationId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(harvestReadinessSchema),
  })
}

export async function completeHarvestApi(
  cultivationId: string,
  body: CreateHarvestRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cultivations.harvest(cultivationId), {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(harvestCompletionSchema),
  })
}
