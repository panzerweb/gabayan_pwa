import type { WaterQualityRepository } from '../domain/water-quality.repository.interface'
import { createWaterSafetyCheckApi, getWaterThresholdsApi } from './water-quality.api'

export const waterQualityRepository: WaterQualityRepository = {
  getWaterThresholds: getWaterThresholdsApi,
  createWaterSafetyCheck: createWaterSafetyCheckApi,
}
