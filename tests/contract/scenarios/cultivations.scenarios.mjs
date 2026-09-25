import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import { DEMO_CULTIVATION, SEED_DAY, createCultivation, findCultivation } from '../support/demo.mjs'
import { expectEnvelope, expectError } from '../support/envelope.mjs'

const STOCKING_DAY = '2026-09-01'

export function registerCultivationContract(client) {
  describe('cultivations', () => {
    it('reads a cultivation with its timeline and equipment recommendations', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const { id } = await findCultivation(client, accessToken, DEMO_CULTIVATION)

      const detail = expectEnvelope(
        await client.get(`/cultivations/${id}`).set('Authorization', auth),
      )
      expect(detail).toMatchObject({
        id,
        name: DEMO_CULTIVATION,
        stockedOn: '2026-08-07',
        dimensions: expect.any(Object),
        growthStage: { code: expect.any(String), name: expect.any(String) },
        stockingEstimateSnapshot: expect.any(Object),
        recommendationDisclaimer: expect.any(String),
      })

      const timeline = expectEnvelope(
        await client.get(`/cultivations/${id}/timeline`).set('Authorization', auth),
      )
      expect(timeline.cultivationId).toBe(id)
      for (const event of timeline.events) {
        expect(['COMPLETED', 'CURRENT', 'UPCOMING']).toContain(event.status)
      }

      const equipment = expectEnvelope(
        await client
          .get(`/cultivations/${id}/equipment-recommendations`)
          .set('Authorization', auth),
      )
      expect(equipment).toMatchObject({
        cultivationId: id,
        sections: expect.any(Array),
        isDemo: true,
        disclaimer: expect.any(String),
      })
    })

    it("keeps another account's cultivation out of reach", async () => {
      const owner = await registerAccount(client, 'Private Owner')
      const cultivation = await createCultivation(client, owner.accessToken)
      const { accessToken } = await signInAsDemo(client)

      const read = await client
        .get(`/cultivations/${cultivation.id}`)
        .set('Authorization', bearer(accessToken))
      expectError(read, 404, 'NOT_FOUND')
      const edit = await client
        .patch(`/cultivations/${cultivation.id}`)
        .set('Authorization', bearer(accessToken))
        .send({ name: 'Not mine' })
      expectError(edit, 404, 'NOT_FOUND')
    })

    it('renames a cultivation and refuses a stale If-Match with the current version', async () => {
      const { accessToken } = await registerAccount(client, 'Rename Tester')
      const auth = bearer(accessToken)
      const created = await createCultivation(client, accessToken)

      const renamed = expectEnvelope(
        await client
          .patch(`/cultivations/${created.id}`)
          .set('Authorization', auth)
          .set('If-Match', String(created.version))
          .send({ name: '  Rainy season pond  ', notes: 'Moved closer to the house.' }),
      )
      expect(renamed).toMatchObject({
        id: created.id,
        name: 'Rainy season pond',
        notes: 'Moved closer to the house.',
        status: 'PLANNING',
        version: created.version + 1,
      })

      const stale = await client
        .patch(`/cultivations/${created.id}`)
        .set('Authorization', auth)
        .set('If-Match', String(created.version))
        .send({ name: 'Overwritten from an old screen' })
      const conflict = expectError(stale, 409, 'CONFLICT')
      expect(conflict.details).toEqual({ currentVersion: renamed.version })

      const cleared = expectEnvelope(
        await client
          .patch(`/cultivations/${created.id}`)
          .set('Authorization', auth)
          .send({ notes: null }),
      )
      expect(cleared).toMatchObject({ name: 'Rainy season pond', notes: null })
      const detail = expectEnvelope(
        await client.get(`/cultivations/${created.id}`).set('Authorization', auth),
      )
      expect(detail.version).toBe(cleared.version)
    })

    it('makes a planning cultivation active once its stocking date is set', async () => {
      const { accessToken } = await registerAccount(client, 'Stocking Tester')
      const created = await createCultivation(client, accessToken)
      expect(created).toMatchObject({ status: 'PLANNING', stockedOn: null })

      const stocked = expectEnvelope(
        await client
          .patch(`/cultivations/${created.id}`)
          .set('Authorization', bearer(accessToken))
          .send({ stockedOn: STOCKING_DAY }),
      )
      expect(stocked).toMatchObject({
        status: 'ACTIVE',
        stockedOn: STOCKING_DAY,
        dayNumber: expect.any(Number),
        estimatedHarvestDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
      expect(stocked.estimatedHarvestDate > STOCKING_DAY).toBe(true)
    })

    it('refuses a future or cleared stocking date, other fields and an empty change', async () => {
      const { accessToken } = await registerAccount(client, 'Patch Validator')
      const created = await createCultivation(client, accessToken)
      const patch = (body) =>
        client
          .patch(`/cultivations/${created.id}`)
          .set('Authorization', bearer(accessToken))
          .send(body)

      const future = expectError(await patch({ stockedOn: '2099-12-31' }), 422, 'VALIDATION_ERROR')
      expect(future.fields).toHaveProperty('stockedOn')
      const cleared = expectError(await patch({ stockedOn: null }), 422, 'VALIDATION_ERROR')
      expect(cleared.fields).toHaveProperty('stockedOn')
      const blankName = expectError(await patch({ name: '   ' }), 422, 'VALIDATION_ERROR')
      expect(blankName.fields).toHaveProperty('name')
      const stock = expectError(await patch({ initialFingerlings: 900 }), 422, 'VALIDATION_ERROR')
      expect(stock.fields).toHaveProperty('initialFingerlings')
      expectError(await patch({}), 422, 'VALIDATION_ERROR')

      const unchanged = expectEnvelope(
        await client.get(`/cultivations/${created.id}`).set('Authorization', bearer(accessToken)),
      )
      expect(unchanged.version).toBe(created.version)
    })

    it('refuses to edit a cultivation once it is harvested', async () => {
      const { accessToken } = await registerAccount(client, 'Harvest Closer')
      const auth = bearer(accessToken)
      const created = await createCultivation(client, accessToken, { stockedOn: STOCKING_DAY })
      const harvest = await client
        .post(`/cultivations/${created.id}/harvest`)
        .set('Authorization', auth)
        .set('Idempotency-Key', idempotencyKey('closing-harvest'))
        .send({
          harvestDate: SEED_DAY,
          numberHarvested: 450,
          totalHarvestWeight: { value: 150, unit: 'KG' },
          averageFishWeight: { value: 333, unit: 'G' },
          sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' },
          notes: null,
        })
      expect(expectEnvelope(harvest, 201).cultivation.status).toBe('COMPLETED')

      const edit = await client
        .patch(`/cultivations/${created.id}`)
        .set('Authorization', auth)
        .send({ name: 'Renamed after harvest' })
      const error = expectError(edit, 409, 'INVALID_STATE_TRANSITION')
      expect(error.details).toMatchObject({ status: 'COMPLETED' })
    })
  })
}
