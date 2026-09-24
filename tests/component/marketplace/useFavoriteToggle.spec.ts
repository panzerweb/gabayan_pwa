import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

import type { Envelope } from '@core/http'
import { marketplaceKeys } from '@pages/marketplace/data/marketplace.keys'
import type { ProductDetail } from '@pages/marketplace/domain/marketplace.model'
import type { MarketplaceRepository } from '@pages/marketplace/domain/marketplace.repository.interface'
import { useFavoriteToggle } from '@pages/marketplace/presentation/composables/useFavoriteToggle'
import { ROUTE_NAMES } from '@router/route-names'

import { aeratorDetail, envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountComposable } from '../support/app'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function mountToggle(repository: Partial<MarketplaceRepository>) {
  const mounted = await mountComposable(
    () => useFavoriteToggle(ref('prd_pond_aerator'), repository as MarketplaceRepository),
    { name: ROUTE_NAMES.productDetail, params: { productId: 'prd_pond_aerator' } },
  )
  mounted.queryClient.setQueryData(
    marketplaceKeys.product('prd_pond_aerator'),
    envelope(aeratorDetail),
  )
  const cached = () =>
    mounted.queryClient.getQueryData<Envelope<ProductDetail>>(
      marketplaceKeys.product('prd_pond_aerator'),
    )?.data.isFavorite
  return { ...mounted, cached }
}

describe('useFavoriteToggle', () => {
  it('fills the heart before the server answers', async () => {
    const answer = deferred<Envelope<{ productId: string; isFavorite: boolean }>>()
    const favoriteProduct = vi.fn().mockReturnValue(answer.promise)
    const { result, cached, queryClient } = await mountToggle({ favoriteProduct })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    result.toggle(false)
    await flushPromises()

    expect(favoriteProduct).toHaveBeenCalledWith('prd_pond_aerator', 'access_1')
    expect(cached()).toBe(true)
    expect(result.pending.value).toBe(true)

    answer.resolve(envelope({ productId: 'prd_pond_aerator', isFavorite: true }))
    await flushPromises()

    expect(cached()).toBe(true)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['marketplace', 'products'] })
  })

  it('puts the heart back and says so when the server refuses', async () => {
    const unfavoriteProduct = vi
      .fn()
      .mockRejectedValue(apiError(404, 'NOT_FOUND', 'This product is no longer listed.'))
    const { result, cached, queryClient, toast } = await mountToggle({ unfavoriteProduct })
    queryClient.setQueryData(marketplaceKeys.product('prd_pond_aerator'), {
      ...envelope({ ...aeratorDetail, isFavorite: true }),
    })

    result.toggle(true)
    await flushPromises()

    expect(unfavoriteProduct).toHaveBeenCalledWith('prd_pond_aerator', 'access_1')
    expect(cached()).toBe(true)
    expect(toast.messages.at(-1)?.message).toBe('Could not update this favorite.')
  })
})
