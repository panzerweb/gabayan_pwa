import { apiRequest, envelopeSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  waterSafetyCheckSchema,
  waterThresholdSetSchema,
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
