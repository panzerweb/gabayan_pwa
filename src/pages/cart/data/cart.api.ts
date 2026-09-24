import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'
import { orderDetailSchema } from '@pages/orders/domain/orders.model'
import { addressSchema } from '@pages/profile/domain/profile.model'

import {
  cartSchema,
  checkoutQuoteSchema,
  paymentOptionSchema,
  type CheckoutQuoteRequest,
  type CreateOrderRequest,
  type UpdateCartItemRequest,
} from '../domain/cart.model'

// Addresses and payment options are a handful each; one page of 100 reads them all.
const LIST_PAGE_LIMIT = 100

export async function getCartApi(accessToken: string) {
  return apiRequest(ENDPOINTS.cart.root, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}

export async function updateCartItemApi(
  itemId: string,
  body: UpdateCartItemRequest,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.cartItems.detail(itemId), {
    method: 'PATCH',
    body,
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}

export async function removeCartItemApi(itemId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.cartItems.detail(itemId), {
    method: 'DELETE',
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}

// The account's own address book, read for the checkout's delivery address.
export async function listDeliveryAddressesApi(accessToken: string) {
  return apiRequest(`${ENDPOINTS.addresses.root}?limit=${LIST_PAGE_LIMIT}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(addressSchema),
  })
}

export async function listPaymentOptionsApi(accessToken: string) {
  return apiRequest(`${ENDPOINTS.checkout.paymentOptions}?limit=${LIST_PAGE_LIMIT}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(paymentOptionSchema),
  })
}

// The server prices the cart; the quote is the only total an order may be placed against.
export async function createCheckoutQuoteApi(body: CheckoutQuoteRequest, accessToken: string) {
  return apiRequest(ENDPOINTS.checkout.quote, {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(checkoutQuoteSchema),
  })
}

// `idempotencyKey` belongs to one placement attempt and is resent unchanged on retry, so a
// retried request can never place a second order.
export async function createOrderApi(
  body: CreateOrderRequest,
  idempotencyKey: string,
  accessToken: string,
) {
  return apiRequest(ENDPOINTS.orders.root, {
    method: 'POST',
    body,
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(orderDetailSchema),
  })
}
