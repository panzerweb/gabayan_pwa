import { z } from 'zod'

import { apiRequest } from './http'
import { envelopeSchema, mediaAssetSchema, pageSchema, sourceStatusSchema } from './schemas'
import { speciesSummarySchema } from './species'

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

export const compatibilitySchema = z.object({
  speciesId: z.string().min(1),
  environmentId: z.string().min(1),
  status: z.enum(['COMPATIBLE', 'CAUTION', 'NOT_RECOMMENDED']),
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
  status: z.enum(['BELOW_RANGE', 'RECOMMENDED', 'ABOVE_RANGE']),
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
  compatibility: compatibilitySchema,
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  expiresAt: z.string().min(1),
  disclaimer: z.string().min(1),
})

const compactSpeciesSchema = z.object({
  id: z.string(),
  commonName: z.string(),
  localName: z.string(),
  image: mediaAssetSchema,
})

const compactEnvironmentSchema = z.object({ id: z.string(), code: z.string(), name: z.string() })

export const cultivationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  species: compactSpeciesSchema,
  environment: compactEnvironmentSchema,
  status: z.enum(['PLANNING', 'ACTIVE', 'GROWING', 'PRE_HARVEST', 'COMPLETED', 'CANCELLED']),
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

const cultivationDetailSchema = cultivationSummarySchema.extend({
  dimensions: dimensionsSchema,
  surfaceAreaM2: z.number().positive(),
  estimatedWaterVolumeM3: z.number().positive(),
  stockedOn: z.string().nullable(),
  recommendationDisclaimer: z.string(),
})

const productCategorySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
})

const recommendedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  price: z.object({ amountMinor: z.number().int().nonnegative(), currency: z.literal('PHP') }),
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

export type CultureEnvironment = z.infer<typeof cultureEnvironmentSchema>
export type CompatibilityResult = z.infer<typeof compatibilitySchema>
export type CultivationSummary = z.infer<typeof cultivationSummarySchema>
export type StockingEstimate = z.infer<typeof stockingEstimateSchema>
export type EquipmentRecommendations = z.infer<typeof equipmentRecommendationsSchema>
export type Dimensions = z.infer<typeof dimensionsSchema>

export function listCultureEnvironments() {
  return apiRequest('/culture-environments?active=true', {
    method: 'GET',
    schema: pageSchema(cultureEnvironmentSchema),
  })
}

export function getCompatibility(speciesId: string, environmentId: string) {
  const query = new URLSearchParams({ speciesId, environmentId })
  return apiRequest(`/compatibility?${query.toString()}`, {
    method: 'GET',
    schema: envelopeSchema(compatibilitySchema),
  })
}

export function createStockingEstimate(
  body: {
    speciesId: string
    environmentId: string
    dimensions: Dimensions
    plannedFingerlings: number
  },
  accessToken: string,
) {
  return apiRequest('/stocking-estimates', {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(stockingEstimateSchema),
  })
}

export function listCultivations(accessToken: string, limit = 20) {
  return apiRequest(`/cultivations?limit=${limit}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(cultivationSummarySchema),
  })
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

export function createCultivation(
  body: CreateCultivationRequest,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest('/cultivations', {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(cultivationDetailSchema),
  })
}

export function getEquipmentRecommendations(cultivationId: string, accessToken: string) {
  return apiRequest(`/cultivations/${cultivationId}/equipment-recommendations`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(equipmentRecommendationsSchema),
  })
}
