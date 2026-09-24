import { describe, expect, it } from 'vitest'

import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'
import { POND_DIMENSIONS, findEnvironment, findSpecies } from '../support/demo.mjs'

export function registerReferenceContract(client) {
  describe('reference profiles and compatibility', () => {
    // BLOCKERS D-17: shared reference data holds nothing of any account, so the setup
    // wizard reads it before sign-up. None of these requests carries a token.
    it('serves species, environments, compatibility and product categories without a token', async () => {
      const tilapia = await findSpecies(client, 'Tilapia')
      const pond = await findEnvironment(client, 'POND')

      const species = expectEnvelope(await client.get(`/species/${tilapia.id}`))
      expect(species).toMatchObject({
        id: tilapia.id,
        commonName: 'Tilapia',
        sourceStatus: expect.any(String),
      })

      const environment = expectEnvelope(await client.get(`/culture-environments/${pond.id}`))
      expect(environment).toMatchObject({
        id: pond.id,
        code: 'POND',
        dimensionModel: 'RECTANGULAR_VOLUME',
      })

      const compatibility = expectEnvelope(
        await client.get(`/compatibility?speciesId=${tilapia.id}&environmentId=${pond.id}`),
      )
      expect(compatibility).toMatchObject({
        speciesId: tilapia.id,
        environmentId: pond.id,
        status: 'COMPATIBLE',
        alternatives: expect.any(Array),
        ruleVersion: expect.any(String),
      })

      const categories = expectPage(await client.get('/product-categories'))
      expect(categories.map((category) => category.name)).toEqual(
        expect.arrayContaining(['Feeds', 'Aeration', 'Water Pumps', 'Testing']),
      )
    })

    it('keeps stocking estimates behind sign-in', async () => {
      const [tilapia, pond] = await Promise.all([
        findSpecies(client, 'Tilapia'),
        findEnvironment(client, 'POND'),
      ])
      const response = await client.post('/stocking-estimates').send({
        speciesId: tilapia.id,
        environmentId: pond.id,
        dimensions: POND_DIMENSIONS,
        plannedFingerlings: 500,
      })

      expectError(response, 401, 'AUTH_REQUIRED')
    })
  })
}
