import { z } from 'zod'

import type { AppIconName } from '@components/ui/AppIcon.vue'
import { mediaAssetSchema, sourceStatusSchema } from '@core/http'
import { moneySchema } from '@pages/marketplace/domain/marketplace.model'
import { dimensionsSchema, stockingEstimateSchema } from '@/services/api/onboarding'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type StatusDisplay = { label: string; tone: StatusTone; icon: AppIconName }

export const quantitySchema = z.object({
  value: z.number().finite(),
  unit: z.enum(['G', 'KG', 'M', 'M2', 'M3', 'CELSIUS', 'COUNT', 'PERCENT']),
})

const compactSpeciesSchema = z.object({
  id: z.string(),
  commonName: z.string(),
  localName: z.string(),
  image: mediaAssetSchema,
})

const compactEnvironmentSchema = z.object({ id: z.string(), code: z.string(), name: z.string() })

const compactUserSchema = z.object({ id: z.string(), fullName: z.string() })

export const cultivationStatusSchema = z.enum([
  'PLANNING',
  'ACTIVE',
  'GROWING',
  'PRE_HARVEST',
  'COMPLETED',
  'CANCELLED',
])

export const cultivationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  species: compactSpeciesSchema,
  environment: compactEnvironmentSchema,
  status: cultivationStatusSchema,
  dayNumber: z.number().int().nullable(),
  estimatedDurationDays: z.number().int().nullable(),
  progressPercent: z.number().min(0).max(100),
  initialFingerlings: z.number().int().positive(),
  estimatedLiveFish: z.number().int().nonnegative(),
  estimatedHarvestDate: z.string().nullable(),
  nextTaskAt: z.string().nullable(),
  stockingStatus: z.enum(['BELOW_RANGE', 'RECOMMENDED', 'ABOVE_RANGE']),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const growthMeasurementSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  measuredOn: z.string(),
  numberOfFishSampled: z.number().int().positive(),
  averageWeight: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

const growthStageSchema = z.object({ code: z.string(), name: z.string(), isEstimated: z.boolean() })

export const harvestReadinessStatusSchema = z.enum([
  'NOT_READY',
  'MONITOR',
  'READY_SOON',
  'POTENTIALLY_READY',
  'INSUFFICIENT_DATA',
])

export const cultivationDetailSchema = cultivationSummarySchema.extend({
  dimensions: dimensionsSchema,
  surfaceAreaM2: z.number().positive(),
  estimatedWaterVolumeM3: z.number().positive(),
  stockedOn: z.string().nullable(),
  recordedMortality: z.number().int().nonnegative(),
  latestGrowthMeasurement: growthMeasurementSchema.nullable(),
  growthStage: growthStageSchema,
  feedingSummary: z
    .object({
      dailyFeed: quantitySchema,
      feedingsPerDay: z.number().int().positive(),
      nextFeedingAt: z.string(),
      planId: z.string(),
    })
    .nullable(),
  harvestSummary: z.object({
    targetWeight: quantitySchema.nullable(),
    readinessStatus: harvestReadinessStatusSchema,
    estimatedHarvestDate: z.string().nullable(),
  }),
  stockingEstimateSnapshot: stockingEstimateSchema,
  recommendationDisclaimer: z.string().min(1),
  notes: z.string().nullable(),
})

export const timelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  status: z.enum(['COMPLETED', 'CURRENT', 'UPCOMING']),
  occurredOn: z.string().nullable(),
  estimatedOn: z.string().nullable(),
  detail: z.string().nullable(),
})

export const cultivationTimelineSchema = z.object({
  cultivationId: z.string(),
  currentStage: growthStageSchema,
  events: z.array(timelineEventSchema),
})

export const farmTaskSchema = z.object({
  id: z.string().min(1),
  cultivationId: z.string().min(1),
  type: z.enum([
    'FEEDING',
    'WATER_CHECK',
    'WATER_MAINTENANCE',
    'EQUIPMENT_INSPECTION',
    'GROWTH_SAMPLING',
    'CAGE_NET_INSPECTION',
    'HARVEST_PREPARATION',
    'CUSTOM',
  ]),
  title: z.string().min(1),
  instruction: z.string().min(1),
  scheduledAt: z.string().min(1),
  dueAt: z.string().min(1),
  status: z.enum(['UPCOMING', 'DUE', 'COMPLETED', 'MISSED', 'CANCELLED']),
  recommendedAmount: quantitySchema.nullable(),
  completedAt: z.string().nullable(),
  completionRecordType: z.string().nullable(),
  completionRecordId: z.string().nullable(),
  deepLink: z.string().startsWith('/'),
  audit: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number().int().positive(),
  }),
})

export const feedingRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  taskId: z.string(),
  fedAt: z.string(),
  amount: quantitySchema,
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

export const taskCompletionResultSchema = z.object({
  task: farmTaskSchema,
  linkedRecord: feedingRecordSchema.nullable(),
  cultivationSnapshot: cultivationSummarySchema,
})

export type Quantity = z.infer<typeof quantitySchema>
export type CultivationStatus = z.infer<typeof cultivationStatusSchema>
export type CultivationSummary = z.infer<typeof cultivationSummarySchema>
export type CultivationDetail = z.infer<typeof cultivationDetailSchema>
export type HarvestReadinessStatus = z.infer<typeof harvestReadinessStatusSchema>
export type TimelineEvent = z.infer<typeof timelineEventSchema>
export type CultivationTimeline = z.infer<typeof cultivationTimelineSchema>
export type FarmTask = z.infer<typeof farmTaskSchema>
export type TaskCompletionResult = z.infer<typeof taskCompletionResultSchema>

export interface TaskFilters {
  cultivationId?: string
  date?: string
}

export interface CompleteTaskRequest {
  completedAt: string
  actualAmount?: Quantity
  notes?: string | null
}

// One page of 100 covers every cultivation a small farm runs.
export const CULTIVATION_LIST_LIMIT = 100

export const TASK_COMPLETION_OFFLINE_MESSAGE =
  'Reconnect before recording this feeding. It has not been queued.'

// The All / Active / Completed tab of the cultivation list, held in `?view=`.
export const CULTIVATION_VIEWS = ['all', 'active', 'completed'] as const
export type CultivationView = (typeof CULTIVATION_VIEWS)[number]

export function cultivationViewFrom(value: unknown): CultivationView {
  return value === 'active' || value === 'completed' ? value : 'all'
}

const CLOSED_STATUSES: readonly CultivationStatus[] = ['COMPLETED', 'CANCELLED']

export function filterCultivations<T extends Pick<CultivationSummary, 'status'>>(
  cultivations: readonly T[],
  view: CultivationView,
): T[] {
  if (view === 'completed') return cultivations.filter(({ status }) => status === 'COMPLETED')
  if (view === 'active')
    return cultivations.filter(({ status }) => !CLOSED_STATUSES.includes(status))
  return [...cultivations]
}

// The Overview / Timeline section of a cultivation's detail, held in `?section=`.
export type CultivationSection = 'overview' | 'timeline'

export function cultivationSectionFrom(value: unknown): CultivationSection {
  return value === 'timeline' ? 'timeline' : 'overview'
}

const CULTIVATION_STATUS_DISPLAY: Record<CultivationStatus, StatusDisplay> = {
  PLANNING: { label: 'Planning', tone: 'info', icon: 'info' },
  ACTIVE: { label: 'Active', tone: 'success', icon: 'fish' },
  GROWING: { label: 'Growing', tone: 'success', icon: 'fish' },
  PRE_HARVEST: { label: 'Nearing harvest', tone: 'warning', icon: 'star' },
  COMPLETED: { label: 'Completed', tone: 'neutral', icon: 'check' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: 'warning' },
}

export function cultivationStatusDisplay(status: CultivationStatus): StatusDisplay {
  return CULTIVATION_STATUS_DISPLAY[status]
}

// Readiness is the server's estimate from current measurements; these labels only word it.
const READINESS_DISPLAY: Record<HarvestReadinessStatus, StatusDisplay> = {
  NOT_READY: { label: 'Not ready yet', tone: 'neutral', icon: 'info' },
  MONITOR: { label: 'Keep monitoring', tone: 'info', icon: 'info' },
  READY_SOON: { label: 'May be ready soon', tone: 'warning', icon: 'star' },
  POTENTIALLY_READY: { label: 'May be ready', tone: 'success', icon: 'check' },
  INSUFFICIENT_DATA: { label: 'Needs a recent growth sample', tone: 'warning', icon: 'warning' },
}

export function harvestReadinessDisplay(status: HarvestReadinessStatus): StatusDisplay {
  return READINESS_DISPLAY[status]
}

const TIMELINE_EVENT_DISPLAY: Record<TimelineEvent['status'], StatusDisplay> = {
  COMPLETED: { label: 'Done', tone: 'success', icon: 'check' },
  CURRENT: { label: 'Now', tone: 'info', icon: 'fish' },
  UPCOMING: { label: 'Upcoming', tone: 'neutral', icon: 'info' },
}

export function timelineEventDisplay(status: TimelineEvent['status']): StatusDisplay {
  return TIMELINE_EVENT_DISPLAY[status]
}

// The date a timeline event carries: when it happened, or failing that when it is expected.
export function timelineEventDate(
  event: Pick<TimelineEvent, 'occurredOn' | 'estimatedOn'>,
): { date: string; estimated: boolean } | null {
  if (event.occurredOn) return { date: event.occurredOn, estimated: false }
  if (event.estimatedOn) return { date: event.estimatedOn, estimated: true }
  return null
}

export function taskStatusTone(status: FarmTask['status']): StatusTone {
  if (status === 'COMPLETED') return 'success'
  if (status === 'MISSED') return 'danger'
  return 'info'
}

export function taskIcon(task: Pick<FarmTask, 'status' | 'type'>): AppIconName {
  if (task.status === 'COMPLETED') return 'check'
  if (task.type === 'WATER_CHECK') return 'droplet'
  return 'fish'
}

// Only an open feeding task is completed from a task card; other task types have their
// own record forms.
export function canRecordFeeding(task: Pick<FarmTask, 'status' | 'type'>) {
  return task.type === 'FEEDING' && task.status !== 'COMPLETED'
}

// Validates the amount typed into the feeding form without coercing blanks to zero.
export function feedingAmountError(input: string): string | null {
  const trimmed = input.trim()
  const amount = Number(trimmed)
  if (trimmed === '' || !Number.isFinite(amount) || amount <= 0) {
    return 'Enter an amount greater than 0.'
  }
  return null
}

export function feedingCompletionRequest(
  amount: number,
  unit: Quantity['unit'],
  notes: string,
  completedAt: string,
): CompleteTaskRequest {
  return {
    completedAt,
    actualAmount: { value: amount, unit },
    notes: notes.trim() || null,
  }
}

// --- Growth, mortality, feeding and water records -------------------------------------------

export const feedingPlanSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  date: z.string(),
  dailyTotal: quantitySchema,
  feedings: z.array(
    z.object({
      label: z.string(),
      scheduledAt: z.string(),
      recommendedAmount: quantitySchema,
    }),
  ),
  estimatedLiveFish: z.number().int().nonnegative(),
  estimatedAverageWeight: quantitySchema,
  growthStage: z.string(),
  feedRatePercent: z.number().nonnegative(),
  explanation: z.string(),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export const harvestReadinessSchema = z.object({
  cultivationId: z.string(),
  status: harvestReadinessStatusSchema,
  estimatedAverageWeight: quantitySchema.nullable(),
  targetWeightRange: z.object({ minimum: quantitySchema, maximum: quantitySchema }).nullable(),
  estimatedLiveFish: z.number().int().nonnegative(),
  estimatedBiomass: quantitySchema.nullable(),
  estimatedHarvestDate: z.string().nullable(),
  latestMeasurementOn: z.string().nullable(),
  basis: z.array(z.string()),
  message: z.string(),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export const growthMutationResultSchema = z.object({
  record: growthMeasurementSchema,
  previousAverageWeight: quantitySchema.nullable(),
  change: quantitySchema.nullable(),
  feedingPlan: feedingPlanSchema,
  harvestReadiness: harvestReadinessSchema,
})

export const mortalityReasonSchema = z.enum([
  'UNKNOWN',
  'WATER_QUALITY',
  'DISEASE',
  'HANDLING',
  'PREDATION',
  'OTHER',
])

export const mortalityRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  occurredOn: z.string(),
  fishCount: z.number().int().positive(),
  reason: mortalityReasonSchema,
  notes: z.string().nullable(),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

export const mortalityMutationResultSchema = z.object({
  record: mortalityRecordSchema,
  stock: z.object({
    initialFingerlings: z.number().int().nonnegative(),
    recordedMortality: z.number().int().nonnegative(),
    estimatedLiveFish: z.number().int().nonnegative(),
  }),
  feedingPlan: feedingPlanSchema,
})

export const guidanceMessageSchema = z.object({
  severity: z.enum(['INFO', 'CAUTION', 'ACTION']),
  title: z.string(),
  message: z.string(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export const waterObservationSchema = z.object({
  temperatureC: z.number().optional(),
  dissolvedOxygenMgL: z.number().optional(),
  ph: z.number().optional(),
  clarity: z.string().optional(),
  odor: z.string().optional(),
  fishBehavior: z.string().optional(),
  unusualChanges: z.boolean(),
})

export const waterCheckSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  checkedAt: z.string(),
  observation: waterObservationSchema,
  actionTaken: z.string().nullable(),
  notes: z.string().nullable(),
  guidance: z.array(guidanceMessageSchema),
  recordedBy: compactUserSchema,
  createdAt: z.string(),
})

export const waterCheckMutationResultSchema = z.object({
  record: waterCheckSchema,
  generatedTasks: z.array(farmTaskSchema),
  guidance: z.array(guidanceMessageSchema),
})

// --- Harvest -----------------------------------------------------------------------------------

export const harvestRecordSchema = z.object({
  id: z.string(),
  cultivationId: z.string(),
  harvestDate: z.string(),
  numberHarvested: z.number().int().positive(),
  totalHarvestWeight: quantitySchema,
  averageFishWeight: quantitySchema,
  sellingPricePerKg: moneySchema,
  notes: z.string().nullable(),
  estimatedRevenue: moneySchema,
  createdAt: z.string(),
  recordedBy: compactUserSchema,
})

export const cultivationCompletionSummarySchema = z.object({
  cultureDurationDays: z.number().int().positive(),
  fingerlingsStocked: z.number().int().positive(),
  fishHarvested: z.number().int().positive(),
  recordedMortality: z.number().int().nonnegative(),
  survivalRatePercent: z.number().min(0).max(100),
  totalHarvestWeight: quantitySchema,
  estimatedFeedUsed: quantitySchema,
  estimatedExpenses: moneySchema.nullable(),
  estimatedRevenue: moneySchema,
  isDemo: z.boolean(),
})

export const harvestCompletionSchema = z.object({
  cultivation: cultivationDetailSchema,
  harvest: harvestRecordSchema,
  summary: cultivationCompletionSummarySchema,
})

export type GrowthMeasurement = z.infer<typeof growthMeasurementSchema>
export type GrowthMutationResult = z.infer<typeof growthMutationResultSchema>
export type FeedingPlan = z.infer<typeof feedingPlanSchema>
export type FeedingRecord = z.infer<typeof feedingRecordSchema>
export type MortalityReason = z.infer<typeof mortalityReasonSchema>
export type MortalityRecord = z.infer<typeof mortalityRecordSchema>
export type MortalityMutationResult = z.infer<typeof mortalityMutationResultSchema>
export type GuidanceMessage = z.infer<typeof guidanceMessageSchema>
export type WaterObservation = z.infer<typeof waterObservationSchema>
export type WaterCheck = z.infer<typeof waterCheckSchema>
export type WaterCheckMutationResult = z.infer<typeof waterCheckMutationResultSchema>
export type HarvestReadiness = z.infer<typeof harvestReadinessSchema>
export type HarvestRecord = z.infer<typeof harvestRecordSchema>
export type CultivationCompletionSummary = z.infer<typeof cultivationCompletionSummarySchema>
export type HarvestCompletion = z.infer<typeof harvestCompletionSchema>

export interface CreateGrowthMeasurementRequest {
  measuredOn: string
  numberOfFishSampled: number
  averageWeight: { value: number; unit: 'G' | 'KG' }
  notes?: string | null
}

export interface CreateMortalityRequest {
  occurredOn: string
  fishCount: number
  reason: MortalityReason
  notes?: string | null
}

export interface CreateWaterCheckRequest {
  checkedAt: string
  observation: WaterObservation
  actionTaken?: string | null
  notes?: string | null
}

export interface CreateHarvestRequest {
  harvestDate: string
  numberHarvested: number
  totalHarvestWeight: { value: number; unit: 'KG' }
  averageFishWeight: { value: number; unit: 'G' | 'KG' }
  sellingPricePerKg: { amountMinor: number; currency: 'PHP' }
  notes?: string | null
}

// Record histories are short enough to read in one page.
export const RECORD_LIST_LIMIT = 100

// Field messages keyed by the contract's camelCase request field, so local checks and the
// server's `fields` land on the same input.
export type FormErrors = Partial<Record<string, string>>

// Reads a count typed into a form. Blank or fractional input is refused, never read as 0.
export function parseWholeNumber(input: string): number | null {
  const trimmed = input.trim()
  const value = Number(trimmed)
  return trimmed !== '' && Number.isInteger(value) && value > 0 ? value : null
}

// Reads a measurement typed into a form. Blank input is refused, never read as 0.
export function parsePositiveNumber(input: string): number | null {
  const trimmed = input.trim()
  const value = Number(trimmed)
  return trimmed !== '' && Number.isFinite(value) && value > 0 ? value : null
}

// Converts a peso amount typed as text ("120", "120.5") to integer centavos without passing
// through floating-point multiplication. More than two decimal places is refused.
export function pesosToCentavos(input: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(input.trim())
  if (!match) return null
  const pesos = match[1] ?? '0'
  const centavos = (match[2] ?? '').padEnd(2, '0')
  return Number(pesos) * 100 + Number(centavos)
}

function notesOrNull(notes: string) {
  return notes.trim() || null
}

export interface GrowthForm {
  measuredOn: string
  numberOfFishSampled: string
  averageWeight: string
  notes: string
}

export function growthFormErrors(form: GrowthForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.measuredOn) errors.measuredOn = 'Choose the measurement date.'
  if (parseWholeNumber(form.numberOfFishSampled) === null)
    errors.numberOfFishSampled = 'Enter a whole-number sample size greater than 0.'
  if (parsePositiveNumber(form.averageWeight) === null)
    errors.averageWeight = 'Enter an average weight greater than 0.'
  return errors
}

// The growth form records the sampled average in grams.
export function growthMeasurementRequest(form: GrowthForm): CreateGrowthMeasurementRequest {
  return {
    measuredOn: form.measuredOn,
    numberOfFishSampled: Number(form.numberOfFishSampled),
    averageWeight: { value: Number(form.averageWeight), unit: 'G' },
    notes: notesOrNull(form.notes),
  }
}

export interface MortalityForm {
  occurredOn: string
  fishCount: string
  reason: MortalityReason
  notes: string
}

export function mortalityFormErrors(form: MortalityForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.occurredOn) errors.occurredOn = 'Choose the date the loss was observed.'
  if (parseWholeNumber(form.fishCount) === null)
    errors.fishCount = 'Enter a whole number greater than 0.'
  return errors
}

export function mortalityRequest(form: MortalityForm): CreateMortalityRequest {
  return {
    occurredOn: form.occurredOn,
    fishCount: Number(form.fishCount),
    reason: form.reason,
    notes: notesOrNull(form.notes),
  }
}

export const MORTALITY_REASONS: ReadonlyArray<{ value: MortalityReason; label: string }> = [
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'WATER_QUALITY', label: 'Water quality' },
  { value: 'DISEASE', label: 'Disease' },
  { value: 'HANDLING', label: 'Handling' },
  { value: 'PREDATION', label: 'Predation' },
  { value: 'OTHER', label: 'Other' },
]

export function mortalityReasonLabel(reason: MortalityReason): string {
  return MORTALITY_REASONS.find(({ value }) => value === reason)?.label ?? 'Unknown'
}

export interface WaterCheckForm {
  checkedOn: string
  clarity: string
  odor: string
  fishBehavior: string
  unusualChanges: boolean
  actionTaken: string
  notes: string
}

export function waterCheckFormErrors(form: WaterCheckForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.checkedOn) errors.checkedAt = 'Choose the date of this check.'
  if (!form.clarity.trim()) errors.clarity = 'Describe how clear the water looks.'
  if (!form.odor.trim()) errors.odor = 'Describe how the water smells.'
  if (!form.fishBehavior.trim()) errors.fishBehavior = 'Describe how the fish are behaving.'
  return errors
}

// A check entered by date is recorded at 8:00 in the morning, Manila time.
export function waterCheckRequest(form: WaterCheckForm): CreateWaterCheckRequest {
  return {
    checkedAt: new Date(`${form.checkedOn}T08:00:00+08:00`).toISOString(),
    observation: {
      clarity: form.clarity.trim(),
      odor: form.odor.trim(),
      fishBehavior: form.fishBehavior.trim(),
      unusualChanges: form.unusualChanges,
    },
    actionTaken: notesOrNull(form.actionTaken),
    notes: notesOrNull(form.notes),
  }
}

const UNUSUAL_CHANGE: StatusDisplay = { label: 'Change noted', tone: 'warning', icon: 'warning' }
const NO_UNUSUAL_CHANGE: StatusDisplay = {
  label: 'No unusual change',
  tone: 'success',
  icon: 'check',
}

export function waterCheckDisplay(observation: Pick<WaterObservation, 'unusualChanges'>) {
  return observation.unusualChanges ? UNUSUAL_CHANGE : NO_UNUSUAL_CHANGE
}

// The Feeding / Mortality / Water / Feed plan tab of the farm records, held in `?tab=`.
export const RECORDS_TABS = ['feeding', 'mortality', 'water', 'plan'] as const
export type RecordsTab = (typeof RECORDS_TABS)[number]

export const RECORDS_TAB_LABELS: Record<RecordsTab, string> = {
  feeding: 'Feeding',
  mortality: 'Mortality',
  water: 'Water',
  plan: 'Feed plan',
}

export function recordsTabFrom(value: unknown): RecordsTab {
  return RECORDS_TABS.find((tab) => tab === value) ?? 'feeding'
}

export const RECORD_OFFLINE_MESSAGES = {
  growth: 'Reconnect before saving this growth record. It has not been queued.',
  mortality: 'Reconnect before saving mortality. It has not been queued.',
  waterCheck: 'Reconnect before saving this water check. It has not been queued.',
  harvest: 'Reconnect before completing harvest. This high-impact record is not queued.',
} as const

// A harvest is recorded only once the server's estimate from a current sample says the fish
// may be ready; elapsed days alone never open the form.
export function canRecordHarvest(status: HarvestReadinessStatus) {
  return status === 'READY_SOON' || status === 'POTENTIALLY_READY'
}

// The readiness status as words, shown on the chip above the server's plain-language message.
export function readinessStatusWords(status: HarvestReadinessStatus) {
  return status.replaceAll('_', ' ')
}

export interface HarvestForm {
  harvestDate: string
  numberHarvested: string
  totalHarvestWeight: string
  averageFishWeight: string
  sellingPricePerKg: string
  notes: string
}

export function harvestFormErrors(form: HarvestForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.harvestDate) errors.harvestDate = 'Choose the harvest date.'
  if (parseWholeNumber(form.numberHarvested) === null)
    errors.numberHarvested = 'Enter the number of fish harvested as a whole number.'
  if (parsePositiveNumber(form.totalHarvestWeight) === null)
    errors.totalHarvestWeight = 'Enter the total harvest weight in kg.'
  if (parsePositiveNumber(form.averageFishWeight) === null)
    errors.averageFishWeight = 'Enter the average fish weight in g.'
  if (pesosToCentavos(form.sellingPricePerKg) === null)
    errors.sellingPricePerKg = 'Enter the selling price per kg in pesos, like 120 or 120.50.'
  return errors
}

// Builds the harvest request from a form `harvestFormErrors` has passed.
export function harvestRequest(form: HarvestForm): CreateHarvestRequest {
  return {
    harvestDate: form.harvestDate,
    numberHarvested: Number(form.numberHarvested),
    totalHarvestWeight: { value: Number(form.totalHarvestWeight), unit: 'KG' },
    averageFishWeight: { value: Number(form.averageFishWeight), unit: 'G' },
    sellingPricePerKg: {
      amountMinor: pesosToCentavos(form.sellingPricePerKg) ?? 0,
      currency: 'PHP',
    },
    notes: notesOrNull(form.notes),
  }
}
