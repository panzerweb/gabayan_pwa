import type { CartRepository } from '../domain/cart.repository.interface'
import {
  createCheckoutQuoteApi,
  createOrderApi,
  getCartApi,
  listDeliveryAddressesApi,
  listPaymentOptionsApi,
  removeCartItemApi,
  updateCartItemApi,
} from './cart.api'

export const cartRepository: CartRepository = {
  getCart: getCartApi,
  updateCartItem: updateCartItemApi,
  removeCartItem: removeCartItemApi,
  listDeliveryAddresses: listDeliveryAddressesApi,
  listPaymentOptions: listPaymentOptionsApi,
  createCheckoutQuote: createCheckoutQuoteApi,
  createOrder: createOrderApi,
}
