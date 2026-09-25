import type { WaterQualityRepository } from '../domain/water-quality.repository.interface'
import {
  createWaterParameterLogApi,
  createWaterSafetyCheckApi,
  getWaterThresholdsApi,
  listWaterParameterLogsApi,
} from './water-quality.api'

export const waterQualityRepository: WaterQualityRepository = {
  getWaterThresholds: getWaterThresholdsApi,
  createWaterSafetyCheck: createWaterSafetyCheckApi,
  listWaterParameterLogs: listWaterParameterLogsApi,
  createWaterParameterLog: createWaterParameterLogApi,
}
