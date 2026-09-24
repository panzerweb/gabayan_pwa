import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'
import { cartSchema } from '@pages/cart/domain/cart.model'

import {
  favoriteResultSchema,
  productCategorySchema,
  productDetailSchema,
  productSummarySchema,
  type AddCartItemRequest,
  type ProductFilters,
} from '../domain/marketplace.model'

// The catalog is small; one page of 100 holds every category and every matching product.
const CATALOG_PAGE_LIMIT = 100

function catalogQuery(filters: ProductFilters = {}) {
  const query = new URLSearchParams({ limit: String(CATALOG_PAGE_LIMIT) })
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value)
  }
  return query.toString()
}

// Categories are shared reference data and are read without a token (BLOCKERS D-17).
export async function listProductCategoriesApi() {
  return apiRequest(`${ENDPOINTS.productCategories.root}?${catalogQuery()}`, {
    method: 'GET',
    schema: pageSchema(productCategorySchema),
  })
}

export async function listProductsApi(filters: ProductFilters, accessToken: string) {
  return apiRequest(`${ENDPOINTS.products.root}?${catalogQuery(filters)}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(productSummarySchema),
  })
}

export async function getProductApi(productId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.products.detail(productId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(productDetailSchema),
  })
}

export async function favoriteProductApi(productId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.products.favorite(productId), {
    method: 'PUT',
    accessToken,
    schema: envelopeSchema(favoriteResultSchema),
  })
}

export async function unfavoriteProductApi(productId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.products.favorite(productId), {
    method: 'DELETE',
    accessToken,
    schema: envelopeSchema(favoriteResultSchema),
  })
}

// Adding a product already in the cart raises its quantity; the server answers the cart.
export async function addCartItemApi(body: AddCartItemRequest, accessToken: string) {
  return apiRequest(ENDPOINTS.cartItems.root, {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}
