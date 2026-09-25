import type { Envelope } from '@core/http'

import type { WeatherAlerts } from './weather-alerts.model'

export interface WeatherAlertsRepository {
  getWeatherAlerts(accessToken: string): Promise<Envelope<WeatherAlerts>>
}
