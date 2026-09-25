import { apiBaseUrl } from '@core/http'
import {
  createCheckoutQuoteApi,
  createOrderApi,
  getCartApi,
  listDeliveryAddressesApi,
  listPaymentOptionsApi,
  removeCartItemApi,
  updateCartItemApi,
} from '@pages/cart/data/cart.api'

import { envelope, page } from '../marketplace/fixtures'
import { orderDetail } from '../orders/fixtures'
import { address, cart, paymentOptions, quote } from './fixtures'

function respondWith(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function sent(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  const headers = new Headers(init.headers)
  return {
    url: String(url).replace(apiBaseUrl, ''),
    method: init.method,
    body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    authorization: headers.get('Authorization'),
    idempotencyKey: headers.get('Idempotency-Key'),
  }
}

const quoteRequest = {
  addressId: 'addr_juan_home',
  contact: { fullName: 'Juan Dela Cruz', mobileNumber: '+639171234567', email: 'juan@example.com' },
  paymentMethod: 'CASH_ON_DELIVERY' as const,
  cartVersion: 2,
}

describe('cart api', () => {
  it.each([
    ['getCartApi', () => getCartApi('access_1'), envelope(cart), '/cart', 'GET', undefined],
    [
      'updateCartItemApi',
      () => updateCartItemApi('cart_item_1', { quantity: 2 }, 'access_1'),
      envelope(cart),
      '/cart/items/cart_item_1',
      'PATCH',
      { quantity: 2 },
    ],
    [
      'removeCartItemApi',
      () => removeCartItemApi('cart_item_1', 'access_1'),
      envelope(cart),
      '/cart/items/cart_item_1',
      'DELETE',
      undefined,
    ],
    [
      'listDeliveryAddressesApi',
      () => listDeliveryAddressesApi('access_1'),
      page([address]),
      '/users/me/addresses?limit=100',
      'GET',
      undefined,
    ],
    [
      'listPaymentOptionsApi',
      () => listPaymentOptionsApi('access_1'),
      page(paymentOptions),
      '/checkout/payment-options?limit=100',
      'GET',
      undefined,
    ],
    [
      'createCheckoutQuoteApi',
      () => createCheckoutQuoteApi(quoteRequest, 'access_1'),
      envelope(quote),
      '/checkout/quote',
      'POST',
      quoteRequest,
    ],
  ])(
    '%s calls its contract path with the token',
    async (_name, call, payload, url, method, body) => {
      const fetchMock = respondWith(payload)

      await call()

      expect(sent(fetchMock)).toEqual({
        url,
        method,
        body,
        authorization: 'Bearer access_1',
        idempotencyKey: null,
      })
    },
  )

  it('places an order against a quote with the idempotency key it was given', async () => {
    const fetchMock = respondWith(envelope({ ...orderDetail, orderNumber: 'GBY-10246' }), 201)

    const result = await createOrderApi(
      { quoteId: 'quote_1', acceptedTotal: quote.total },
      'key_1',
      'access_1',
    )

    expect(result.data.orderNumber).toBe('GBY-10246')
    expect(sent(fetchMock)).toEqual({
      url: '/orders',
      method: 'POST',
      body: { quoteId: 'quote_1', acceptedTotal: { amountMinor: 144900, currency: 'PHP' } },
      authorization: 'Bearer access_1',
      idempotencyKey: 'key_1',
    })
  })
})
