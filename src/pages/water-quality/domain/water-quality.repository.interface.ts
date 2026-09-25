import type { Envelope, Page } from '@core/http'

import type {
  CreateWaterParameterLogRequest,
  WaterParameterLog,
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
  listWaterParameterLogs(
    cultivationId: string,
    accessToken: string,
  ): Promise<Page<WaterParameterLog>>
  createWaterParameterLog(
    cultivationId: string,
    body: CreateWaterParameterLogRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<WaterParameterLog>>
}
