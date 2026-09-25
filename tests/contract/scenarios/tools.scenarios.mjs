import { describe, expect, it } from 'vitest'

import { bearer, registerAccount } from '../support/accounts.mjs'
import { AERATOR_SKU, findEnvironment, findProduct, findSpecies } from '../support/demo.mjs'
import { expectEnvelope } from '../support/envelope.mjs'

const SCOOP_NET_SKU = 'GBY-NET-012'
const TEST_KIT_SKU = 'GBY-TST-004'

async function pairing(client, commonName, environmentCode) {
  const [species, environment] = await Promise.all([
    findSpecies(client, commonName),
    findEnvironment(client, environmentCode),
  ])
  return { speciesId: species.id, environmentId: environment.id }
}

async function safetyCheck(client, auth, ids, readings) {
  return expectEnvelope(
    await client
      .post('/water-safety-checks')
      .set('Authorization', auth)
      .send({ ...ids, readings }),
  )
}

export function registerToolsContract(client) {
  describe('installation guides and the products that address a water problem', () => {
    it('answers the aerator with numbered installation steps, cautions and provenance', async () => {
      const { accessToken } = await registerAccount(client, 'Guide Reader')
      const aerator = await findProduct(client, accessToken, AERATOR_SKU)

      const detail = expectEnvelope(
        await client.get(`/products/${aerator.id}`).set('Authorization', bearer(accessToken)),
      )
      const guide = detail.installationGuide
      expect(guide).toMatchObject({
        cautions: expect.arrayContaining([expect.any(String)]),
        isDemo: true,
        sourceStatus: 'DEMO',
        disclaimer: expect.any(String),
      })
      expect(guide.steps.length).toBeGreaterThan(1)
      expect(guide.steps.map((step) => step.order)).toEqual(
        guide.steps.map((_, index) => index + 1),
      )
      for (const step of guide.steps) {
        expect(step).toEqual({
          order: expect.any(Number),
          title: expect.any(String),
          instruction: expect.any(String),
        })
      }
    })

    it('answers a null guide for a product that needs no installing', async () => {
      const { accessToken } = await registerAccount(client, 'Net Buyer')
      const net = await findProduct(client, accessToken, SCOOP_NET_SKU)

      const detail = expectEnvelope(
        await client.get(`/products/${net.id}`).set('Authorization', bearer(accessToken)),
      )
      expect(detail.installationGuide).toBeNull()
    })

    it('recommends the aerator for low dissolved oxygen in a Tilapia pond', async () => {
      const { accessToken } = await registerAccount(client, 'Oxygen Checker')
      const auth = bearer(accessToken)
      const ids = await pairing(client, 'Tilapia', 'POND')

      const check = await safetyCheck(client, auth, ids, { dissolvedOxygenMgL: 1.5, ph: 7.2 })
      const oxygen = check.results.find((result) => result.parameter === 'DISSOLVED_OXYGEN')
      expect(oxygen.status).toBe('BELOW_RANGE')
      const aerator = oxygen.recommendedProducts.find((product) => product.sku === AERATOR_SKU)
      expect(aerator).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        price: { amountMinor: expect.any(Number), currency: 'PHP' },
        availability: expect.any(String),
        category: { code: 'AERATION' },
        whyRelevant: expect.any(String),
        suggestedQuantity: 1,
      })

      const ph = check.results.find((result) => result.parameter === 'PH')
      expect(ph.status).toBe('WITHIN_RANGE')
      expect(ph.recommendedProducts).toEqual([])
    })

    it('recommends a test kit for high ammonia and only products suited to the culture system', async () => {
      const { accessToken } = await registerAccount(client, 'Cage Checker')
      const auth = bearer(accessToken)
      const pond = await pairing(client, 'Tilapia', 'POND')
      const cage = await pairing(client, 'Tilapia', 'FISH_CAGE')

      const pondCheck = await safetyCheck(client, auth, pond, { ammoniaMgL: 1.2 })
      const ammonia = pondCheck.results[0]
      expect(ammonia.status).toBe('ABOVE_RANGE')
      expect(ammonia.recommendedProducts.map((product) => product.sku)).toContain(TEST_KIT_SKU)

      const cageCheck = await safetyCheck(client, auth, cage, { dissolvedOxygenMgL: 1.5 })
      const oxygen = cageCheck.results[0]
      expect(oxygen.status).toBe('BELOW_RANGE')
      for (const product of oxygen.recommendedProducts) {
        const detail = expectEnvelope(
          await client.get(`/products/${product.id}`).set('Authorization', auth),
        )
        expect(detail.suitableEnvironmentIds).toContain(cage.environmentId)
      }
      expect(oxygen.recommendedProducts.map((product) => product.sku)).not.toContain(AERATOR_SKU)
    })
  })
}
