import type { FeedGuide, FeedGuideStage } from '@pages/feeds/domain/feeds.model'
import type { ProductSummary } from '@pages/marketplace/domain/marketplace.model'

const disclaimer =
  'Typical figures from commercial feed labels, not yet reviewed for your farm. Follow the label on the feed you buy and local technical guidance, and watch how your fish eat.'

const placeholderBasis =
  'Typical range printed on commercial tilapia feed labels, entered as a demo placeholder. Not yet reviewed against SEAFDEC/AQD or by a feed specialist.'

export const growerFeed: ProductSummary = {
  id: 'prd_grower_feed',
  sku: 'GBY-FED-020',
  name: 'Tilapia Grower Feed 20 kg',
  shortDescription: 'Demo grower feed listing for planned supply shopping.',
  primaryImage: { url: '/icon.svg', alt: 'Bag of Tilapia grower feed' },
  price: { amountMinor: 118000, currency: 'PHP' },
  rating: 4.6,
  ratingCount: 126,
  soldCount: 540,
  availability: 'AVAILABLE',
  stockQuantity: 36,
  category: { id: 'cat_feeds', code: 'FEEDS', name: 'Feeds', icon: 'feed', sortOrder: 1 },
  badges: ['Popular'],
  isFavorite: false,
}

export const growingStage: FeedGuideStage = {
  growthStageCode: 'GROWING',
  growthStage: 'Growing',
  weightRange: { minimum: { value: 0, unit: 'G' }, maximum: { value: 300, unit: 'G' } },
  feedType: 'Tilapia grower pellets, floating',
  proteinPercent: { minimum: 28, maximum: 32 },
  pelletSize: { minimum: 2, maximum: 4, unit: 'MM' },
  feedingsPerDay: 2,
  basis: placeholderBasis,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
  products: [growerFeed],
}

export const preHarvestStage: FeedGuideStage = {
  growthStageCode: 'PRE_HARVEST',
  growthStage: 'Pre-harvest',
  weightRange: { minimum: { value: 300, unit: 'G' }, maximum: null },
  feedType: 'Tilapia finisher pellets, floating',
  proteinPercent: { minimum: 25, maximum: 28 },
  pelletSize: { minimum: 4, maximum: 6, unit: 'MM' },
  feedingsPerDay: 2,
  basis: placeholderBasis,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
  products: [],
}

export const tilapiaFeedGuide: FeedGuide = {
  species: { id: 'sp_tilapia', commonName: 'Tilapia', localName: 'Tilapia' },
  stages: [growingStage, preHarvestStage],
  sources: [
    {
      title: 'Development of cost-efficient feeds',
      organization: 'SEAFDEC Aquaculture Department',
      url: 'https://www.seafdec.org.ph/development-of-cost-efficient-feeds/',
      reviewedAt: null,
      reviewedBy: null,
    },
  ],
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
  disclaimer,
}
