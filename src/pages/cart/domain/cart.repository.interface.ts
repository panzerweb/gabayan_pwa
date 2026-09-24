import type { Envelope, Page } from '@core/http'
import type { OrderDetail } from '@pages/orders/domain/orders.model'
import type { Address } from '@pages/profile/domain/profile.model'

import type {
  Cart,
  CheckoutQuote,
  CheckoutQuoteRequest,
  CreateOrderRequest,
  PaymentOption,
  UpdateCartItemRequest,
} from './cart.model'

export interface CartRepository {
  getCart(accessToken: string): Promise<Envelope<Cart>>
  updateCartItem(
    itemId: string,
    body: UpdateCartItemRequest,
    accessToken: string,
  ): Promise<Envelope<Cart>>
  removeCartItem(itemId: string, accessToken: string): Promise<Envelope<Cart>>
  listDeliveryAddresses(accessToken: string): Promise<Page<Address>>
  listPaymentOptions(accessToken: string): Promise<Page<PaymentOption>>
  createCheckoutQuote(
    body: CheckoutQuoteRequest,
    accessToken: string,
  ): Promise<Envelope<CheckoutQuote>>
  createOrder(
    body: CreateOrderRequest,
    idempotencyKey: string,
    accessToken: string,
  ): Promise<Envelope<OrderDetail>>
}
