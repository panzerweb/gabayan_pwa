import type { Envelope, Page } from '@core/http'
import type { Cart } from '@pages/cart/domain/cart.model'

import type {
  AddCartItemRequest,
  FavoriteResult,
  ProductCategory,
  ProductDetail,
  ProductFilters,
  ProductSummary,
} from './marketplace.model'

export interface MarketplaceRepository {
  listProductCategories(): Promise<Page<ProductCategory>>
  listProducts(filters: ProductFilters, accessToken: string): Promise<Page<ProductSummary>>
  getProduct(productId: string, accessToken: string): Promise<Envelope<ProductDetail>>
  favoriteProduct(productId: string, accessToken: string): Promise<Envelope<FavoriteResult>>
  unfavoriteProduct(productId: string, accessToken: string): Promise<Envelope<FavoriteResult>>
  addCartItem(body: AddCartItemRequest, accessToken: string): Promise<Envelope<Cart>>
}
