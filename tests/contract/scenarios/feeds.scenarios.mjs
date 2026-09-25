import { describe, expect, it } from 'vitest'

import { bearer, registerAccount } from '../support/accounts.mjs'
import { findProduct, findSpecies } from '../support/demo.mjs'
import { expectEnvelope, expectError } from '../support/envelope.mjs'

const SPECIES_NAMES = ['Tilapia', 'Milkfish', 'Catfish', 'Grouper', 'Shrimp', 'Carp']
const GROWER_FEED_SKU = 'GBY-FED-020'

async function feedGuide(client, accessToken, speciesId) {
  return client.get(`/species/${speciesId}/feed-guide`).set('Authorization', bearer(accessToken))
}

export function registerFeedsContract(client) {
  describe('feed guides by species', () => {
    it('answers every species a guide per growth stage, in the profile order, with provenance', async () => {
      const { accessToken } = await registerAccount(client, 'Feed Guide Reader')

      for (const commonName of SPECIES_NAMES) {
        const species = await findSpecies(client, commonName)
        const profile = expectEnvelope(await client.get(`/species/${species.id}`))
        const guide = expectEnvelope(await feedGuide(client, accessToken, species.id))

        expect(guide.species, commonName).toMatchObject({
          id: species.id,
          commonName: species.commonName,
          localName: species.localName,
        })
        expect(guide).toMatchObject({
          isDemo: true,
          sourceStatus: 'DEMO',
          ruleVersion: 'demo-2026-09-gabayan',
          disclaimer: expect.stringContaining('not yet reviewed'),
        })
        expect(guide.sources).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ organization: 'SEAFDEC Aquaculture Department' }),
          ]),
        )
        expect(guide.stages.map((stage) => stage.growthStageCode)).toEqual(
          profile.growthStages.map((stage) => stage.code),
        )
        for (const stage of guide.stages) {
          const rule = profile.feedingRules.find((row) => row.growthStage === stage.growthStage)
          expect(stage, `${commonName} ${stage.growthStageCode}`).toMatchObject({
            feedType: expect.any(String),
            proteinPercent: { minimum: expect.any(Number), maximum: expect.any(Number) },
            pelletSize: { minimum: expect.any(Number), maximum: expect.any(Number), unit: 'MM' },
            feedingsPerDay: rule.feedingsPerDay,
            weightRange: { minimum: { unit: 'G' } },
            basis: expect.stringMatching(/placeholder/),
            sourceStatus: 'DEMO',
          })
          expect(stage.proteinPercent.minimum).toBeLessThanOrEqual(stage.proteinPercent.maximum)
          expect(stage.pelletSize.minimum).toBeLessThanOrEqual(stage.pelletSize.maximum)
          for (const product of stage.products) {
            expect(product.category.code).toBe('FEEDS')
            expect(product).toHaveProperty('isFavorite')
          }
        }
      }
    })

    it('links the Tilapia grower feed to the growing stage the demo batch is in', async () => {
      const { accessToken } = await registerAccount(client, 'Tilapia Feed Buyer')
      const tilapia = await findSpecies(client, 'Tilapia')
      const growerFeed = await findProduct(client, accessToken, GROWER_FEED_SKU)

      const guide = expectEnvelope(await feedGuide(client, accessToken, tilapia.id))
      const [growing, preHarvest] = guide.stages

      expect(growing).toMatchObject({
        growthStageCode: 'GROWING',
        growthStage: 'Growing',
        weightRange: { minimum: { value: 0, unit: 'G' }, maximum: { value: 300, unit: 'G' } },
        proteinPercent: { minimum: 28, maximum: 32 },
        pelletSize: { minimum: 2, maximum: 4, unit: 'MM' },
        feedingsPerDay: 2,
      })
      expect(growing.products.map((product) => product.id)).toEqual([growerFeed.id])
      expect(growing.products[0]).toMatchObject({
        sku: GROWER_FEED_SKU,
        price: { amountMinor: 118000, currency: 'PHP' },
        availability: expect.any(String),
        isFavorite: false,
      })
      expect(preHarvest).toMatchObject({
        growthStageCode: 'PRE_HARVEST',
        weightRange: { minimum: { value: 300, unit: 'G' }, maximum: null },
        products: [],
      })
    })

    it('marks a linked feed the farmer has saved as a favourite', async () => {
      const { accessToken } = await registerAccount(client, 'Feed Favourite Saver')
      const tilapia = await findSpecies(client, 'Tilapia')
      const growerFeed = await findProduct(client, accessToken, GROWER_FEED_SKU)
      await client
        .put(`/products/${growerFeed.id}/favorite`)
        .set('Authorization', bearer(accessToken))
        .expect(200)

      const guide = expectEnvelope(await feedGuide(client, accessToken, tilapia.id))

      expect(guide.stages[0].products[0]).toMatchObject({ id: growerFeed.id, isFavorite: true })
    })

    it('asks for sign-in and answers an unknown species as not found', async () => {
      const tilapia = await findSpecies(client, 'Tilapia')
      expectError(await client.get(`/species/${tilapia.id}/feed-guide`), 401, 'AUTH_REQUIRED')

      const { accessToken } = await registerAccount(client, 'Unknown Fish Reader')
      expectError(await feedGuide(client, accessToken, 'sp_unknown'), 404, 'NOT_FOUND')
    })
  })
}
