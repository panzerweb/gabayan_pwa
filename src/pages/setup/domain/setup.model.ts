import { z } from 'zod'

import type { AppIconName } from '@components/ui/AppIcon.vue'
import { mediaAssetSchema, sourceStatusSchema } from '@core/http'
import { moneySchema, productCategorySchema } from '@pages/marketplace/domain/marketplace.model'

export const speciesSummarySchema = z.object({
  id: z.string().min(1),
  commonName: z.string().min(1),
  localName: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  beginnerFriendly: z.boolean(),
  image: mediaAssetSchema,
  estimatedCultureDays: z.object({
    minimum: z.number().int().positive(),
    maximum: z.number().int().positive(),
  }),
  active: z.boolean(),
  sourceStatus: sourceStatusSchema,
})

export const cultureEnvironmentSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  image: mediaAssetSchema,
  active: z.boolean(),
  dimensionModel: z.literal('RECTANGULAR_VOLUME'),
  guidanceSummary: z.string().min(1),
  sourceStatus: sourceStatusSchema,
})

export const compatibilityStatusSchema = z.enum(['COMPATIBLE', 'CAUTION', 'NOT_RECOMMENDED'])

export const compatibilityResultSchema = z.object({
  speciesId: z.string().min(1),
  environmentId: z.string().min(1),
  status: compatibilityStatusSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  alternatives: z.array(z.object({ environmentId: z.string(), name: z.string() })),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
})

export const dimensionsSchema = z.object({
  lengthM: z.number().positive(),
  widthM: z.number().positive(),
  waterDepthM: z.number().positive(),
})

export const stockingStatusSchema = z.enum(['BELOW_RANGE', 'RECOMMENDED', 'ABOVE_RANGE'])

export const stockingEstimateSchema = z.object({
  estimateId: z.string().min(1),
  species: speciesSummarySchema,
  environment: cultureEnvironmentSchema,
  dimensions: dimensionsSchema,
  surfaceAreaM2: z.number().positive(),
  estimatedWaterVolumeM3: z.number().positive(),
  plannedFingerlings: z.number().int().positive(),
  recommendedMinimum: z.number().int().positive(),
  recommendedMaximum: z.number().int().positive(),
  status: stockingStatusSchema,
  differenceToRange: z.number().int(),
  suggestedFingerlings: z.number().int().positive(),
  basis: z.object({
    type: z.enum(['SURFACE_AREA', 'WATER_VOLUME']),
    densityMinimum: z.number().nonnegative(),
    densityMaximum: z.number().nonnegative(),
    densityUnit: z.enum(['FISH_PER_M2', 'FISH_PER_M3']),
    inputAreaM2: z.number().positive(),
    inputVolumeM3: z.number().positive(),
    explanation: z.string().min(1),
  }),
  compatibility: compatibilityResultSchema,
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  expiresAt: z.string().min(1),
  disclaimer: z.string().min(1),
})

// The compact species and environment a cultivation carries, cut from the reference profiles.
const compactSpeciesSchema = speciesSummarySchema.pick({
  id: true,
  commonName: true,
  localName: true,
  image: true,
})

const compactEnvironmentSchema = cultureEnvironmentSchema.pick({ id: true, code: true, name: true })

// Only the product fields the setup success screen shows; the full `ProductSummary` stays with
// the marketplace, which is where the farmer goes to buy.
export const recommendedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  price: moneySchema,
  category: productCategorySchema,
  recommendationBadge: z.string(),
  whyRelevant: z.string(),
  suggestedQuantity: z.number().int().positive(),
  mandatory: z.literal(false),
})

export const equipmentRecommendationsSchema = z.object({
  cultivationId: z.string(),
  context: z.object({
    species: compactSpeciesSchema,
    environment: compactEnvironmentSchema,
    initialFingerlings: z.number().int().positive(),
    estimatedWaterVolumeM3: z.number().positive(),
  }),
  sections: z.array(
    z.object({
      category: productCategorySchema,
      reason: z.string(),
      products: z.array(recommendedProductSchema),
    }),
  ),
  isDemo: z.boolean(),
  ruleVersion: z.string(),
  disclaimer: z.string(),
})

export type SpeciesSummary = z.infer<typeof speciesSummarySchema>
export type CultureEnvironment = z.infer<typeof cultureEnvironmentSchema>
export type CompatibilityStatus = z.infer<typeof compatibilityStatusSchema>
export type CompatibilityResult = z.infer<typeof compatibilityResultSchema>
export type Dimensions = z.infer<typeof dimensionsSchema>
export type StockingStatus = z.infer<typeof stockingStatusSchema>
export type StockingEstimate = z.infer<typeof stockingEstimateSchema>
export type RecommendedProduct = z.infer<typeof recommendedProductSchema>
export type EquipmentRecommendations = z.infer<typeof equipmentRecommendationsSchema>

export interface ListSpeciesParams {
  active?: boolean
  cursor?: string
  limit?: number
}

export interface StockingEstimateRequest {
  speciesId: string
  environmentId: string
  dimensions: Dimensions
  plannedFingerlings: number
}

export interface CreateCultivationRequest {
  name?: string
  estimateId: string
  speciesId: string
  environmentId: string
  dimensions: Dimensions
  initialFingerlings: number
  stockedOn?: string | null
  acceptedAboveRangeWarning?: boolean
  aboveRangeReason?: string | null
}

// What the wizard has collected so far. Kept in session storage so a reload resumes the step.
export interface SetupDraft {
  speciesId: string | null
  environmentId: string | null
  dimensions: Dimensions | null
  plannedFingerlings: number | null
  estimate: StockingEstimate | null
  acceptedAboveRangeWarning: boolean
  cultivationName: string
  stockedOn: string | null
}

export type FormErrors = Partial<Record<string, string>>

type StatusTone = 'info' | 'success' | 'warning'

export type StatusDisplay = { tone: StatusTone; icon: AppIconName }

export const SETUP_OFFLINE_MESSAGES = {
  estimate: 'Reconnect before requesting a new stocking estimate.',
  create: 'Reconnect before creating this cultivation. Your setup draft is still saved.',
} as const

// Dimensions above this many meters are treated as a typing mistake rather than a real pond.
export const MAX_DIMENSION_M = 10000

export function emptySetupDraft(): SetupDraft {
  return {
    speciesId: null,
    environmentId: null,
    dimensions: null,
    plannedFingerlings: null,
    estimate: null,
    acceptedAboveRangeWarning: false,
    cultivationName: '',
    stockedOn: null,
  }
}

// "Milkfish (Bangus)", or just the one name where the local name is the same.
export function speciesTitle(species: Pick<SpeciesSummary, 'commonName' | 'localName'>) {
  return species.localName === species.commonName
    ? species.commonName
    : `${species.commonName} (${species.localName})`
}

export function speciesNote(species: Pick<SpeciesSummary, 'beginnerFriendly'>) {
  return species.beginnerFriendly
    ? 'Beginner-friendly demo profile'
    : 'Additional planning may help'
}

export function compatibilityDisplay(status: CompatibilityStatus): StatusDisplay {
  return status === 'COMPATIBLE'
    ? { tone: 'success', icon: 'check' }
    : { tone: 'warning', icon: 'warning' }
}

// The environment step opens the next one only once the chosen pairing has been checked and
// the profile does not advise against it.
export function canContinueFromEnvironment(
  environmentId: string | null,
  compatibility: CompatibilityResult | undefined,
  checking: boolean,
) {
  return (
    Boolean(environmentId) &&
    !checking &&
    compatibility !== undefined &&
    compatibility.environmentId === environmentId &&
    compatibility.status !== 'NOT_RECOMMENDED'
  )
}

export interface DimensionsForm {
  lengthM: string
  widthM: string
  waterDepthM: string
}

const DIMENSION_LABELS: Record<keyof DimensionsForm, string> = {
  lengthM: 'a length',
  widthM: 'a width',
  waterDepthM: 'a water depth',
}

// A typed measurement in meters, or null when it is blank, not a number, or out of bounds.
// Blank input is never read as 0.
export function parseMeters(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_DIMENSION_M ? parsed : null
}

export function dimensionsFormErrors(form: DimensionsForm): FormErrors {
  const errors: FormErrors = {}
  for (const field of Object.keys(DIMENSION_LABELS) as (keyof DimensionsForm)[]) {
    if (parseMeters(form[field]) === null) {
      errors[field] = `Enter ${DIMENSION_LABELS[field]} greater than 0.`
    }
  }
  return errors
}

// The dimensions the form describes, or null until every field is a valid measurement.
export function dimensionsFrom(form: DimensionsForm): Dimensions | null {
  const lengthM = parseMeters(form.lengthM)
  const widthM = parseMeters(form.widthM)
  const waterDepthM = parseMeters(form.waterDepthM)
  if (lengthM === null || widthM === null || waterDepthM === null) return null
  return { lengthM, widthM, waterDepthM }
}

export function dimensionsFormFrom(dimensions: Dimensions | null): DimensionsForm {
  return {
    lengthM: dimensions?.lengthM.toString() ?? '',
    widthM: dimensions?.widthM.toString() ?? '',
    waterDepthM: dimensions?.waterDepthM.toString() ?? '',
  }
}

// A planned fingerling count: a whole number above zero, or null.
export function parseFingerlings(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export const FINGERLINGS_ERROR = 'Enter a whole number greater than 0.'

// The estimate request for the draft, or null while an earlier step is still unanswered.
export function stockingEstimateRequest(
  draft: Pick<SetupDraft, 'speciesId' | 'environmentId' | 'dimensions'>,
  plannedFingerlings: number,
): StockingEstimateRequest | null {
  if (!draft.speciesId || !draft.environmentId || !draft.dimensions) return null
  return {
    speciesId: draft.speciesId,
    environmentId: draft.environmentId,
    dimensions: draft.dimensions,
    plannedFingerlings,
  }
}

export interface StockingResultContent extends StatusDisplay {
  title: string
  message: string
}

export function stockingResultContent(status: StockingStatus): StockingResultContent {
  if (status === 'BELOW_RANGE') {
    return {
      title: 'Your plan is below the demo range',
      message: 'A lower count may use less of the estimated culture-area capacity.',
      tone: 'info',
      icon: 'info',
    }
  }
  if (status === 'ABOVE_RANGE') {
    return {
      title: 'Your plan is above the demo range',
      message: 'A higher count may increase oxygen, feeding, and water-management demands.',
      tone: 'warning',
      icon: 'warning',
    }
  }
  return {
    title: 'Your plan is within the demo range',
    message: 'The planned count falls within this prototype profile’s estimated range.',
    tone: 'success',
    icon: 'check',
  }
}

export function stockingStatusLabel(status: StockingStatus) {
  if (status === 'BELOW_RANGE') return 'Below the demo range'
  if (status === 'ABOVE_RANGE') return 'Above the demo range'
  return 'Within the demo range'
}

// An above-range plan goes on to review only after the farmer has confirmed the warning.
export function canReviewEstimate(estimate: StockingEstimate, acceptedAboveRangeWarning: boolean) {
  return estimate.status !== 'ABOVE_RANGE' || acceptedAboveRangeWarning
}

export interface CultivationDetailsForm {
  cultivationName: string
  stockedOn: string
  aboveRangeReason: string
}

// The creation request for an estimate. Fields the farmer left blank are omitted or null, and
// the above-range confirmation is sent only for an above-range plan, exactly as given.
export function createCultivationRequest(
  estimate: StockingEstimate,
  form: CultivationDetailsForm,
  acceptedAboveRangeWarning: boolean,
): CreateCultivationRequest {
  const name = form.cultivationName.trim()
  return {
    ...(name ? { name } : {}),
    estimateId: estimate.estimateId,
    speciesId: estimate.species.id,
    environmentId: estimate.environment.id,
    dimensions: estimate.dimensions,
    initialFingerlings: estimate.plannedFingerlings,
    stockedOn: form.stockedOn || null,
    ...(estimate.status === 'ABOVE_RANGE'
      ? {
          acceptedAboveRangeWarning,
          aboveRangeReason: form.aboveRangeReason.trim() || null,
        }
      : {}),
  }
}

export function recommendedProducts(recommendations: EquipmentRecommendations) {
  return recommendations.sections.flatMap((section) => section.products)
}
