import type { WeatherAlertsRepository } from '../domain/weather-alerts.repository.interface'
import { getWeatherAlertsApi } from './weather-alerts.api'

export const weatherAlertsRepository: WeatherAlertsRepository = {
  getWeatherAlerts: getWeatherAlertsApi,
}
