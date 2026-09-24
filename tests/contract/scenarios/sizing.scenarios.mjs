import { describe, expect, it } from 'vitest'

import { bearer, registerAccount } from '../support/accounts.mjs'
import { findEnvironment, findSpecies } from '../support/demo.mjs'
import { expectEnvelope, expectError } from '../support/envelope.mjs'

const SPECIES_NAMES = ['Tilapia', 'Milkfish', 'Catfish', 'Grouper', 'Shrimp', 'Carp']
const ENVIRONMENT_CODES = ['POND', 'TANK', 'FISH_CAGE']

async function pairing(client, commonName, environmentCode) {
  const [species, environment] = await Promise.all([
    findSpecies(client, commonName),
    findEnvironment(client, environmentCode),
  ])
  return { speciesId: species.id, environmentId: environment.id }
}

function sizingQuery({ speciesId, environmentId }) {
  return `/sizing-guidance?speciesId=${encodeURIComponent(speciesId)}&environmentId=${encodeURIComponent(environmentId)}`
}

function estimate(client, accessToken, ids, dimensions, plannedFingerlings) {
  return client
    .post('/stocking-estimates')
    .set('Authorization', bearer(accessToken))
    .send({ ...ids, dimensions, plannedFingerlings })
}

export function registerSizingContract(client) {
  describe('pond and cage sizing', () => {
    it('suggests about 5,000 m² of pond at 1.0-1.2 m deep for 5,000 Bangus, as the brief does', async () => {
      const ids = await pairing(client, 'Milkfish', 'POND')
      const guidance = expectEnvelope(await client.get(sizingQuery(ids)))

      expect(guidance).toMatchObject({
        ...ids,
        basis: 'SURFACE_AREA',
        spacePerFish: { value: 1, unit: 'M2' },
        exampleFingerlings: 5000,
        exampleSpace: { value: 5000, unit: 'M2' },
        waterDepth: { minimum: 1, maximum: 1.2, unit: 'M' },
        isDemo: true,
        sourceStatus: 'DEMO',
        ruleVersion: 'demo-2026-09-gabayan',
        disclaimer: expect.any(String),
      })
      expect(guidance.spaceBasis).toMatch(/one square metre of pond per bangus/)
      expect(guidance.depthBasis).toMatch(/1\.0-1\.2 m/)
      expect(guidance.sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ organization: 'Gabayan', reviewedAt: null }),
        ]),
      )
    })

    it('answers a size for every pairing that can be planned and refuses the others', async () => {
      for (const commonName of SPECIES_NAMES) {
        for (const code of ENVIRONMENT_CODES) {
          const ids = await pairing(client, commonName, code)
          const compatibility = expectEnvelope(
            await client.get(
              `/compatibility?speciesId=${ids.speciesId}&environmentId=${ids.environmentId}`,
            ),
          )
          const response = await client.get(sizingQuery(ids))
          if (compatibility.status === 'NOT_RECOMMENDED') {
            expectError(response, 400, 'INCOMPATIBLE_SELECTION')
            continue
          }
          const guidance = expectEnvelope(response)
          const unit = guidance.basis === 'SURFACE_AREA' ? 'M2' : 'M3'
          expect(guidance.spacePerFish.unit, `${commonName} in ${code}`).toBe(unit)
          expect(guidance.exampleSpace.unit).toBe(unit)
          expect(guidance.spacePerFish.value).toBeGreaterThan(0)
          // Both are rounded up, the space a fish needs at four decimals and the example at two.
          const worked = guidance.exampleFingerlings * guidance.spacePerFish.value
          expect(Math.abs(worked - guidance.exampleSpace.value)).toBeLessThanOrEqual(
            guidance.exampleFingerlings * 0.0001 + 0.01,
          )
          expect(guidance.depthBasis).toEqual(expect.any(String))
          if (guidance.waterDepth !== null) {
            expect(guidance.waterDepth).toEqual({ minimum: 1, maximum: 1.2, unit: 'M' })
          }
          expect(guidance.isDemo).toBe(true)
        }
      }
    })

    it('reads without a session and refuses a missing or unknown pairing', async () => {
      const ids = await pairing(client, 'Tilapia', 'POND')

      expectError(
        await client.get(`/sizing-guidance?speciesId=${ids.speciesId}`),
        400,
        'BAD_REQUEST',
      )
      expectError(
        await client.get(sizingQuery({ ...ids, speciesId: 'sp_missing' })),
        404,
        'NOT_FOUND',
      )
      expectEnvelope(await client.get(sizingQuery(ids)))
    })

    it('names the extra pond area 5,000 Bangus need in a 20 x 25 m pond', async () => {
      const { accessToken } = await registerAccount(client, 'Bangus Sizer')
      const ids = await pairing(client, 'Milkfish', 'POND')

      const result = expectEnvelope(
        await estimate(
          client,
          accessToken,
          ids,
          { lengthM: 20, widthM: 25, waterDepthM: 1.2 },
          5000,
        ),
      )

      expect(result).toMatchObject({
        surfaceAreaM2: 500,
        status: 'ABOVE_RANGE',
        requiredSpace: { value: 5000, unit: 'M2' },
        additionalSpaceNeeded: { value: 4500, unit: 'M2' },
      })
    })

    it('needs no extra space within the range and names extra water volume for a volume rule', async () => {
      const { accessToken } = await registerAccount(client, 'Tilapia Sizer')
      const ids = await pairing(client, 'Tilapia', 'POND')
      const dimensions = { lengthM: 5, widthM: 4, waterDepthM: 1.5 }

      const within = expectEnvelope(await estimate(client, accessToken, ids, dimensions, 500))
      expect(within).toMatchObject({
        status: 'RECOMMENDED',
        requiredSpace: { value: 27.28, unit: 'M3' },
        additionalSpaceNeeded: { value: 0, unit: 'M3' },
      })

      const above = expectEnvelope(await estimate(client, accessToken, ids, dimensions, 1100))
      expect(above.status).toBe('ABOVE_RANGE')
      expect(above.requiredSpace.unit).toBe('M3')
      expect(above.additionalSpaceNeeded).toEqual({
        value: Number((above.requiredSpace.value - above.estimatedWaterVolumeM3).toFixed(2)),
        unit: 'M3',
      })
      expect(above.additionalSpaceNeeded.value).toBeGreaterThan(0)
    })
  })
}
