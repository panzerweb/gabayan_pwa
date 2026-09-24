import type { Envelope, Page } from '@core/http'
import type { CultivationDetail } from '@pages/cultivations/domain/cultivations.model'

import type {
  CompatibilityResult,
  CreateCultivationRequest,
  CultureEnvironment,
  EquipmentRecommendations,
  ListSpeciesParams,
  SizingGuidance,
  SpeciesSummary,
  StockingEstimate,
  StockingEstimateRequest,
} from './setup.model'

export interface SetupRepository {
  listSpecies(params?: ListSpeciesParams): Promise<Page<SpeciesSummary>>
  listCultureEnvironments(): Promise<Page<CultureEnvironment>>
  getCompatibility(speciesId: string, environmentId: string): Promise<Envelope<CompatibilityResult>>
  getSizingGuidance(speciesId: string, environmentId: string): Promise<Envelope<SizingGuidance>>
  createStockingEstimate(
    body: StockingEstimateRequest,
    accessToken: string,
  ): Promise<Envelope<StockingEstimate>>
  createCultivation(
    body: CreateCultivationRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<CultivationDetail>>
  getEquipmentRecommendations(
    cultivationId: string,
    accessToken: string,
  ): Promise<Envelope<EquipmentRecommendations>>
}
