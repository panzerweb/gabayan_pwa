import type { CultivationsRepository } from '../domain/cultivations.repository.interface'
import {
  completeTaskApi,
  getCultivationApi,
  getCultivationTimelineApi,
  listCultivationsApi,
  listTasksApi,
} from './cultivations.api'

export const cultivationsRepository: CultivationsRepository = {
  listCultivations: listCultivationsApi,
  getCultivation: getCultivationApi,
  getCultivationTimeline: getCultivationTimelineApi,
  listTasks: listTasksApi,
  completeTask: completeTaskApi,
}
