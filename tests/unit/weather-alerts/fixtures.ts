import type { Notification } from '@pages/notifications/domain/notifications.model'
import type { WeatherAlert, WeatherAlerts } from '@pages/weather-alerts/domain/weather-alerts.model'

const provenance = {
  basis:
    "Demo thresholds for the day's maximum air temperature in the forecast for the farm's municipality.",
  isDemo: true,
  sourceStatus: 'DEMO' as const,
  ruleVersion: 'demo-2026-09-weather',
  disclaimer:
    'A demo weather alert from a general forecast, not a warning for your pond. Check your water and fish, and follow local technical guidance.',
}

const dagupan = { municipality: 'Dagupan City', province: 'Pangasinan' }

export const heatAlert: WeatherAlert = {
  id: 'wal_farm_1_dagupan-city_high_temperature_20260924',
  kind: 'HIGH_TEMPERATURE',
  severity: 'ADVISORY',
  location: dagupan,
  periodStart: '2026-09-24',
  periodEnd: '2026-09-25',
  peak: { value: 35.3, unit: 'CELSIUS' },
  threshold: { value: 34, unit: 'CELSIUS' },
  title: 'Hot days ahead',
  message: 'Dagupan City: hot days are forecast (up to 35.3 °C).',
  explanation:
    'Hot days warm the pond. Warm water holds less oxygen while the fish breathe and digest faster, so they can run short of oxygen, most of all in the afternoon and before dawn.',
  actions: [
    'Feed in the cooler morning and late afternoon, and give less if the fish eat slowly.',
    'Check the fish at dawn; fish gasping at the surface need oxygen quickly.',
  ],
  raisedAt: '2026-09-22T23:30:00Z',
  ...provenance,
}

export const overcastAlert: WeatherAlert = {
  ...heatAlert,
  id: 'wal_farm_1_dumangas_overcast_spell_20260923',
  kind: 'OVERCAST_SPELL',
  severity: 'WARNING',
  location: { municipality: 'Dumangas', province: 'Iloilo' },
  periodStart: '2026-09-23',
  periodEnd: '2026-09-25',
  peak: { value: 92, unit: 'PERCENT' },
  threshold: { value: 80, unit: 'PERCENT' },
  title: 'Cloudy days ahead',
  message: 'Dumangas: several cloudy days in a row are forecast (up to 92%).',
  explanation:
    'Cloudy days slow the algae that make oxygen in the pond during the day. If a thick bloom dies off, rotting algae can use up the oxygen overnight.',
}

export const hotForecast: WeatherAlerts = {
  status: 'AVAILABLE',
  location: dagupan,
  forecastDays: 3,
  checkedAt: '2026-09-22T23:30:00Z',
  alerts: [heatAlert],
  message: 'Weather to watch in Dagupan City over the next 3 days.',
}

export const calmForecast: WeatherAlerts = {
  status: 'AVAILABLE',
  location: { municipality: 'San Pablo City', province: 'Laguna' },
  forecastDays: 3,
  checkedAt: '2026-09-22T23:30:00Z',
  alerts: [],
  message: 'No hot or cloudy spells are forecast for San Pablo City in the next 3 days.',
}

export const locationMissing: WeatherAlerts = {
  status: 'LOCATION_MISSING',
  location: null,
  forecastDays: 3,
  checkedAt: null,
  alerts: [],
  message:
    "Add your farm's municipality and province in your profile to get alerts about hot or cloudy days ahead.",
}

export const forecastUnavailable: WeatherAlerts = {
  status: 'FORECAST_UNAVAILABLE',
  location: { municipality: 'Jomalig', province: 'Quezon' },
  forecastDays: 3,
  checkedAt: null,
  alerts: [],
  message: 'We could not read the weather forecast for Jomalig right now. Try again later.',
}

export const heatNotification: Notification = {
  id: 'ntf_weather_farm_1_dagupan-city_high_temperature_20260924',
  category: 'CULTIVATION',
  type: 'WEATHER_ALERT',
  title: heatAlert.title,
  message: heatAlert.message,
  recommendedAmount: null,
  occurredAt: heatAlert.raisedAt,
  readAt: null,
  action: null,
  cultivationId: null,
  orderId: null,
  taskId: null,
  reminder: null,
  weatherAlert: heatAlert,
}

// A copy of `value` without `key`, for payloads that leave out a required field.
export function without<T extends object>(value: T, key: keyof T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key))
}
