import { flushPromises } from '@vue/test-utils'

import type { CartRepository } from '@pages/cart/domain/cart.repository.interface'
import { useCheckout } from '@pages/cart/presentation/composables/useCheckout'
import { ROUTE_NAMES } from '@router/route-names'

import { address, cart, paymentOptions, quote } from '../../unit/cart/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { orderDetail } from '../../unit/orders/fixtures'
import { apiError, mountComposable } from '../support/app'

const placedOrder = { ...orderDetail, id: 'ord_10246', orderNumber: 'GBY-10246' }

function stubRepository() {
  return {
    getCart: vi.fn().mockResolvedValue(envelope(cart)),
    listDeliveryAddresses: vi.fn().mockResolvedValue(page([address])),
    listPaymentOptions: vi.fn().mockResolvedValue(page(paymentOptions)),
    createCheckoutQuote: vi.fn().mockResolvedValue(envelope(quote)),
    createOrder: vi.fn().mockResolvedValue(envelope(placedOrder)),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
  }
}

async function mountCheckout(repository: ReturnType<typeof stubRepository>) {
  const mounted = await mountComposable(
    () => useCheckout(repository as unknown as CartRepository),
    { name: ROUTE_NAMES.checkout },
  )
  await flushPromises()
  return mounted
}

function keysSent(createOrder: ReturnType<typeof vi.fn>) {
  return createOrder.mock.calls.map((call) => call[1] as string)
}

describe('useCheckout', () => {
  it('quotes the default address and places the order against that quote', async () => {
    const repository = stubRepository()
    const { result, router, queryClient } = await mountCheckout(repository)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.requestQuote()
    await result.placeOrder()
    await flushPromises()

    expect(repository.createCheckoutQuote).toHaveBeenCalledWith(
      {
        addressId: 'addr_juan_home',
        contact: {
          fullName: 'Juan Dela Cruz',
          mobileNumber: '+639171234567',
          email: 'juan@example.com',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
        cartVersion: 2,
      },
      'access_1',
    )
    expect(repository.createOrder).toHaveBeenCalledWith(
      { quoteId: 'quote_1', acceptedTotal: { amountMinor: 144900, currency: 'PHP' } },
      expect.any(String),
      'access_1',
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart'] })
    expect(router.currentRoute.value).toMatchObject({
      name: ROUTE_NAMES.orderDetail,
      params: { orderId: 'ord_10246' },
      query: { placed: '1' },
    })
  })

  it('reuses one Idempotency-Key when the same submission is retried', async () => {
    const repository = stubRepository()
    repository.createOrder
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(envelope(placedOrder))
    const { result, router } = await mountCheckout(repository)

    await result.requestQuote()
    await result.placeOrder()
    expect(result.formError.value).toBe(
      'We could not reach Gabayan. Check your connection, then try again.',
    )
    expect(result.quote.value?.quoteId).toBe('quote_1')

    await result.placeOrder()
    await flushPromises()

    const [first, second] = keysSent(repository.createOrder)
    expect(first).toMatch(/\S{8,}/)
    expect(second).toBe(first)
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.orderDetail)
  })

  it('starts a new key for a new quote after the total was reviewed again', async () => {
    const repository = stubRepository()
    repository.createOrder.mockRejectedValue(new TypeError('Failed to fetch'))
    repository.createCheckoutQuote
      .mockResolvedValueOnce(envelope(quote))
      .mockResolvedValueOnce(envelope({ ...quote, quoteId: 'quote_2' }))
    const { result } = await mountCheckout(repository)

    await result.requestQuote()
    await result.placeOrder()
    result.contact.value.mobileNumber = '09171234568'
    await flushPromises()
    expect(result.quote.value).toBeNull()

    await result.requestQuote()
    await result.placeOrder()

    const [first, second] = keysSent(repository.createOrder)
    expect(repository.createOrder.mock.calls[1]?.[0]).toMatchObject({ quoteId: 'quote_2' })
    expect(second).not.toBe(first)
  })

  it('drops a quote the server no longer honours and asks for a fresh total', async () => {
    const repository = stubRepository()
    repository.createOrder.mockRejectedValue(
      apiError(409, 'CONFLICT', 'This quote has expired. Request a new quote.'),
    )
    const { result } = await mountCheckout(repository)

    await result.requestQuote()
    await result.placeOrder()

    expect(result.quote.value).toBeNull()
    expect(result.formError.value).toBe(
      'Prices or your cart changed since the total was prepared. Review it again.',
    )
  })

  it('places nothing while offline and says orders are not queued', async () => {
    const repository = stubRepository()
    const { result } = await mountCheckout(repository)
    await result.requestQuote()
    // Set on the composable rather than through a window event, which would also take
    // TanStack Query's shared online manager offline for the tests after this one.
    result.isOnline.value = false

    await result.placeOrder()

    expect(repository.createOrder).not.toHaveBeenCalled()
    expect(result.formError.value).toBe(
      'Reconnect before placing the order. Orders are not queued offline.',
    )
  })

  it('checks the contact details before asking for a quote and binds refused fields', async () => {
    const repository = stubRepository()
    const { result } = await mountCheckout(repository)
    result.contact.value.email = ''

    await result.requestQuote()

    expect(repository.createCheckoutQuote).not.toHaveBeenCalled()
    expect(result.fieldErrors.value).toEqual({
      email: 'Enter an email address for the order receipt.',
    })

    repository.createCheckoutQuote.mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Check the details.', {
        'contact.mobileNumber': ['Enter a Philippine mobile number.'],
      }),
    )
    result.contact.value.email = 'juan@example.com'
    await result.requestQuote()

    expect(result.fieldErrors.value).toEqual({ mobileNumber: 'Enter a Philippine mobile number.' })
  })
})
