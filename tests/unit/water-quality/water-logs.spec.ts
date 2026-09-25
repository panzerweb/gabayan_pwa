import { apiBaseUrl } from '@core/http'
import { QUERY_KEY_PREFIXES } from '@core/query'
import {
  createWaterParameterLogApi,
  listWaterParameterLogsApi,
} from '@pages/water-quality/data/water-quality.api'
import { waterQualityKeys } from '@pages/water-quality/data/water-quality.keys'
import {
  emptyReadingsForm,
  outOfRangeSummary,
  parseWaterLogForm,
  waterParameterLogSchema,
  waterTrendPoints,
  type WaterParameterLog,
} from '@pages/water-quality/domain/water-quality.model'

import { envelope, page } from '../marketplace/fixtures'
import { seededLogs } from './log-fixtures'

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
  expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  return { path: String(url).replace(apiBaseUrl, ''), init }
}

describe('water-parameter logs api', () => {
  it("reads one page of a cultivation's logs for the history and trend", async () => {
    const fetchMock = respondWith(page(seededLogs))

    const result = await listWaterParameterLogsApi('cul_tilapia_001', 'access_1')

    expect(result.data.map((log) => log.id)).toEqual([
      'wlog_tilapia_003',
      'wlog_tilapia_002',
      'wlog_tilapia_001',
    ])
    const { path, init } = sent(fetchMock)
    expect(init.method).toBe('GET')
    expect(path).toBe('/cultivations/cul_tilapia_001/water-parameter-logs?limit=50')
  })

  it('posts a reading with the Idempotency-Key of its submission', async () => {
    const fetchMock = respondWith(envelope(seededLogs[0]), 201)
    const body = { readings: { ph: 7.6, dissolvedOxygenMgL: 2.6 }, notes: null }

    const result = await createWaterParameterLogApi('cul_tilapia_001', body, 'key_1', 'access_1')

    expect(result.data.outOfRangeCount).toBe(1)
    const { path, init } = sent(fetchMock)
    expect(init.method).toBe('POST')
    expect(path).toBe('/cultivations/cul_tilapia_001/water-parameter-logs')
    expect(JSON.parse(String(init.body))).toEqual(body)
    expect(new Headers(init.headers).get('Idempotency-Key')).toBe('key_1')
  })

  it('keys the logs per cultivation under the prefix a saved log invalidates', () => {
    const key = waterQualityKeys.logs('cul_tilapia_001')

    expect(key).toEqual(['water-quality', 'logs', 'cul_tilapia_001'])
    expect(key.slice(0, 2)).toEqual([...QUERY_KEY_PREFIXES.waterLogs])
  })

  it('refuses a log whose results and reading fields do not match the contract', () => {
    const [latest] = seededLogs
    expect(waterParameterLogSchema.safeParse(latest).success).toBe(true)

    const sixReadings: Partial<WaterParameterLog['readings']> = { ...latest!.readings }
    delete sixReadings.temperatureC
    expect(waterParameterLogSchema.safeParse({ ...latest, readings: sixReadings }).success).toBe(
      false,
    )
  })
})

describe('water log form', () => {
  it('builds the request from the entered readings and trimmed notes', () => {
    const form = { ...emptyReadingsForm(), PH: '7.2', AMMONIA: '0.8' }

    expect(parseWaterLogForm(form, '  After the rain. ')).toEqual({
      body: { readings: { ph: 7.2, ammoniaMgL: 0.8 }, notes: 'After the rain.' },
      fieldErrors: {},
    })
    expect(parseWaterLogForm(form, '   ').body?.notes).toBeNull()
  })

  it('asks for at least one reading to save and keeps notes within 500 characters', () => {
    const { body, fieldErrors } = parseWaterLogForm(emptyReadingsForm(), 'x'.repeat(501))

    expect(body).toBeNull()
    expect(fieldErrors).toEqual({
      readings: 'Enter at least one reading to save.',
      notes: 'Keep the notes to 500 characters or fewer.',
    })
  })

  it('names an out-of-scale reading beside its field', () => {
    const { fieldErrors } = parseWaterLogForm({ ...emptyReadingsForm(), PH: '15' }, '')

    expect(fieldErrors).toEqual({ 'readings.ph': 'Enter a number from 0 to 14.' })
  })
})

describe('water log trend', () => {
  it("lists one parameter's saved readings oldest first with the status each was saved with", () => {
    expect(waterTrendPoints(seededLogs, 'AMMONIA')).toEqual([
      expect.objectContaining({ logId: 'wlog_tilapia_001', value: 0.2, status: 'WITHIN_RANGE' }),
      expect.objectContaining({ logId: 'wlog_tilapia_002', value: 0.8, status: 'ABOVE_RANGE' }),
      expect.objectContaining({ logId: 'wlog_tilapia_003', value: 0.4, status: 'WITHIN_RANGE' }),
    ])
  })

  it('leaves out the logs that did not measure the parameter', () => {
    expect(waterTrendPoints(seededLogs, 'NITRATE').map((point) => point.logId)).toEqual([
      'wlog_tilapia_001',
      'wlog_tilapia_003',
    ])
  })

  it('sums up a log by its readings out of range', () => {
    expect(outOfRangeSummary(0)).toBe('All readings within range')
    expect(outOfRangeSummary(1)).toBe('1 reading out of range')
    expect(outOfRangeSummary(3)).toBe('3 readings out of range')
  })
})
