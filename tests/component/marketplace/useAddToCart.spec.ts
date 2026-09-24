import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

import { cartKeys } from '@pages/cart/data/cart.keys'
import type { MarketplaceRepository } from '@pages/marketplace/domain/marketplace.repository.interface'
import { useAddToCart } from '@pages/marketplace/presentation/composables/useAddToCart'
import { ROUTE_NAMES } from '@router/route-names'

import { cart } from '../../unit/cart/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, goOffline, mountComposable } from '../support/app'

async function mountAddToCart(addCartItem: ReturnType<typeof vi.fn>) {
  return mountComposable(
    () =>
      useAddToCart(ref('prd_pond_aerator'), { addCartItem } as unknown as MarketplaceRepository),
    { name: ROUTE_NAMES.productDetail, params: { productId: 'prd_pond_aerator' } },
  )
}

describe('useAddToCart', () => {
  it('adds the chosen quantity and refreshes every cart query through the invalidation map', async () => {
    const addCartItem = vi.fn().mockResolvedValue(envelope(cart))
    const { result, queryClient, toast } = await mountAddToCart(addCartItem)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    result.quantity.value = 2

    await result.add()
    await flushPromises()

    expect(addCartItem).toHaveBeenCalledWith(
      { productId: 'prd_pond_aerator', quantity: 2 },
      'access_1',
    )
    expect(queryClient.getQueryData(cartKeys.detail())).toEqual(envelope(cart))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart'] })
    expect(toast.messages.at(-1)).toMatchObject({ message: 'Added to cart.', tone: 'success' })
  })

  it('shows the server sentence when the stock cannot cover the quantity', async () => {
    const addCartItem = vi
      .fn()
      .mockRejectedValue(apiError(409, 'CONFLICT', 'Only 4 of this product fit in one order.'))
    const { result, toast } = await mountAddToCart(addCartItem)

    await result.add()

    expect(toast.messages.at(-1)).toMatchObject({
      message: 'Only 4 of this product fit in one order.',
      tone: 'danger',
    })
  })

  it('sends nothing while offline', async () => {
    goOffline()
    const addCartItem = vi.fn()
    const { result, toast } = await mountAddToCart(addCartItem)

    await result.add()

    expect(addCartItem).not.toHaveBeenCalled()
    expect(toast.messages.at(-1)?.message).toBe(
      'Reconnect before adding items. Cart changes are not queued offline.',
    )
  })
})
