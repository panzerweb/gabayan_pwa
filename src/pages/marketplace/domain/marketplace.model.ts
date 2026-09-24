import { z } from 'zod'

import { mediaAssetSchema } from '@core/http'

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.literal('PHP'),
})

export const productAvailabilitySchema = z.enum(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'])

export const productCategorySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
})

export const productSummarySchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  primaryImage: mediaAssetSchema,
  price: moneySchema,
  rating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  soldCount: z.number().int().nonnegative(),
  availability: productAvailabilitySchema,
  stockQuantity: z.number().int().nonnegative().nullable(),
  category: productCategorySchema,
  badges: z.array(z.string()),
  isFavorite: z.boolean(),
})

export const productDetailSchema = productSummarySchema.extend({
  images: z.array(mediaAssetSchema),
  description: z.string(),
  specifications: z.array(z.object({ label: z.string(), value: z.string() })),
  suitableSpeciesIds: z.array(z.string()),
  suitableEnvironmentIds: z.array(z.string()),
  recommendation: z.object({ cultivationId: z.string(), why: z.string() }).nullable(),
  maximumOrderQuantity: z.number().int().positive(),
})

export const favoriteResultSchema = z.object({ productId: z.string(), isFavorite: z.boolean() })

export type Money = z.infer<typeof moneySchema>
export type ProductAvailability = z.infer<typeof productAvailabilitySchema>
export type ProductCategory = z.infer<typeof productCategorySchema>
export type ProductSummary = z.infer<typeof productSummarySchema>
export type ProductDetail = z.infer<typeof productDetailSchema>
export type FavoriteResult = z.infer<typeof favoriteResultSchema>

export interface AddCartItemRequest {
  productId: string
  quantity: number
}

export type ProductSort = 'price' | 'rating' | 'name'
export type SortOrder = 'asc' | 'desc'

// Query parameters of `GET /products`, named as the contract names them.
export interface ProductFilters {
  search?: string
  categoryId?: string
  suitableSpeciesId?: string
  suitableEnvironmentId?: string
  availability?: ProductAvailability
  sort?: ProductSort
  order?: SortOrder
}

export const PRODUCT_SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name', sort: 'name', order: 'asc' },
  { value: 'rating_desc', label: 'Top rated', sort: 'rating', order: 'desc' },
  { value: 'price_asc', label: 'Price: low to high', sort: 'price', order: 'asc' },
  { value: 'price_desc', label: 'Price: high to low', sort: 'price', order: 'desc' },
] as const satisfies ReadonlyArray<{
  value: string
  label: string
  sort: ProductSort
  order: SortOrder
}>

export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number]['value']

export const DEFAULT_PRODUCT_SORT: ProductSortOption = 'name_asc'

export const CART_OFFLINE_MESSAGE =
  'Reconnect before adding items. Cart changes are not queued offline.'

// The marketplace keeps its filters in the route query so a filtered list can be shared
// and survives a reload. Cultivation screens link here with `speciesId`/`environmentId`.
export interface MarketplaceQuery {
  search: string
  categoryId: string
  speciesId: string
  environmentId: string
  sortBy: ProductSortOption
}

function firstValue(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first.trim() : ''
}

function isSortOption(value: string): value is ProductSortOption {
  return PRODUCT_SORT_OPTIONS.some((option) => option.value === value)
}

// Reads the marketplace state out of a route query; an unknown sort falls back to name.
export function marketplaceQueryFrom(query: Record<string, unknown>): MarketplaceQuery {
  const sortBy = firstValue(query.sortBy)
  return {
    search: firstValue(query.search),
    categoryId: firstValue(query.categoryId),
    speciesId: firstValue(query.speciesId),
    environmentId: firstValue(query.environmentId),
    sortBy: isSortOption(sortBy) ? sortBy : DEFAULT_PRODUCT_SORT,
  }
}

// The `GET /products` filters for a marketplace state; empty values are left out.
export function productFiltersFrom(state: MarketplaceQuery): ProductFilters {
  const option =
    PRODUCT_SORT_OPTIONS.find((item) => item.value === state.sortBy) ?? PRODUCT_SORT_OPTIONS[0]
  return {
    ...(state.search ? { search: state.search } : {}),
    ...(state.categoryId ? { categoryId: state.categoryId } : {}),
    ...(state.speciesId ? { suitableSpeciesId: state.speciesId } : {}),
    ...(state.environmentId ? { suitableEnvironmentId: state.environmentId } : {}),
    sort: option.sort,
    order: option.order,
  }
}

// Stock status in words and tone; nothing is shown while a product is plainly available.
export function availabilityStatus(availability: ProductAvailability) {
  if (availability === 'LOW_STOCK') return { label: 'Low stock', tone: 'warning' } as const
  if (availability === 'OUT_OF_STOCK') return { label: 'Out of stock', tone: 'danger' } as const
  return null
}

// A quantity kept between one and the most one order may hold.
export function clampQuantity(quantity: number, maximum: number) {
  if (!Number.isFinite(quantity)) return 1
  return Math.min(Math.max(Math.trunc(quantity), 1), Math.max(maximum, 1))
}
