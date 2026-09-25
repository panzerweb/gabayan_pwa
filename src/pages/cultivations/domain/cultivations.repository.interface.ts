import type { Envelope, Page } from '@core/http'

import type {
  CompleteTaskRequest,
  CreateGrowthMeasurementRequest,
  CreateHarvestRequest,
  CreateMortalityRequest,
  CreateWaterCheckRequest,
  CultivationDetail,
  CultivationSummary,
  CultivationTimeline,
  FarmTask,
  FeedConversion,
  FeedingPlan,
  FeedingRecord,
  GrowthMeasurement,
  GrowthMutationResult,
  HarvestCompletion,
  HarvestReadiness,
  MortalityMutationResult,
  MortalityRecord,
  TaskCompletionResult,
  TaskFilters,
  WaterCheck,
  WaterCheckMutationResult,
} from './cultivations.model'

export interface CultivationsRepository {
  listCultivations(accessToken: string, limit?: number): Promise<Page<CultivationSummary>>
  getCultivation(cultivationId: string, accessToken: string): Promise<Envelope<CultivationDetail>>
  getCultivationTimeline(
    cultivationId: string,
    accessToken: string,
  ): Promise<Envelope<CultivationTimeline>>
  listTasks(filters: TaskFilters, accessToken: string): Promise<Page<FarmTask>>
  completeTask(
    taskId: string,
    body: CompleteTaskRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<TaskCompletionResult>>
  listGrowthMeasurements(
    cultivationId: string,
    accessToken: string,
  ): Promise<Page<GrowthMeasurement>>
  createGrowthMeasurement(
    cultivationId: string,
    body: CreateGrowthMeasurementRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<GrowthMutationResult>>
  listMortalityRecords(cultivationId: string, accessToken: string): Promise<Page<MortalityRecord>>
  createMortalityRecord(
    cultivationId: string,
    body: CreateMortalityRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<MortalityMutationResult>>
  getFeedingPlan(
    cultivationId: string,
    accessToken: string,
    date?: string,
  ): Promise<Envelope<FeedingPlan>>
  listFeedingRecords(cultivationId: string, accessToken: string): Promise<Page<FeedingRecord>>
  listWaterChecks(cultivationId: string, accessToken: string): Promise<Page<WaterCheck>>
  createWaterCheck(
    cultivationId: string,
    body: CreateWaterCheckRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<WaterCheckMutationResult>>
  getHarvestReadiness(
    cultivationId: string,
    accessToken: string,
  ): Promise<Envelope<HarvestReadiness>>
  completeHarvest(
    cultivationId: string,
    body: CreateHarvestRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<HarvestCompletion>>
  getFeedConversion(cultivationId: string, accessToken: string): Promise<Envelope<FeedConversion>>
}
