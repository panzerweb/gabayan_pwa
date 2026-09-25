import { apiBaseUrl } from '@core/http'
import { INVALIDATIONS, QUERY_KEY_PREFIXES } from '@core/query'
import { getFeedConversionApi } from '@pages/cultivations/data/cultivations.api'
import { cultivationsKeys } from '@pages/cultivations/data/cultivations.keys'
import {
  feedConversionLine,
  feedConversionSchema,
} from '@pages/cultivations/domain/cultivations.model'

import { envelope } from '../marketplace/fixtures'
import { batch001Conversion, oneSampleConversion } from './feed-conversion-fixtures'

describe('feed conversion', () => {
  it("reads the ratio the server derives for one cultivation's records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(envelope(batch001Conversion)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getFeedConversionApi('cul_tilapia_001', 'access_1')

    expect(result.data.ratio).toBe(1.37)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(String(url).replace(apiBaseUrl, '')).toBe(
      '/cultivations/cul_tilapia_001/feed-conversion',
    )
    expect(init.method).toBe('GET')
  })

  it('reads a result without a ratio when the records cannot carry one', () => {
    expect(feedConversionSchema.parse(oneSampleConversion)).toMatchObject({
      status: 'INSUFFICIENT_DATA',
      ratio: null,
      intervals: [],
    })
    expect(
      feedConversionSchema.safeParse({ ...batch001Conversion, status: 'ESTIMATED' }).success,
    ).toBe(false)
  })

  it('is refreshed by every write of a record it is derived from', () => {
    const key = cultivationsKeys.feedConversion('cul_tilapia_001')
    expect(key.slice(0, 2)).toEqual([...QUERY_KEY_PREFIXES.feedConversion])

    for (const mutation of ['taskComplete', 'growthCreate', 'mortalityCreate', 'feedingCreate']) {
      expect(INVALIDATIONS[mutation as keyof typeof INVALIDATIONS]).toContainEqual(
        QUERY_KEY_PREFIXES.feedConversion,
      )
    }
  })

  it('reads the ratio out with its units', () => {
    expect(feedConversionLine(1.37)).toBe('1.37 kg of feed for each kg gained')
    expect(feedConversionLine(2)).toBe('2 kg of feed for each kg gained')
  })
})
