import type { Envelope, Page } from '@core/http'

import type {
  CompleteTaskRequest,
  CultivationDetail,
  CultivationSummary,
  CultivationTimeline,
  FarmTask,
  TaskCompletionResult,
  TaskFilters,
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
}
