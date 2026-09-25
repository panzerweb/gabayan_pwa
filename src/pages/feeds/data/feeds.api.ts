import { apiRequest, envelopeSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import { feedGuideSchema } from '../domain/feeds.model'

// Answers 404 NOT_FOUND for an unknown species or one with no feed-guide rows.
export async function getFeedGuideApi(speciesId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.species.feedGuide(speciesId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(feedGuideSchema),
  })
}
