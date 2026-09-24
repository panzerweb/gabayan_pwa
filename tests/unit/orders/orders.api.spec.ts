import { apiBaseUrl } from '@core/http'
import { getOrderApi, getOrderTrackingApi, listOrdersApi } from '@pages/orders/data/orders.api'

import { envelope, page } from '../marketplace/fixtures'
import { orderDetail, shippedOrder, tracking } from './fixtures'

function respondWith(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function sentUrl(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(init.method).toBe('GET')
  expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  return String(url).replace(apiBaseUrl, '')
}

describe('orders api', () => {
  it('lists orders newest first', async () => {
    const fetchMock = respondWith(page([shippedOrder]))

    const result = await listOrdersApi('access_1')

    expect(result.data[0]?.orderNumber).toBe('GBY-10245')
    expect(sentUrl(fetchMock)).toBe('/orders?limit=100&sort=placedAt&order=desc')
  })

  it('reads an order and its tracking by id', async () => {
    const detailFetch = respondWith(envelope(orderDetail))
    expect((await getOrderApi('ord_10245', 'access_1')).data.version).toBe(3)
    expect(sentUrl(detailFetch)).toBe('/orders/ord_10245')

    const trackingFetch = respondWith(envelope(tracking))
    expect((await getOrderTrackingApi('ord_10245', 'access_1')).data.events).toHaveLength(3)
    expect(sentUrl(trackingFetch)).toBe('/orders/ord_10245/tracking')
  })
})
