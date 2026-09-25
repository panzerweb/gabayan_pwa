import type { FeedsRepository } from '../domain/feeds.repository.interface'
import { getFeedGuideApi } from './feeds.api'

export const feedsRepository: FeedsRepository = {
  getFeedGuide: getFeedGuideApi,
}
