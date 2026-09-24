import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  CULTIVATION_LIST_LIMIT,
  cultivationDetailSchema,
  cultivationSummarySchema,
  cultivationTimelineSchema,
  farmTaskSchema,
  taskCompletionResultSchema,
  type CompleteTaskRequest,
  type TaskFilters,
} from '../domain/cultivations.model'

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
