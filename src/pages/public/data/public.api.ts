import { apiRequest, envelopeSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import { healthSchema } from '../domain/public.model'

export async function getHealthApi() {
  return apiRequest(ENDPOINTS.system.health, {
    method: 'GET',
    schema: envelopeSchema(healthSchema),
  })
}
