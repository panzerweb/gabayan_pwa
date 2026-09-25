import type { Envelope } from '@core/http'

import type { HomeDashboard } from './home.model'

export interface HomeRepository {
  getHomeDashboard(date: string, accessToken: string): Promise<Envelope<HomeDashboard>>
}
