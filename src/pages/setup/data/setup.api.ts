import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'
import { cultivationDetailSchema } from '@pages/cultivations/domain/cultivations.model'

import {
  compatibilityResultSchema,
  cultureEnvironmentSchema,
  equipmentRecommendationsSchema,
  speciesSummarySchema,
  stockingEstimateSchema,
  type CreateCultivationRequest,
  type ListSpeciesParams,
  type StockingEstimateRequest,
} from '../domain/setup.model'

// Species and environments are public reference data, read without a session.
export async function listSpeciesApi(params: ListSpeciesParams = {}) {
  const query = new URLSearchParams()
  if (params.active !== undefined) query.set('active', String(params.active))
  if (params.cursor) query.set('cursor', params.cursor)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  return apiRequest(`${ENDPOINTS.species.root}${suffix}`, {
    method: 'GET',
    schema: pageSchema(speciesSummarySchema),
  })
}

export async function listCultureEnvironmentsApi() {
  const query = new URLSearchParams({ active: 'true' })
  return apiRequest(`${ENDPOINTS.cultureEnvironments.root}?${query.toString()}`, {
    method: 'GET',
    schema: pageSchema(cultureEnvironmentSchema),
  })
}

export async function getCompatibilityApi(speciesId: string, environmentId: string) {
  const query = new URLSearchParams({ speciesId, environmentId })
  return apiRequest(`${ENDPOINTS.compatibility.root}?${query.toString()}`, {
    method: 'GET',
    schema: envelopeSchema(compatibilityResultSchema),
  })
}

export async function createStockingEstimateApi(
  body: StockingEstimateRequest,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.stockingEstimates.root, {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(stockingEstimateSchema),
  })
}

export async function createCultivationApi(
  body: CreateCultivationRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cultivations.root, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(cultivationDetailSchema),
  })
}

export async function getEquipmentRecommendationsApi(cultivationId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.cultivations.equipmentRecommendations(cultivationId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(equipmentRecommendationsSchema),
  })
}
