import { apiBaseUrl } from '@core/http'
import {
  completeHarvestApi,
  completeTaskApi,
  createGrowthMeasurementApi,
  createMortalityRecordApi,
  createWaterCheckApi,
  getCultivationApi,
  getCultivationTimelineApi,
  getFeedingPlanApi,
  getHarvestReadinessApi,
  listCultivationsApi,
  listFeedingRecordsApi,
  listGrowthMeasurementsApi,
  listMortalityRecordsApi,
  listTasksApi,
  listWaterChecksApi,
} from '@pages/cultivations/data/cultivations.api'

import { envelope, page } from '../marketplace/fixtures'
import {
  afternoonFeeding,
  batch001,
  batch001Detail,
  calmWaterCheck,
  feedingCompletion,
  feedingPlan,
  feedingRecord,
  growthResult,
  growthSamples,
  harvestCompletion,
  mortalityRecord,
  mortalityResult,
  readyReadiness,
  timeline,
  waterCheckResult,
} from './fixtures'

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
  const headers = new Headers(init.headers)
  expect(headers.get('Authorization')).toBe('Bearer access_1')
  return { url: String(url).replace(apiBaseUrl, ''), method: init.method, headers, init }
}

describe('cultivations api', () => {
  it('lists cultivations in one page of 100 unless a smaller page is asked for', async () => {
    const listFetch = respondWith(page([batch001]))
    expect((await listCultivationsApi('access_1')).data[0]?.name).toBe('Tilapia Batch #001')
    expect(sent(listFetch).url).toBe('/cultivations?limit=100')

    const countFetch = respondWith(page([batch001]))
    await listCultivationsApi('access_1', 1)
    expect(sent(countFetch).url).toBe('/cultivations?limit=1')
  })

  it('reads a cultivation and its timeline by id', async () => {
    const detailFetch = respondWith(envelope(batch001Detail))
    const detail = await getCultivationApi('cul_tilapia_001', 'access_1')
    expect(detail.data.harvestSummary.readinessStatus).toBe('MONITOR')
    expect(sent(detailFetch)).toMatchObject({ url: '/cultivations/cul_tilapia_001', method: 'GET' })

    const timelineFetch = respondWith(envelope(timeline))
    const events = await getCultivationTimelineApi('cul_tilapia_001', 'access_1')
    expect(events.data.events).toHaveLength(3)
    expect(sent(timelineFetch).url).toBe('/cultivations/cul_tilapia_001/timeline')
  })

  it('lists one cultivation’s tasks with only the filters given', async () => {
    const fetchMock = respondWith(page([afternoonFeeding]))

    await listTasksApi({ cultivationId: 'cul_tilapia_001' }, 'access_1')

    expect(sent(fetchMock).url).toBe('/tasks?limit=100&cultivationId=cul_tilapia_001')
  })

  it('completes a task with its Idempotency-Key and the completion body', async () => {
    const fetchMock = respondWith(envelope(feedingCompletion))
    const body = {
      completedAt: '2026-09-23T08:05:00Z',
      actualAmount: { value: 1.1, unit: 'KG' as const },
      notes: 'Fish responded normally.',
    }

    const result = await completeTaskApi('task_feed_pm', body, 'key_1', 'access_1')

    expect(result.data.linkedRecord?.id).toBe('feed_00002')
    const request = sent(fetchMock)
    expect(request).toMatchObject({ url: '/tasks/task_feed_pm/complete', method: 'POST' })
    expect(request.headers.get('Idempotency-Key')).toBe('key_1')
    expect(JSON.parse(String(request.init.body))).toEqual(body)
  })

  it('refuses a cultivation detail that arrives without its harvest summary', async () => {
    respondWith(envelope({ ...batch001Detail, harvestSummary: undefined }))

    await expect(getCultivationApi('cul_tilapia_001', 'access_1')).rejects.toThrow()
  })
})

describe('cultivation records api', () => {
  it.each([
    ['growth measurements', listGrowthMeasurementsApi, growthSamples, 'growth-measurements'],
    ['mortality records', listMortalityRecordsApi, [mortalityRecord], 'mortality-records'],
    ['feeding records', listFeedingRecordsApi, [feedingRecord], 'feeding-records'],
    ['water checks', listWaterChecksApi, [calmWaterCheck], 'water-checks'],
  ] as const)('lists a cultivation’s %s in one page of 100', async (_, list, items, path) => {
    const fetchMock = respondWith(page([...items]))

    const result = await list('cul_tilapia_001', 'access_1')

    expect(result.data).toHaveLength(items.length)
    expect(sent(fetchMock)).toMatchObject({
      url: `/cultivations/cul_tilapia_001/${path}?limit=100`,
      method: 'GET',
    })
  })

  it('reads the feeding plan for the day asked for, or the server’s today', async () => {
    const datedFetch = respondWith(envelope(feedingPlan))
    const plan = await getFeedingPlanApi('cul_tilapia_001', 'access_1', '2026-09-23')
    expect(plan.data.isDemo).toBe(true)
    expect(sent(datedFetch).url).toBe('/cultivations/cul_tilapia_001/feeding-plan?date=2026-09-23')

    const todayFetch = respondWith(envelope(feedingPlan))
    await getFeedingPlanApi('cul_tilapia_001', 'access_1')
    expect(sent(todayFetch).url).toBe('/cultivations/cul_tilapia_001/feeding-plan')
  })

  it('reads harvest readiness with its provenance', async () => {
    const fetchMock = respondWith(envelope(readyReadiness))

    const readiness = await getHarvestReadinessApi('cul_tilapia_harvest', 'access_1')

    expect(readiness.data).toMatchObject({
      status: 'POTENTIALLY_READY',
      ruleVersion: 'demo-2026-09',
    })
    expect(sent(fetchMock).url).toBe('/cultivations/cul_tilapia_harvest/harvest-readiness')
  })

  it.each([
    [
      'a growth measurement',
      createGrowthMeasurementApi,
      growthResult,
      'growth-measurements',
      {
        measuredOn: '2026-09-23',
        numberOfFishSampled: 12,
        averageWeight: { value: 200, unit: 'G' as const },
        notes: null,
      },
    ],
    [
      'a mortality record',
      createMortalityRecordApi,
      mortalityResult,
      'mortality-records',
      { occurredOn: '2026-09-23', fishCount: 5, reason: 'UNKNOWN' as const, notes: null },
    ],
    [
      'a water check',
      createWaterCheckApi,
      waterCheckResult,
      'water-checks',
      {
        checkedAt: '2026-09-23T00:00:00.000Z',
        observation: { clarity: 'Cloudier than usual', unusualChanges: true },
      },
    ],
    [
      'a harvest',
      completeHarvestApi,
      harvestCompletion,
      'harvest',
      {
        harvestDate: '2026-09-23',
        numberHarvested: 470,
        totalHarvestWeight: { value: 169.2, unit: 'KG' as const },
        averageFishWeight: { value: 360, unit: 'G' as const },
        sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' as const },
        notes: null,
      },
    ],
  ])('records %s with its Idempotency-Key and body', async (_, create, result, path, body) => {
    const fetchMock = respondWith(envelope(result))

    // Each create function takes its own request type; the rows pair them correctly.
    await (create as (...args: unknown[]) => Promise<unknown>)(
      'cul_tilapia_001',
      body,
      'key_1',
      'access_1',
    )

    const request = sent(fetchMock)
    expect(request).toMatchObject({ url: `/cultivations/cul_tilapia_001/${path}`, method: 'POST' })
    expect(request.headers.get('Idempotency-Key')).toBe('key_1')
    expect(JSON.parse(String(request.init.body))).toEqual(body)
  })

  it('refuses a readiness answer that drops its disclaimer', async () => {
    respondWith(envelope({ ...readyReadiness, disclaimer: undefined }))

    await expect(getHarvestReadinessApi('cul_tilapia_harvest', 'access_1')).rejects.toThrow()
  })
})
