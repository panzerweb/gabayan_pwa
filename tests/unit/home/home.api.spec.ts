import { ZodError } from 'zod'

import { apiBaseUrl } from '@core/http'
import { QUERY_KEY_PREFIXES } from '@core/query'
import { getHomeDashboardApi } from '@pages/home/data/home.api'
import { homeKeys } from '@pages/home/data/home.keys'

import { envelope } from '../marketplace/fixtures'
import { dashboard } from './fixtures'

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

describe('home api', () => {
  it('asks for the dashboard of the given day with the access token', async () => {
    const fetchMock = respondWith(envelope(dashboard))

    const result = await getHomeDashboardApi('2026-09-23', 'access_1')

    expect(result.data.primaryCultivation?.name).toBe('Tilapia Batch #001')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(String(url).replace(apiBaseUrl, '')).toBe('/dashboard/home?date=2026-09-23')
    expect(init.method).toBe('GET')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  })

  it('refuses a tip that arrives without its disclaimer', async () => {
    const { disclaimer: _dropped, ...tipWithoutDisclaimer } = dashboard.tip
    void _dropped
    respondWith(envelope({ ...dashboard, tip: tipWithoutDisclaimer }))

    await expect(getHomeDashboardApi('2026-09-23', 'access_1')).rejects.toBeInstanceOf(ZodError)
  })
})

describe('home keys', () => {
  it('keeps the dashboard under the home prefix that cultivation and order writes invalidate', () => {
    const key = homeKeys.dashboard('2026-09-23')

    expect(key.slice(0, QUERY_KEY_PREFIXES.home.length)).toEqual([...QUERY_KEY_PREFIXES.home])
    expect(key).toEqual(['home', 'dashboard', '2026-09-23'])
  })
})
