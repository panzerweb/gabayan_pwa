import { apiBaseUrl } from '@core/http'
import {
  createWaterSafetyCheckApi,
  getWaterThresholdsApi,
} from '@pages/water-quality/data/water-quality.api'
import { waterQualityKeys } from '@pages/water-quality/data/water-quality.keys'

import { envelope } from '../marketplace/fixtures'
import { highAmmoniaCheck, tilapiaPondThresholds } from './fixtures'

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

function sent(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  return { path: String(url).replace(apiBaseUrl, ''), init }
}

describe('water-quality api', () => {
  it('reads the ranges of one species in one culture system', async () => {
    const fetchMock = respondWith(envelope(tilapiaPondThresholds))

    const result = await getWaterThresholdsApi('sp_tilapia', 'env_pond', 'access_1')

    expect(result.data.thresholds[2]?.parameter).toBe('AMMONIA')
    const { path, init } = sent(fetchMock)
    expect(init.method).toBe('GET')
    expect(path).toBe('/water-thresholds?speciesId=sp_tilapia&environmentId=env_pond')
  })

  it('posts a safety check without an idempotency key, since nothing is stored', async () => {
    const fetchMock = respondWith(envelope(highAmmoniaCheck))
    const body = {
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      readings: { ammoniaMgL: 1.2 },
    }

    const result = await createWaterSafetyCheckApi(body, 'access_1')

    expect(result.data.notChecked).toHaveLength(5)
    const { path, init } = sent(fetchMock)
    expect(init.method).toBe('POST')
    expect(path).toBe('/water-safety-checks')
    expect(JSON.parse(String(init.body))).toEqual(body)
    expect(new Headers(init.headers).has('Idempotency-Key')).toBe(false)
  })

  it('keys the ranges by species and culture system under the feature prefix', () => {
    expect(waterQualityKeys.thresholds('sp_tilapia', 'env_pond')).toEqual([
      'water-quality',
      'thresholds',
      'sp_tilapia',
      'env_pond',
    ])
  })
})
