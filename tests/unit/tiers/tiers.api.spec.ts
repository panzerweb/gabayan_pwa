import { ApiError, apiBaseUrl } from '@core/http'
import {
  createUpgradeRequestApi,
  getAccountTierApi,
  listPlansApi,
} from '@pages/tiers/data/tiers.api'

import { accountTier, meta, pageInfo, plans, proRequest } from './fixtures'

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
    url,
    method: init.method,
    body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    authorization: new Headers(init.headers).get('Authorization'),
  }
}

describe('tiers api', () => {
  it('lists the plans with the access token', async () => {
    const fetchMock = respondWith({ data: plans, page: pageInfo, meta })

    const response = await listPlansApi('access_1')

    expect(sent(fetchMock)).toMatchObject({
      url: `${apiBaseUrl}/tiers`,
      method: 'GET',
      authorization: 'Bearer access_1',
    })
    expect(response.data.map((plan) => plan.code)).toEqual(['FREE', 'PRO', 'ORGANIZATION'])
  })

  it("reads the account's own tier", async () => {
    const fetchMock = respondWith({ data: accountTier(), meta })

    const response = await getAccountTierApi('access_1')

    expect(sent(fetchMock)).toMatchObject({ url: `${apiBaseUrl}/users/me/tier`, method: 'GET' })
    expect(response.data.remainingCultureSystems).toBe(0)
  })

  it('posts an upgrade request and reads back the pending request', async () => {
    const fetchMock = respondWith({ data: proRequest, meta }, 201)

    const response = await createUpgradeRequestApi({ requestedTier: 'PRO' }, 'access_1')

    expect(sent(fetchMock)).toMatchObject({
      url: `${apiBaseUrl}/users/me/tier/upgrade-requests`,
      method: 'POST',
      body: { requestedTier: 'PRO' },
    })
    expect(response.data.status).toBe('PENDING')
  })

  it('passes a refused request on as an ApiError with its details', async () => {
    respondWith(
      {
        error: {
          code: 'CONFLICT',
          message: 'Your plan request is still being reviewed.',
          fields: null,
          details: { pendingRequestId: 'upg_0001', requestedTier: 'PRO' },
          requestId: 'req_2',
        },
      },
      409,
    )

    const failure = await createUpgradeRequestApi({ requestedTier: 'ORGANIZATION' }, 'a').catch(
      (error: unknown) => error,
    )

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ status: 409, code: 'CONFLICT' })
  })
})
