import { z } from 'zod'

import { sourceStatusSchema } from '@core/http'
import { formatQuantity } from '@core/utils/format'
import { quantitySchema, type StatusDisplay } from '@pages/cultivations/domain/cultivations.model'

export const weatherAlertKindSchema = z.enum(['HIGH_TEMPERATURE', 'OVERCAST_SPELL'])
export const weatherAlertSeveritySchema = z.enum(['ADVISORY', 'WARNING'])
export const weatherAlertsStatusSchema = z.enum([
  'AVAILABLE',
  'LOCATION_MISSING',
  'FORECAST_UNAVAILABLE',
])

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const weatherLocationSchema = z.object({
  municipality: z.string(),
  province: z.string(),
})

// Contract §12 WeatherAlert: a run of forecast days past a demo threshold, with the risk to
// the fish in plain words and the rule's provenance.
export const weatherAlertSchema = z.object({
  id: z.string(),
  kind: weatherAlertKindSchema,
  severity: weatherAlertSeveritySchema,
  location: weatherLocationSchema,
  periodStart: calendarDateSchema,
  periodEnd: calendarDateSchema,
  peak: quantitySchema,
  threshold: quantitySchema,
  title: z.string(),
  message: z.string(),
  explanation: z.string(),
  actions: z.array(z.string()),
  raisedAt: z.string(),
  basis: z.string(),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

// Contract §12 WeatherAlerts: the farm's current alerts, or why there are none to show.
export const weatherAlertsSchema = z.object({
  status: weatherAlertsStatusSchema,
  location: weatherLocationSchema.nullable(),
  forecastDays: z.number().int().positive(),
  checkedAt: z.string().nullable(),
  alerts: z.array(weatherAlertSchema),
  message: z.string(),
})

export type WeatherAlertKind = z.infer<typeof weatherAlertKindSchema>
export type WeatherAlertSeverity = z.infer<typeof weatherAlertSeveritySchema>
export type WeatherAlertsStatus = z.infer<typeof weatherAlertsStatusSchema>
export type WeatherLocation = z.infer<typeof weatherLocationSchema>
export type WeatherAlert = z.infer<typeof weatherAlertSchema>
export type WeatherAlerts = z.infer<typeof weatherAlertsSchema>

// --- Wording. The server decides which weather raises an alert; these lines only word it.

const KIND_DISPLAY: Record<WeatherAlertKind, StatusDisplay> = {
  HIGH_TEMPERATURE: { label: 'Hot weather', tone: 'warning', icon: 'sun' },
  OVERCAST_SPELL: { label: 'Cloudy spell', tone: 'info', icon: 'cloud' },
}

const SEVERITY_DISPLAY: Record<WeatherAlertSeverity, StatusDisplay> = {
  ADVISORY: { label: 'Advisory', tone: 'warning', icon: 'info' },
  WARNING: { label: 'Warning', tone: 'danger', icon: 'warning' },
}

export function weatherKindDisplay(kind: WeatherAlertKind): StatusDisplay {
  return KIND_DISPLAY[kind]
}

export function weatherSeverityDisplay(severity: WeatherAlertSeverity): StatusDisplay {
  return SEVERITY_DISPLAY[severity]
}

const dayFormat = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

// The forecast days an alert covers, read as Manila calendar dates.
export function weatherPeriodLabel(periodStart: string, periodEnd: string): string {
  const day = (date: string) => dayFormat.format(new Date(`${date}T12:00:00+08:00`))
  return periodStart === periodEnd ? day(periodStart) : `${day(periodStart)} – ${day(periodEnd)}`
}

// The forecast figure behind an alert beside the demo value that raises one.
export function weatherPeakLine(alert: Pick<WeatherAlert, 'kind' | 'peak' | 'threshold'>): string {
  const peak = formatQuantity(alert.peak.value, alert.peak.unit, 1)
  const threshold = formatQuantity(alert.threshold.value, alert.threshold.unit, 1)
  return alert.kind === 'HIGH_TEMPERATURE'
    ? `Forecast high of ${peak} air temperature; alerts start at ${threshold}.`
    : `Forecast cloud cover up to ${peak}; alerts start at ${threshold} for two days or more.`
}

export function weatherPlace(location: WeatherLocation): string {
  return `${location.municipality}, ${location.province}`
}
