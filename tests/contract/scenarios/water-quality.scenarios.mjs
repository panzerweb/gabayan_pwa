import { describe, expect, it } from 'vitest'

import { bearer, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import {
  DEMO_CULTIVATION,
  findCultivation,
  findEnvironment,
  findSpecies,
} from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

// The seven parameters of contract §7, in order, with the reading field of each.
const PARAMETERS = [
  ['SALINITY', 'PPT', 'salinityPpt'],
  ['PH', 'PH', 'ph'],
  ['AMMONIA', 'MG_PER_L', 'ammoniaMgL'],
  ['NITRITE', 'MG_PER_L', 'nitriteMgL'],
  ['NITRATE', 'MG_PER_L', 'nitrateMgL'],
  ['DISSOLVED_OXYGEN', 'MG_PER_L', 'dissolvedOxygenMgL'],
  ['WATER_TEMPERATURE', 'CELSIUS', 'temperatureC'],
]
const READING_FIELD = Object.fromEntries(PARAMETERS.map(([code, , field]) => [code, field]))
const SPECIES_NAMES = ['Tilapia', 'Milkfish', 'Catfish', 'Grouper', 'Shrimp', 'Carp']
const ENVIRONMENT_CODES = ['POND', 'TANK', 'FISH_CAGE']
const FULL_WATER_REPLACEMENT = /(replace|change|drain)\s+(all|the whole|every)/i

async function pairing(client, commonName, environmentCode) {
  const [species, environment] = await Promise.all([
    findSpecies(client, commonName),
    findEnvironment(client, environmentCode),
  ])
  return { speciesId: species.id, environmentId: environment.id }
}

function thresholdsQuery({ speciesId, environmentId }) {
  return `/water-thresholds?speciesId=${encodeURIComponent(speciesId)}&environmentId=${encodeURIComponent(environmentId)}`
}

// A reading just past a bound, or inside the range, for one threshold.
function readingFor(threshold, where) {
  if (where === 'below') return threshold.minimum === null ? null : threshold.minimum / 2
  if (where === 'above') return threshold.maximum === null ? null : threshold.maximum + 1
  if (threshold.minimum !== null && threshold.maximum !== null) {
    return (threshold.minimum + threshold.maximum) / 2
  }
  return threshold.minimum ?? threshold.maximum
}

function readingsFor(thresholds, where) {
  const readings = {}
  for (const threshold of thresholds) {
    const value = readingFor(threshold, where)
    if (value !== null) readings[READING_FIELD[threshold.parameter]] = value
  }
  return readings
}

export function registerWaterQualityContract(client) {
  describe('water-quality thresholds and safety check', () => {
    it('reads seven ranges for every species and culture system that can be planned', async () => {
      const { accessToken } = await registerAccount(client, 'Range Reader')
      const auth = bearer(accessToken)

      for (const commonName of SPECIES_NAMES) {
        for (const code of ENVIRONMENT_CODES) {
          const ids = await pairing(client, commonName, code)
          const compatibility = expectEnvelope(
            await client.get(
              `/compatibility?speciesId=${ids.speciesId}&environmentId=${ids.environmentId}`,
            ),
          )
          const response = await client.get(thresholdsQuery(ids)).set('Authorization', auth)
          if (compatibility.status === 'NOT_RECOMMENDED') {
            expectError(response, 400, 'INCOMPATIBLE_SELECTION')
            continue
          }
          const set = expectEnvelope(response)
          expect(set).toMatchObject({
            ...ids,
            guidance: expect.any(String),
            isDemo: true,
            sourceStatus: 'DEMO',
            ruleVersion: expect.any(String),
            disclaimer: expect.any(String),
          })
          expect(set.sources.length).toBeGreaterThan(0)
          expect(set.thresholds.map((row) => [row.parameter, row.unit])).toEqual(
            PARAMETERS.map(([parameter, unit]) => [parameter, unit]),
          )
          for (const row of set.thresholds) {
            expect(row).toMatchObject({
              name: expect.any(String),
              explanation: expect.any(String),
              basis: expect.any(String),
              sourceStatus: 'DEMO',
              ruleVersion: expect.any(String),
            })
            expect(row.minimum !== null || row.maximum !== null).toBe(true)
          }
        }
      }
    })

    it('gives Tilapia in a pond the cited oxygen floor and placeholder ranges that say so', async () => {
      const { accessToken } = await registerAccount(client, 'Tilapia Ranges')
      const ids = await pairing(client, 'Tilapia', 'POND')

      const set = expectEnvelope(
        await client.get(thresholdsQuery(ids)).set('Authorization', bearer(accessToken)),
      )

      const byParameter = Object.fromEntries(set.thresholds.map((row) => [row.parameter, row]))
      expect(byParameter.DISSOLVED_OXYGEN).toMatchObject({ minimum: 3, maximum: null })
      expect(byParameter.DISSOLVED_OXYGEN.basis).toMatch(/IFAS/)
      expect(byParameter.AMMONIA).toMatchObject({ minimum: null, maximum: 0.5 })
      expect(byParameter.AMMONIA.basis).toMatch(/placeholder/i)
      expect(byParameter.PH).toMatchObject({ minimum: 6.5, maximum: 8.5 })
    })

    it('refuses a thresholds read without both ids, for an unknown fish, or without a session', async () => {
      const { accessToken } = await registerAccount(client, 'Range Errors')
      const auth = bearer(accessToken)
      const ids = await pairing(client, 'Tilapia', 'POND')

      expectError(
        await client.get(`/water-thresholds?speciesId=${ids.speciesId}`).set('Authorization', auth),
        400,
        'BAD_REQUEST',
      )
      expectError(
        await client
          .get(thresholdsQuery({ ...ids, speciesId: 'sp_missing' }))
          .set('Authorization', auth),
        404,
        'NOT_FOUND',
      )
      expectError(await client.get(thresholdsQuery(ids)), 401, 'AUTH_REQUIRED')
    })

    it('answers below, within or above for each entered reading', async () => {
      const { accessToken } = await registerAccount(client, 'Safety Checker')
      const auth = bearer(accessToken)
      const ids = await pairing(client, 'Tilapia', 'POND')
      const { thresholds } = expectEnvelope(
        await client.get(thresholdsQuery(ids)).set('Authorization', auth),
      )

      for (const [where, status] of [
        ['below', 'BELOW_RANGE'],
        ['within', 'WITHIN_RANGE'],
        ['above', 'ABOVE_RANGE'],
      ]) {
        const readings = readingsFor(thresholds, where)
        const check = expectEnvelope(
          await client
            .post('/water-safety-checks')
            .set('Authorization', auth)
            .send({ ...ids, readings }),
        )
        const entered = thresholds.filter((row) => readingFor(row, where) !== null)
        expect(check).toMatchObject({
          ...ids,
          checkedAt: expect.any(String),
          isDemo: true,
          sourceStatus: 'DEMO',
          disclaimer: expect.any(String),
        })
        expect(check.results.map((result) => [result.parameter, result.status])).toEqual(
          entered.map((row) => [row.parameter, status]),
        )
        for (const result of check.results) {
          expect(result).toMatchObject({
            value: readings[READING_FIELD[result.parameter]],
            unit: expect.any(String),
            explanation: expect.any(String),
            guidance: {
              severity: expect.stringMatching(/^(INFO|CAUTION|ACTION)$/),
              title: expect.any(String),
              message: expect.any(String),
              disclaimer: expect.any(String),
            },
          })
          expect(result.guidance.message).not.toMatch(FULL_WATER_REPLACEMENT)
        }
        expect(check.notChecked).toEqual(
          thresholds.filter((row) => !entered.includes(row)).map((row) => row.parameter),
        )
      }
    })

    it('counts a reading on a bound as within and passes over the readings left out', async () => {
      const { accessToken } = await registerAccount(client, 'Partial Checker')
      const ids = await pairing(client, 'Tilapia', 'POND')

      const check = expectEnvelope(
        await client
          .post('/water-safety-checks')
          .set('Authorization', bearer(accessToken))
          .send({ ...ids, readings: { ammoniaMgL: 0.5, ph: null } }),
      )

      expect(check.results).toHaveLength(1)
      expect(check.results[0]).toMatchObject({
        parameter: 'AMMONIA',
        value: 0.5,
        maximum: 0.5,
        status: 'WITHIN_RANGE',
      })
      expect(check.notChecked).toEqual(
        PARAMETERS.map(([code]) => code).filter((code) => code !== 'AMMONIA'),
      )
    })

    it('guides high ammonia conditionally, and by the culture system', async () => {
      const { accessToken } = await registerAccount(client, 'Ammonia Checker')
      const auth = bearer(accessToken)
      const check = async (commonName, code) =>
        expectEnvelope(
          await client
            .post('/water-safety-checks')
            .set('Authorization', auth)
            .send({ ...(await pairing(client, commonName, code)), readings: { ammoniaMgL: 2 } }),
        ).results[0]

      const pond = await check('Tilapia', 'POND')
      const cage = await check('Grouper', 'FISH_CAGE')

      expect(pond).toMatchObject({ status: 'ABOVE_RANGE', guidance: { severity: 'ACTION' } })
      expect(pond.guidance.message).toMatch(/\bif\b/i)
      expect(pond.guidance.message).toMatch(/part of the water/i)
      expect(cage.guidance.message).toMatch(/cage/i)
      expect(cage.guidance.message).not.toMatch(/part of the water/i)
      for (const result of [pond, cage]) {
        expect(result.guidance.message).not.toMatch(FULL_WATER_REPLACEMENT)
      }
    })

    it('refuses a check with no readings, a reading out of bounds, or an unknown fish', async () => {
      const { accessToken } = await registerAccount(client, 'Check Errors')
      const auth = bearer(accessToken)
      const ids = await pairing(client, 'Tilapia', 'POND')
      const send = (body) =>
        client.post('/water-safety-checks').set('Authorization', auth).send(body)

      expect(
        expectError(await send({ ...ids, readings: {} }), 422, 'VALIDATION_ERROR').fields,
      ).toHaveProperty('readings')
      expect(
        expectError(
          await send({ ...ids, readings: { ph: 15, ammoniaMgL: 'high' } }),
          422,
          'VALIDATION_ERROR',
        ).fields,
      ).toEqual({
        'readings.ph': [expect.any(String)],
        'readings.ammoniaMgL': [expect.any(String)],
      })
      expect(
        expectError(
          await send({ ...ids, speciesId: 'sp_missing', readings: { ph: 7 } }),
          422,
          'VALIDATION_ERROR',
        ).fields,
      ).toHaveProperty('speciesId')
      expectError(
        await send({ ...(await pairing(client, 'Shrimp', 'FISH_CAGE')), readings: { ph: 8 } }),
        400,
        'INCOMPATIBLE_SELECTION',
      )
      expectError(
        await client.post('/water-safety-checks').send({ ...ids, readings: { ph: 7 } }),
        401,
        'AUTH_REQUIRED',
      )
    })

    it('stores nothing: the cultivation keeps its water checks', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const cultivation = await findCultivation(client, accessToken, DEMO_CULTIVATION)
      const waterChecks = async () =>
        (
          await client
            .get(`/cultivations/${cultivation.id}/water-checks`)
            .set('Authorization', auth)
        ).body.page.total

      const before = await waterChecks()
      expectEnvelope(
        await client
          .post('/water-safety-checks')
          .set('Authorization', auth)
          .send({
            speciesId: cultivation.species.id,
            environmentId: cultivation.environment.id,
            readings: { ammoniaMgL: 1.2, dissolvedOxygenMgL: 2 },
          }),
      )

      expect(await waterChecks()).toBe(before)
      expectPage(
        await client.get(`/cultivations/${cultivation.id}/water-checks`).set('Authorization', auth),
      )
    })
  })
}
