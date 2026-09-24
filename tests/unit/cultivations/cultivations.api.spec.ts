import { apiBaseUrl } from '@core/http'
import {
  completeTaskApi,
  getCultivationApi,
  getCultivationTimelineApi,
  listCultivationsApi,
  listTasksApi,
} from '@pages/cultivations/data/cultivations.api'

import { envelope, page } from '../marketplace/fixtures'
import { afternoonFeeding, batch001, batch001Detail, feedingCompletion, timeline } from './fixtures'

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
