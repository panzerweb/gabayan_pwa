import { z } from 'zod'

import { ruleSourceSchema, sourceStatusSchema } from '@core/http'
import { formatQuantity } from '@core/utils/format'
import { guidanceMessageSchema } from '@pages/cultivations/domain/cultivations.model'
import { productSummarySchema } from '@pages/marketplace/domain/marketplace.model'

export const WATER_PARAMETERS = [
  'SALINITY',
  'PH',
  'AMMONIA',
  'NITRITE',
  'NITRATE',
  'DISSOLVED_OXYGEN',
  'WATER_TEMPERATURE',
] as const

export const WATER_PARAMETER_UNITS = ['PPT', 'PH', 'MG_PER_L', 'CELSIUS'] as const

export const WATER_READING_STATUSES = ['BELOW_RANGE', 'WITHIN_RANGE', 'ABOVE_RANGE'] as const

export const SAFETY_CHECK_OFFLINE_MESSAGE =
  'You’re offline. Reconnect to check your readings. Nothing is saved or queued.'

export const waterParameterSchema = z.enum(WATER_PARAMETERS)
export const waterParameterUnitSchema = z.enum(WATER_PARAMETER_UNITS)
export const waterReadingStatusSchema = z.enum(WATER_READING_STATUSES)

export { ruleSourceSchema }

export const waterThresholdSchema = z.object({
  parameter: waterParameterSchema,
  name: z.string().min(1),
  unit: waterParameterUnitSchema,
  minimum: z.number().nullable(),
  maximum: z.number().nullable(),
  explanation: z.string().min(1),
  basis: z.string().min(1),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
})

export const waterThresholdSetSchema = z.object({
  speciesId: z.string().min(1),
  environmentId: z.string().min(1),
  thresholds: z.array(waterThresholdSchema),
  guidance: z.string(),
  sources: z.array(ruleSourceSchema),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  disclaimer: z.string().min(1),
})

// A product that may help with an out-of-range reading, with the quantity "Buy now" presets.
export const waterProblemProductSchema = productSummarySchema.extend({
  whyRelevant: z.string().min(1),
  suggestedQuantity: z.number().int().positive(),
})

export const waterReadingResultSchema = z.object({
  parameter: waterParameterSchema,
  name: z.string().min(1),
  unit: waterParameterUnitSchema,
  value: z.number(),
  minimum: z.number().nullable(),
  maximum: z.number().nullable(),
  status: waterReadingStatusSchema,
  explanation: z.string(),
  guidance: guidanceMessageSchema,
  // Optional until every API serving the check answers it; absent reads as none.
  recommendedProducts: z.array(waterProblemProductSchema).optional(),
})

export const waterSafetyCheckSchema = z.object({
  speciesId: z.string().min(1),
  environmentId: z.string().min(1),
  checkedAt: z.string(),
  results: z.array(waterReadingResultSchema),
  notChecked: z.array(waterParameterSchema),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  disclaimer: z.string().min(1),
})

export type WaterParameter = z.infer<typeof waterParameterSchema>
export type WaterParameterUnit = z.infer<typeof waterParameterUnitSchema>
export type WaterReadingStatus = z.infer<typeof waterReadingStatusSchema>
export type RuleSource = z.infer<typeof ruleSourceSchema>
export type WaterThreshold = z.infer<typeof waterThresholdSchema>
export type WaterThresholdSet = z.infer<typeof waterThresholdSetSchema>
export type WaterProblemProduct = z.infer<typeof waterProblemProductSchema>
export type WaterReadingResult = z.infer<typeof waterReadingResultSchema>
export type WaterSafetyCheck = z.infer<typeof waterSafetyCheckSchema>

// The request field that carries each parameter's reading, and the values the contract
// accepts for it (contract §7, "Water-quality thresholds and safety check").
export const WATER_READING_FIELDS = {
  SALINITY: { field: 'salinityPpt', label: 'Salinity', unitLabel: 'ppt', minimum: 0, maximum: 80 },
  // pH has no unit; its label names the scale instead.
  PH: { field: 'ph', label: 'pH', unitLabel: 'scale 0–14', minimum: 0, maximum: 14 },
  AMMONIA: { field: 'ammoniaMgL', label: 'Ammonia', unitLabel: 'mg/L', minimum: 0, maximum: 50 },
  NITRITE: { field: 'nitriteMgL', label: 'Nitrite', unitLabel: 'mg/L', minimum: 0, maximum: 50 },
  NITRATE: { field: 'nitrateMgL', label: 'Nitrate', unitLabel: 'mg/L', minimum: 0, maximum: 1000 },
  DISSOLVED_OXYGEN: {
    field: 'dissolvedOxygenMgL',
    label: 'Dissolved oxygen',
    unitLabel: 'mg/L',
    minimum: 0,
    maximum: 30,
  },
  WATER_TEMPERATURE: {
    field: 'temperatureC',
    label: 'Water temperature',
    unitLabel: '°C',
    minimum: 0,
    maximum: 45,
  },
} as const satisfies Record<
  WaterParameter,
  { field: string; label: string; unitLabel: string; minimum: number; maximum: number }
>

// "Ammonia (mg/L)": the visible label of a reading, with its unit.
export function readingLabel(parameter: WaterParameter): string {
  const { label, unitLabel } = WATER_READING_FIELDS[parameter]
  return `${label} (${unitLabel})`
}

export type WaterReadingField = (typeof WATER_READING_FIELDS)[WaterParameter]['field']
export type WaterReadings = Partial<Record<WaterReadingField, number | null>>

export interface WaterSafetyCheckRequest {
  speciesId: string
  environmentId: string
  readings: WaterReadings
}

// The check form keeps what was typed, one string per parameter.
export type WaterReadingsForm = Record<WaterParameter, string>

export function emptyReadingsForm(): WaterReadingsForm {
  return Object.fromEntries(WATER_PARAMETERS.map((code) => [code, ''])) as WaterReadingsForm
}

// "6.5-8.5 pH", "Up to 0.5 mg/L", "At least 3 mg/L".
export function formatThresholdRange(range: {
  minimum: number | null
  maximum: number | null
  unit: WaterParameterUnit
}): string {
  const { minimum, maximum, unit } = range
  if (minimum !== null && maximum !== null) {
    const low = formatQuantity(minimum, 'COUNT')
    return `${low}–${formatQuantity(maximum, unit)}`
  }
  if (maximum !== null) return `Up to ${formatQuantity(maximum, unit)}`
  if (minimum !== null) return `At least ${formatQuantity(minimum, unit)}`
  return 'No range set'
}

export interface ReadingStatusPresentation {
  label: string
  tone: 'success' | 'warning' | 'danger'
  icon: 'check' | 'warning'
}

// A reading's status as a label, icon and colour together, never colour alone.
export function readingStatusPresentation(status: WaterReadingStatus): ReadingStatusPresentation {
  if (status === 'WITHIN_RANGE') return { label: 'Within range', tone: 'success', icon: 'check' }
  if (status === 'BELOW_RANGE') return { label: 'Below range', tone: 'warning', icon: 'warning' }
  return { label: 'Above range', tone: 'warning', icon: 'warning' }
}

// Validates the typed readings and builds the request's readings. A blank field is a
// parameter the farmer did not measure; at least one must be entered.
export function parseReadingsForm(form: WaterReadingsForm): {
  readings: WaterReadings
  fieldErrors: Record<string, string>
} {
  const readings: WaterReadings = {}
  const fieldErrors: Record<string, string> = {}
  for (const code of WATER_PARAMETERS) {
    const { field, minimum, maximum } = WATER_READING_FIELDS[code]
    const text = form[code].trim()
    if (!text) continue
    const value = Number(text)
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      fieldErrors[`readings.${field}`] = `Enter a number from ${minimum} to ${maximum}.`
      continue
    }
    readings[field] = value
  }
  if (!Object.keys(readings).length && !Object.keys(fieldErrors).length) {
    fieldErrors.readings = 'Enter at least one reading to check.'
  }
  return { readings, fieldErrors }
}

// Contract §9 "Water-parameter logs" (Pro). Each saved reading keeps the status it was given
// against the ranges when the log was saved; the client never re-evaluates it.
export const WATER_LOG_NOTES_LIMIT = 500

export const WATER_LOG_LIST_LIMIT = 50

export const WATER_LOG_OFFLINE_MESSAGE =
  'You’re offline. Reconnect to save this reading. Nothing is saved or queued.'

export const waterLogReadingSchema = z.object({
  parameter: waterParameterSchema,
  name: z.string().min(1),
  unit: waterParameterUnitSchema,
  value: z.number(),
  minimum: z.number().nullable(),
  maximum: z.number().nullable(),
  status: waterReadingStatusSchema,
})

export const loggedReadingsSchema = z.object({
  salinityPpt: z.number().nullable(),
  ph: z.number().nullable(),
  ammoniaMgL: z.number().nullable(),
  nitriteMgL: z.number().nullable(),
  nitrateMgL: z.number().nullable(),
  dissolvedOxygenMgL: z.number().nullable(),
  temperatureC: z.number().nullable(),
})

export const waterParameterLogSchema = z.object({
  id: z.string().min(1),
  cultivationId: z.string().min(1),
  loggedAt: z.string(),
  readings: loggedReadingsSchema,
  results: z.array(waterLogReadingSchema),
  notLogged: z.array(waterParameterSchema),
  outOfRangeCount: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  recordedBy: z.object({ id: z.string(), fullName: z.string() }),
  createdAt: z.string(),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  disclaimer: z.string().min(1),
})

export type WaterLogReading = z.infer<typeof waterLogReadingSchema>
export type WaterParameterLog = z.infer<typeof waterParameterLogSchema>

// `loggedAt` is left to the server, which stamps the reading with its own time.
export interface CreateWaterParameterLogRequest {
  readings: WaterReadings
  notes?: string | null
}

// Validates the log form as the safety check does, plus the notes, and builds the request.
export function parseWaterLogForm(
  form: WaterReadingsForm,
  notes: string,
): { body: CreateWaterParameterLogRequest | null; fieldErrors: Record<string, string> } {
  const { readings, fieldErrors } = parseReadingsForm(form)
  if (fieldErrors.readings) fieldErrors.readings = 'Enter at least one reading to save.'
  const trimmed = notes.trim()
  if (trimmed.length > WATER_LOG_NOTES_LIMIT) {
    fieldErrors.notes = `Keep the notes to ${WATER_LOG_NOTES_LIMIT} characters or fewer.`
  }
  if (Object.keys(fieldErrors).length) return { body: null, fieldErrors }
  return { body: { readings, notes: trimmed || null }, fieldErrors }
}

export interface WaterTrendPoint {
  logId: string
  loggedAt: string
  value: number
  minimum: number | null
  maximum: number | null
  status: WaterReadingStatus
}

// One parameter's saved readings across the logs, oldest first, each with its saved status.
// Logs that did not measure the parameter are left out.
export function waterTrendPoints(
  logs: readonly WaterParameterLog[],
  parameter: WaterParameter,
): WaterTrendPoint[] {
  return logs
    .flatMap((log) => {
      const result = log.results.find((reading) => reading.parameter === parameter)
      if (!result) return []
      const { value, minimum, maximum, status } = result
      return [{ logId: log.id, loggedAt: log.loggedAt, value, minimum, maximum, status }]
    })
    .sort((left, right) => Date.parse(left.loggedAt) - Date.parse(right.loggedAt))
}

// "All readings within range", "1 reading out of range", "2 readings out of range".
export function outOfRangeSummary(count: number): string {
  if (count === 0) return 'All readings within range'
  return `${count} ${count === 1 ? 'reading' : 'readings'} out of range`
}
