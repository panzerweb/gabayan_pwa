import { apiRequest, envelopeSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import { homeDashboardSchema } from '../domain/home.model'

// Today's dashboard for the farmer's local (Asia/Manila) date.
export async function getHomeDashboardApi(date: string, accessToken: string) {
  const query = new URLSearchParams({ date })
  return apiRequest(`${ENDPOINTS.dashboard.home}?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(homeDashboardSchema),
  })
}
