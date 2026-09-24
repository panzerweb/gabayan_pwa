import type { HomeRepository } from '../domain/home.repository.interface'
import { getHomeDashboardApi } from './home.api'

export const homeRepository: HomeRepository = {
  getHomeDashboard: getHomeDashboardApi,
}
