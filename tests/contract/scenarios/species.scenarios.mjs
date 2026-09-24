import { describe, expect, it } from 'vitest'

import { bearer, registerAccount } from '../support/accounts.mjs'
import { findEnvironment, findSpecies } from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

const ENVIRONMENT_CODES = ['POND', 'TANK', 'FISH_CAGE']

// GABAYAN.md names five species; Carp stays beside them (BLOCKERS D-24).
const INITIAL_SPECIES = [
  ['Tilapia', 'Tilapia'],
  ['Milkfish', 'Bangus'],
  ['Catfish', 'Hito'],
  ['Grouper', 'Lapu-lapu'],
  ['Shrimp', 'Hipon'],
  ['Carp', 'Carp'],
]

async function environmentsByCode(client) {
  const environments = await Promise.all(
    ENVIRONMENT_CODES.map((code) => findEnvironment(client, code)),
  )
  return Object.fromEntries(environments.map((environment) => [environment.code, environment]))
}

export function registerSpeciesContract(client) {
  describe('species profiles', () => {
    it('lists the six initial species, each a demo profile', async () => {
      const species = expectPage(await client.get('/species?active=true&limit=100'))

      expect(species.map((item) => [item.commonName, item.localName])).toEqual(INITIAL_SPECIES)
      for (const item of species) {
        expect(item).toMatchObject({
          active: true,
          sourceStatus: 'DEMO',
          image: { url: expect.any(String), alt: expect.any(String) },
        })
      }
    })

    for (const commonName of ['Grouper', 'Shrimp']) {
      it(`answers compatibility for ${commonName} in every culture system and stocking rules for each it allows`, async () => {
        const [species, environments] = await Promise.all([
          findSpecies(client, commonName),
          environmentsByCode(client),
        ])
        const profile = expectEnvelope(await client.get(`/species/${species.id}`))

        for (const environment of Object.values(environments)) {
          const compatibility = expectEnvelope(
            await client.get(
              `/compatibility?speciesId=${species.id}&environmentId=${environment.id}`,
            ),
          )
          expect(compatibility).toMatchObject({
            speciesId: species.id,
            environmentId: environment.id,
            title: expect.any(String),
            message: expect.any(String),
            sourceStatus: 'DEMO',
          })
          const stockingRule = profile.stockingRules.find(
            (rule) => rule.environmentId === environment.id,
          )
          if (compatibility.status === 'NOT_RECOMMENDED') {
            expect(stockingRule).toBeUndefined()
          } else {
            expect(stockingRule).toMatchObject({
              speciesId: species.id,
              basis: expect.stringMatching(/^(SURFACE_AREA|WATER_VOLUME)$/),
              minimumDensity: expect.any(Number),
              maximumDensity: expect.any(Number),
              sourceStatus: 'DEMO',
            })
          }
        }
      })
    }

    it('serves the full species profile with its sources and disclaimer', async () => {
      const [milkfish, environments] = await Promise.all([
        findSpecies(client, 'Milkfish'),
        environmentsByCode(client),
      ])
      const profile = expectEnvelope(await client.get(`/species/${milkfish.id}`))

      expect(profile).toMatchObject({
        id: milkfish.id,
        localName: 'Bangus',
        compatibleEnvironmentIds: [environments.POND.id],
        targetHarvestWeight: { value: expect.any(Number), unit: 'G' },
        ruleVersion: expect.any(String),
        disclaimer: expect.any(String),
      })
      expect(profile.growthStages.length).toBeGreaterThan(0)
      expect(profile.feedingRules.length).toBeGreaterThan(0)
      expect(profile.waterGuidance.map((rule) => rule.message).join(' ')).toMatch(/2\.0-3\.0 mg\/L/)
      expect(profile.sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            organization: 'University of Florida IFAS Extension',
            url: 'https://ask.ifas.ufl.edu/publication/FA002',
            reviewedAt: null,
          }),
        ]),
      )
    })

    it('estimates a Bangus pond at about one fish per square metre of surface', async () => {
      const { accessToken } = await registerAccount(client, 'Bangus Planner')
      const [milkfish, environments] = await Promise.all([
        findSpecies(client, 'Milkfish'),
        environmentsByCode(client),
      ])
      const estimate = expectEnvelope(
        await client
          .post('/stocking-estimates')
          .set('Authorization', bearer(accessToken))
          .send({
            speciesId: milkfish.id,
            environmentId: environments.POND.id,
            dimensions: { lengthM: 25, widthM: 20, waterDepthM: 1.2 },
            plannedFingerlings: 450,
          }),
      )

      expect(estimate).toMatchObject({
        surfaceAreaM2: 500,
        recommendedMinimum: 400,
        recommendedMaximum: 500,
        status: 'RECOMMENDED',
        basis: { type: 'SURFACE_AREA', densityUnit: 'FISH_PER_M2', inputAreaM2: 500 },
        isDemo: true,
        sourceStatus: 'DEMO',
      })
      expect(estimate.basis.explanation).toMatch(/one square metre of pond per bangus/)
    })

    it('advises against Shrimp in a fish cage, points to a pond, and refuses the estimate', async () => {
      const { accessToken } = await registerAccount(client, 'Shrimp Planner')
      const [shrimp, environments] = await Promise.all([
        findSpecies(client, 'Shrimp'),
        environmentsByCode(client),
      ])
      const compatibility = expectEnvelope(
        await client.get(
          `/compatibility?speciesId=${shrimp.id}&environmentId=${environments.FISH_CAGE.id}`,
        ),
      )
      expect(compatibility).toMatchObject({
        status: 'NOT_RECOMMENDED',
        message: expect.stringMatching(/floating fish cage does not suit them/),
        alternatives: [{ environmentId: environments.POND.id, name: 'Pond' }],
      })

      const refused = await client
        .post('/stocking-estimates')
        .set('Authorization', bearer(accessToken))
        .send({
          speciesId: shrimp.id,
          environmentId: environments.FISH_CAGE.id,
          dimensions: { lengthM: 5, widthM: 5, waterDepthM: 2 },
          plannedFingerlings: 500,
        })
      expectError(refused, 400, 'INCOMPATIBLE_SELECTION')
    })
  })
}
