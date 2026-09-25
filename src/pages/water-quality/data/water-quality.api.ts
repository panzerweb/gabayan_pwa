import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  WATER_LOG_LIST_LIMIT,
  waterParameterLogSchema,
  waterSafetyCheckSchema,
  waterThresholdSetSchema,
  type CreateWaterParameterLogRequest,
  type WaterSafetyCheckRequest,
} from '../domain/water-quality.model'

// Refused with 400 INCOMPATIBLE_SELECTION for a pairing the profile advises against.
export async function getWaterThresholdsApi(
  speciesId: string,
  environmentId: string,
  accessToken: string,
) {
  const query = new URLSearchParams({ speciesId, environmentId })
  return apiRequest(`${ENDPOINTS.waterThresholds.root}?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(waterThresholdSetSchema),
  })
}

// Evaluates the readings without storing them, so it carries no Idempotency-Key.
export async function createWaterSafetyCheckApi(
  body: WaterSafetyCheckRequest,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.waterSafetyChecks.root, {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(waterSafetyCheckSchema),
  })
}

// Pro: a cultivation's saved logs, newest first. One page of `WATER_LOG_LIST_LIMIT` feeds both
// the history and the trend. A Free account is refused with 403 FORBIDDEN.
export async function listWaterParameterLogsApi(cultivationId: string, accessToken: string) {
  const query = new URLSearchParams({ limit: String(WATER_LOG_LIST_LIMIT) })
  const path = ENDPOINTS.cultivations.waterParameterLogs(cultivationId)
  return apiRequest(`${path}?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(waterParameterLogSchema),
  })
}

// Pro: saves one reading. The key is made once per submission and reused on a retry, so a
// lost answer never stores the reading twice.
export async function createWaterParameterLogApi(
  cultivationId: string,
  body: CreateWaterParameterLogRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cultivations.waterParameterLogs(cultivationId), {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(waterParameterLogSchema),
  })
}
