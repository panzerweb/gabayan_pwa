import type { Envelope } from '@core/http'

import type { FeedGuide } from './feeds.model'

export interface FeedsRepository {
  getFeedGuide(speciesId: string, accessToken: string): Promise<Envelope<FeedGuide>>
}
