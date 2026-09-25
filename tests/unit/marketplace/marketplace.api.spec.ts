import { apiBaseUrl } from '@core/http'
import {
  addCartItemApi,
  favoriteProductApi,
  getProductApi,
  listProductCategoriesApi,
  listProductsApi,
  unfavoriteProductApi,
} from '@pages/marketplace/data/marketplace.api'

import { cart } from '../cart/fixtures'
import { aeration, aerator, aeratorDetail, envelope, page } from './fixtures'

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
  return {
    url: String(url).replace(apiBaseUrl, ''),
    method: init.method,
    body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    authorization: new Headers(init.headers).get('Authorization'),
  }
}

describe('marketplace api', () => {
  it('reads the categories without a token', async () => {
    const fetchMock = respondWith(page([aeration]))

    const result = await listProductCategoriesApi()

    expect(result.data).toEqual([aeration])
    expect(sent(fetchMock)).toMatchObject({
      url: '/product-categories?limit=100',
      method: 'GET',
      authorization: null,
    })
  })

  it('sends only the filters that are set, under their contract names', async () => {
    const fetchMock = respondWith(page([aerator]))

    await listProductsApi(
      { categoryId: 'cat_aeration', suitableSpeciesId: 'sp_tilapia', sort: 'price', order: 'asc' },
      'access_1',
    )

    const request = sent(fetchMock)
    expect(request.url).toBe(
      '/products?limit=100&categoryId=cat_aeration&suitableSpeciesId=sp_tilapia&sort=price&order=asc',
    )
    expect(request.authorization).toBe('Bearer access_1')
  })

  it('reads one product by its id', async () => {
    const fetchMock = respondWith(envelope(aeratorDetail))

    const result = await getProductApi('prd_pond_aerator', 'access_1')

    expect(result.data.recommendation?.cultivationId).toBe('cul_tilapia_001')
    expect(sent(fetchMock)).toMatchObject({ url: '/products/prd_pond_aerator', method: 'GET' })
  })

  it.each([
    ['favoriteProductApi', favoriteProductApi, 'PUT', true],
    ['unfavoriteProductApi', unfavoriteProductApi, 'DELETE', false],
  ] as const)('%s sends %s to the favorite path', async (_name, call, method, isFavorite) => {
    const fetchMock = respondWith(envelope({ productId: 'prd_pond_aerator', isFavorite }))

    const result = await call('prd_pond_aerator', 'access_1')

    expect(result.data.isFavorite).toBe(isFavorite)
    expect(sent(fetchMock)).toMatchObject({ url: '/products/prd_pond_aerator/favorite', method })
  })

  it('adds a product to the cart and answers the priced cart', async () => {
    const fetchMock = respondWith(envelope(cart), 201)

    const result = await addCartItemApi({ productId: 'prd_pond_aerator', quantity: 2 }, 'access_1')

    expect(result.data.estimatedTotal.amountMinor).toBe(144900)
    expect(sent(fetchMock)).toMatchObject({
      url: '/cart/items',
      method: 'POST',
      body: { productId: 'prd_pond_aerator', quantity: 2 },
    })
  })
})
