import { apiBaseUrl } from '@core/http'
import { getFeedGuideApi } from '@pages/feeds/data/feeds.api'
import { feedsKeys } from '@pages/feeds/data/feeds.keys'

import { envelope } from '../marketplace/fixtures'
import { tilapiaFeedGuide } from './fixtures'

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

describe('feeds api', () => {
  it('reads one species’ feed guide with the access token', async () => {
    const fetchMock = respondWith(envelope(tilapiaFeedGuide))

    const result = await getFeedGuideApi('sp_tilapia', 'access_1')

    expect(result.data.stages.map((stage) => stage.growthStageCode)).toEqual([
      'GROWING',
      'PRE_HARVEST',
    ])
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(String(url).replace(apiBaseUrl, '')).toBe('/species/sp_tilapia/feed-guide')
    expect(init.method).toBe('GET')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  })

  it('fails the schema when a stage loses its provenance', async () => {
    const [stage] = tilapiaFeedGuide.stages
    respondWith(envelope({ ...tilapiaFeedGuide, stages: [{ ...stage, basis: undefined }] }))

    await expect(getFeedGuideApi('sp_tilapia', 'access_1')).rejects.toThrow()
  })

  it('keys every guide under the feeds prefix, one per species', () => {
    expect(feedsKeys.guide('sp_tilapia')).toEqual(['feeds', 'guide', 'sp_tilapia'])
    expect(feedsKeys.guide('sp_tilapia').slice(0, 1)).toEqual(feedsKeys.all())
  })
})
