import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import {
  DEMO_CULTIVATION,
  HARVEST_DEMO_CULTIVATION,
  createCultivation,
  findCultivation,
} from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

const READING_FIELDS = [
  'salinityPpt',
  'ph',
  'ammoniaMgL',
  'nitriteMgL',
  'nitrateMgL',
  'dissolvedOxygenMgL',
  'temperatureC',
]
const PARAMETER_ORDER = [
  'SALINITY',
  'PH',
  'AMMONIA',
  'NITRITE',
  'NITRATE',
  'DISSOLVED_OXYGEN',
  'WATER_TEMPERATURE',
]

function logsPath(cultivationId) {
  return `/cultivations/${cultivationId}/water-parameter-logs`
}

function feedConversionPath(cultivationId) {
  return `/cultivations/${cultivationId}/feed-conversion`
}

// What a reading's status must be against the bounds it was evaluated with.
function expectedStatus({ value, minimum, maximum }) {
  if (minimum !== null && value < minimum) return 'BELOW_RANGE'
  if (maximum !== null && value > maximum) return 'ABOVE_RANGE'
  return 'WITHIN_RANGE'
}

function expectEvaluatedLog(log) {
  expect(log).toMatchObject({
    id: expect.any(String),
    cultivationId: expect.any(String),
    loggedAt: expect.any(String),
    recordedBy: { id: expect.any(String), fullName: expect.any(String) },
    createdAt: expect.any(String),
    isDemo: expect.any(Boolean),
    sourceStatus: expect.any(String),
    ruleVersion: expect.any(String),
    disclaimer: expect.any(String),
  })
  expect(Object.keys(log.readings).sort()).toEqual([...READING_FIELDS].sort())
  const order = [...log.results.map((result) => result.parameter), ...log.notLogged]
  expect([...order].sort()).toEqual([...PARAMETER_ORDER].sort())
  for (const result of log.results) {
    expect(result).toEqual({
      parameter: expect.any(String),
      name: expect.any(String),
      unit: expect.any(String),
      value: expect.any(Number),
      minimum: expect.toBeOneOf([null, expect.any(Number)]),
      maximum: expect.toBeOneOf([null, expect.any(Number)]),
      status: expectedStatus(result),
    })
  }
  expect(log.outOfRangeCount).toBe(
    log.results.filter((result) => result.status !== 'WITHIN_RANGE').length,
  )
}

export function registerProLogsContract(client) {
  describe('Pro water-parameter logs and feed conversion', () => {
    it('refuses a Free account every Pro read and write with the plan it needs', async () => {
      const { accessToken } = await registerAccount(client, 'Free Logger')
      const auth = bearer(accessToken)
      const cultivation = await createCultivation(client, accessToken)

      const refusals = [
        await client.get(logsPath(cultivation.id)).set('Authorization', auth),
        await client
          .post(logsPath(cultivation.id))
          .set('Authorization', auth)
          .set('Idempotency-Key', idempotencyKey('free-log'))
          .send({ readings: { ph: 7.2 } }),
        await client.get(feedConversionPath(cultivation.id)).set('Authorization', auth),
      ]

      for (const response of refusals) {
        const error = expectError(response, 403, 'FORBIDDEN')
        expect(error.fields).toBeNull()
        expect(error.details).toEqual({ requiredTier: 'PRO', currentTier: 'FREE' })
      }
      expectError(await client.get(logsPath(cultivation.id)), 401, 'AUTH_REQUIRED')
      expectError(await client.get(feedConversionPath(cultivation.id)), 401, 'AUTH_REQUIRED')
    })

    it("lists the Pro farmer's saved logs newest first with each value's status", async () => {
      const { accessToken } = await signInAsDemo(client)
      const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)

      const logs = expectPage(
        await client.get(logsPath(cultivation.id)).set('Authorization', bearer(accessToken)),
      )

      expect(logs.length).toBeGreaterThanOrEqual(3)
      const times = logs.map((log) => Date.parse(log.loggedAt))
      expect(times).toEqual([...times].sort((left, right) => right - left))
      logs.forEach(expectEvaluatedLog)
      expect(logs.some((log) => log.outOfRangeCount > 0)).toBe(true)
      if (await client.servesMockFixtures()) {
        const seeded = logs.filter((log) => log.id.startsWith('wlog_tilapia_'))
        expect(
          seeded.map((log) =>
            log.results
              .filter((result) => result.status !== 'WITHIN_RANGE')
              .map((result) => `${result.parameter} ${result.status}`),
          ),
        ).toEqual([['DISSOLVED_OXYGEN BELOW_RANGE'], ['AMMONIA ABOVE_RANGE'], []])
      }
    })

    it('saves a reading once per Idempotency-Key, evaluated against the ranges', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)
      const thresholds = expectEnvelope(
        await client
          .get(
            `/water-thresholds?speciesId=${cultivation.species.id}&environmentId=${cultivation.environment.id}`,
          )
          .set('Authorization', auth),
      )
      const key = idempotencyKey('water-log')
      const body = {
        readings: { ph: 7.1, ammoniaMgL: 1.5, dissolvedOxygenMgL: 5, temperatureC: null },
        notes: 'Reading after the afternoon rain.',
      }

      const log = expectEnvelope(
        await client
          .post(logsPath(cultivation.id))
          .set('Authorization', auth)
          .set('Idempotency-Key', key)
          .send(body),
        201,
      )

      expectEvaluatedLog(log)
      expect(log).toMatchObject({
        cultivationId: cultivation.id,
        notes: 'Reading after the afternoon rain.',
        readings: {
          salinityPpt: null,
          ph: 7.1,
          ammoniaMgL: 1.5,
          dissolvedOxygenMgL: 5,
          temperatureC: null,
        },
        notLogged: ['SALINITY', 'NITRITE', 'NITRATE', 'WATER_TEMPERATURE'],
      })
      expect(log.results.map((result) => result.parameter)).toEqual([
        'PH',
        'AMMONIA',
        'DISSOLVED_OXYGEN',
      ])
      for (const result of log.results) {
        const threshold = thresholds.thresholds.find((row) => row.parameter === result.parameter)
        expect([result.minimum, result.maximum]).toEqual([threshold.minimum, threshold.maximum])
      }
      expect(log.results.find((result) => result.parameter === 'AMMONIA').status).toBe(
        'ABOVE_RANGE',
      )

      const replay = expectEnvelope(
        await client
          .post(logsPath(cultivation.id))
          .set('Authorization', auth)
          .set('Idempotency-Key', key)
          .send(body),
        201,
      )
      expect(replay.id).toBe(log.id)
      expectError(
        await client
          .post(logsPath(cultivation.id))
          .set('Authorization', auth)
          .set('Idempotency-Key', key)
          .send({ ...body, readings: { ph: 7.4 } }),
        409,
        'IDEMPOTENCY_CONFLICT',
      )

      const logs = expectPage(await client.get(logsPath(cultivation.id)).set('Authorization', auth))
      expect(logs.filter((item) => item.id === log.id)).toHaveLength(1)
      expect(logs[0].id).toBe(log.id)
    })

    it('refuses readings the contract does not accept, naming each field', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)
      const send = (body, key = idempotencyKey('bad-log')) =>
        client
          .post(logsPath(cultivation.id))
          .set('Authorization', auth)
          .set('Idempotency-Key', key)
          .send(body)

      const empty = expectError(await send({ readings: {} }), 422, 'VALIDATION_ERROR')
      expect(Object.keys(empty.fields)).toEqual(['readings'])
      const outOfScale = expectError(
        await send({ readings: { ph: 15, nitrateMgL: 'high' } }),
        422,
        'VALIDATION_ERROR',
      )
      expect(Object.keys(outOfScale.fields).sort()).toEqual(['readings.nitrateMgL', 'readings.ph'])
      const late = expectError(
        await send({ readings: { ph: 7 }, loggedAt: '2099-01-01T00:00:00Z' }),
        422,
        'VALIDATION_ERROR',
      )
      expect(Object.keys(late.fields)).toEqual(['loggedAt'])
      const longNotes = expectError(
        await send({ readings: { ph: 7 }, notes: 'x'.repeat(501) }),
        422,
        'VALIDATION_ERROR',
      )
      expect(Object.keys(longNotes.fields)).toEqual(['notes'])

      expectError(
        await client
          .post(logsPath(cultivation.id))
          .set('Authorization', auth)
          .send({ readings: { ph: 7 } }),
        400,
        'BAD_REQUEST',
      )
      expectError(
        await client.get(logsPath('cul_not_this_farmers')).set('Authorization', auth),
        404,
        'NOT_FOUND',
      )
    })

    it('keeps a harvested cultivation readable but closed to new readings', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const harvested = await findCultivation(client, accessToken, HARVEST_DEMO_CULTIVATION)
      expect(harvested.status).toBe('COMPLETED')

      expectPage(await client.get(logsPath(harvested.id)).set('Authorization', auth))
      expectError(
        await client
          .post(logsPath(harvested.id))
          .set('Authorization', auth)
          .set('Idempotency-Key', idempotencyKey('closed-log'))
          .send({ readings: { ph: 7 } }),
        409,
        'INVALID_STATE_TRANSITION',
      )
    })

    it('derives the feed conversion ratio from the feeding and growth records', async () => {
      const { accessToken } = await signInAsDemo(client)
      const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)

      const conversion = expectEnvelope(
        await client
          .get(feedConversionPath(cultivation.id))
          .set('Authorization', bearer(accessToken)),
      )

      expect(conversion).toMatchObject({
        cultivationId: cultivation.id,
        status: 'CALCULATED',
        ratio: expect.any(Number),
        periodStart: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        feedGiven: { value: expect.any(Number), unit: 'KG' },
        startBiomass: { value: expect.any(Number), unit: 'KG' },
        endBiomass: { value: expect.any(Number), unit: 'KG' },
        biomassGain: { value: expect.any(Number), unit: 'KG' },
        message: expect.any(String),
        isDemo: true,
        sourceStatus: 'DEMO',
        ruleVersion: expect.any(String),
        disclaimer: expect.any(String),
      })
      expect(conversion.feedingRecordCount).toBeGreaterThan(0)
      expect(conversion.growthSampleCount).toBeGreaterThanOrEqual(2)
      expect(conversion.basis.length).toBeGreaterThan(0)
      expect(conversion.biomassGain.value).toBeCloseTo(
        conversion.endBiomass.value - conversion.startBiomass.value,
        2,
      )
      expect(conversion.ratio).toBeCloseTo(
        conversion.feedGiven.value / conversion.biomassGain.value,
        2,
      )
      expect(conversion.intervals).toHaveLength(conversion.growthSampleCount - 1)
      expect(conversion.intervals[0].periodStart).toBe(conversion.periodStart)
      expect(conversion.intervals.at(-1).periodEnd).toBe(conversion.periodEnd)
    })

    it('answers insufficient data rather than a ratio without two samples or feed', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const oneSample = await findCultivation(client, accessToken, HARVEST_DEMO_CULTIVATION)

      const conversion = expectEnvelope(
        await client.get(feedConversionPath(oneSample.id)).set('Authorization', auth),
      )

      expect(conversion).toMatchObject({
        status: 'INSUFFICIENT_DATA',
        ratio: null,
        periodStart: null,
        periodEnd: null,
        feedGiven: null,
        biomassGain: null,
        growthSampleCount: 1,
        intervals: [],
        message: expect.any(String),
        isDemo: true,
      })
      expectError(
        await client.get(feedConversionPath('cul_not_this_farmers')).set('Authorization', auth),
        404,
        'NOT_FOUND',
      )
    })
  })
}
