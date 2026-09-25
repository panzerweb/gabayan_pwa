import { apiBaseUrl } from '@core/http'
import { getHealthApi } from '@pages/public/data/public.api'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const health = {
  status: 'ok',
  service: 'gabayan-api',
  version: '1.0.0',
  timestamp: '2026-09-23T00:00:00Z',
}

describe('getHealthApi', () => {
  it('reads the health check from the system endpoint without a token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: health, meta: { requestId: 'req_1' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getHealthApi()

    expect(result.data).toEqual(health)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${apiBaseUrl}/health`)
    expect(init.method).toBe('GET')
    expect(new Headers(init.headers).has('Authorization')).toBe(false)
  })

  it('refuses a health answer outside the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ data: { ...health, status: 'down' }, meta: { requestId: 'req_2' } }),
        ),
    )

    await expect(getHealthApi()).rejects.toThrow()
  })
})
