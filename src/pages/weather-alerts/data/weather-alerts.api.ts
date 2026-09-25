import { apiRequest, envelopeSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import { weatherAlertsSchema } from '../domain/weather-alerts.model'

// The farm's current weather alerts. A farm without a location, or a forecast that cannot be
// read, still answers 200 with a status saying so.
export async function getWeatherAlertsApi(accessToken: string) {
  return apiRequest(ENDPOINTS.weatherAlerts.root, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(weatherAlertsSchema),
  })
}
