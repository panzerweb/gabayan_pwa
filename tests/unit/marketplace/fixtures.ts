import type {
  ProductCategory,
  ProductDetail,
  ProductSummary,
} from '@pages/marketplace/domain/marketplace.model'

export const meta = { requestId: 'req_1' }

export const pageInfo = { cursor: null, nextCursor: null, limit: 100, total: 1 }

export const aeration: ProductCategory = {
  id: 'cat_aeration',
  code: 'AERATION',
  name: 'Aeration',
  icon: 'aeration',
  sortOrder: 2,
}

export const testing: ProductCategory = {
  id: 'cat_testing',
  code: 'TESTING',
  name: 'Testing',
  icon: 'testing',
  sortOrder: 4,
}

export const aerator: ProductSummary = {
  id: 'prd_pond_aerator',
  sku: 'GBY-AER-001',
  name: 'Compact Pond Aerator',
  shortDescription: 'A compact aerator for suitable small pond and tank setups.',
  primaryImage: { url: '/mock-media/aerator.svg', alt: 'Compact pond aerator' },
  price: { amountMinor: 129900, currency: 'PHP' },
  rating: 4.7,
  ratingCount: 84,
  soldCount: 210,
  availability: 'AVAILABLE',
  stockQuantity: 24,
  category: aeration,
  badges: ['Setup support'],
  isFavorite: false,
}

export const aeratorDetail: ProductDetail = {
  ...aerator,
  images: [{ url: '/icon.svg', alt: 'Compact pond aerator' }],
  description:
    'A compact electric aerator intended for suitable small pond and tank setups. Confirm electrical safety and actual oxygen needs before use.',
  specifications: [
    { label: 'Rated power', value: '45 W' },
    { label: 'Cable length', value: '5 m' },
  ],
  suitableSpeciesIds: ['sp_tilapia'],
  suitableEnvironmentIds: ['env_pond'],
  recommendation: {
    cultivationId: 'cul_tilapia_001',
    why: 'Aeration may support dissolved oxygen when appropriate for this pond setup.',
  },
  maximumOrderQuantity: 4,
}

export function envelope<T>(data: T) {
  return { data, meta }
}

export function page<T>(items: T[]) {
  return { data: items, page: { ...pageInfo, total: items.length }, meta }
}
