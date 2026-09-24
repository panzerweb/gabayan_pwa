import type { Envelope } from '@core/http'

import type {
  WaterSafetyCheck,
  WaterSafetyCheckRequest,
  WaterThresholdSet,
} from './water-quality.model'

export interface WaterQualityRepository {
  getWaterThresholds(
    speciesId: string,
    environmentId: string,
    accessToken: string,
  ): Promise<Envelope<WaterThresholdSet>>
  createWaterSafetyCheck(
    body: WaterSafetyCheckRequest,
    accessToken: string,
  ): Promise<Envelope<WaterSafetyCheck>>
}
