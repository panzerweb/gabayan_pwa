import type { MarketplaceRepository } from '../domain/marketplace.repository.interface'
import {
  addCartItemApi,
  favoriteProductApi,
  getProductApi,
  listProductCategoriesApi,
  listProductsApi,
  unfavoriteProductApi,
} from './marketplace.api'

export const marketplaceRepository: MarketplaceRepository = {
  listProductCategories: listProductCategoriesApi,
  listProducts: listProductsApi,
  getProduct: getProductApi,
  favoriteProduct: favoriteProductApi,
  unfavoriteProduct: unfavoriteProductApi,
  addCartItem: addCartItemApi,
}
