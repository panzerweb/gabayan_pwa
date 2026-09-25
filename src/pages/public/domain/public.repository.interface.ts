import type { Envelope } from '@core/http'

import type { Health } from './public.model'

export interface PublicRepository {
  getHealth(): Promise<Envelope<Health>>
}
