import type { SetupRepository } from '../domain/setup.repository.interface'
import {
  createCultivationApi,
  createStockingEstimateApi,
  getCompatibilityApi,
  getEquipmentRecommendationsApi,
  listCultureEnvironmentsApi,
  listSpeciesApi,
} from './setup.api'

export const setupRepository: SetupRepository = {
  listSpecies: listSpeciesApi,
  listCultureEnvironments: listCultureEnvironmentsApi,
  getCompatibility: getCompatibilityApi,
  createStockingEstimate: createStockingEstimateApi,
  createCultivation: createCultivationApi,
  getEquipmentRecommendations: getEquipmentRecommendationsApi,
}
