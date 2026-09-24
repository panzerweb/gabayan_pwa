import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import {
  POND_DIMENSIONS,
  SEED_DAY,
  findEnvironment,
  findSpecies,
  requestCultivation,
} from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

const STOCKING_DAY = '2026-09-01'

// Builds one cultivation request from a fresh estimate, so the very same body can be sent
// twice under one Idempotency-Key.
async function cultivationBody(client, token, stockedOn) {
  const [species, environment] = await Promise.all([
    findSpecies(client, 'Tilapia'),
    findEnvironment(client, 'POND'),
  ])
  const estimate = expectEnvelope(
    await client.post('/stocking-estimates').set('Authorization', bearer(token)).send({
      speciesId: species.id,
      environmentId: environment.id,
      dimensions: POND_DIMENSIONS,
      plannedFingerlings: 500,
    }),
  )
  return {
    estimateId: estimate.estimateId,
    speciesId: species.id,
    environmentId: environment.id,
    dimensions: POND_DIMENSIONS,
    initialFingerlings: 500,
    stockedOn,
  }
}

export function registerTierContract(client) {
  describe('plans and account tier', () => {
    it('lists the plans from Free upward with their limits, prices and entitlements', async () => {
      const { accessToken } = await registerAccount(client, 'Plan Reader')

      const plans = expectPage(await client.get('/tiers').set('Authorization', bearer(accessToken)))

      expect(plans.map((plan) => [plan.code, plan.cultureSystemLimit])).toEqual([
        ['FREE', 1],
        ['PRO', 10],
        ['ORGANIZATION', 100],
      ])
      const [free, pro, organization] = plans
      expect(free).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        price: { amountMinor: 0, currency: 'PHP' },
        billingPeriod: 'MONTH',
      })
      expect(pro).toMatchObject({ price: null, billingPeriod: null })
      expect(organization.price).toEqual({ amountMinor: expect.any(Number), currency: 'PHP' })
      for (const plan of plans) {
        expect(plan.entitlements.length).toBeGreaterThan(0)
        expect(plan.entitlements[0]).toEqual({
          code: expect.any(String),
          label: expect.any(String),
        })
      }
      const codesOf = (plan) => plan.entitlements.map((entitlement) => entitlement.code)
      expect(codesOf(free)).not.toContain('WATER_PARAMETER_LOGS')
      expect(codesOf(pro)).toEqual(
        expect.arrayContaining([...codesOf(free), 'WATER_PARAMETER_LOGS']),
      )

      expectError(await client.get('/tiers'), 401, 'AUTH_REQUIRED')
    })

    it('starts a new account on Free with room for one culture system', async () => {
      const { accessToken } = await registerAccount(client, 'Free Starter')

      const tier = expectEnvelope(
        await client.get('/users/me/tier').set('Authorization', bearer(accessToken)),
      )

      expect(tier).toMatchObject({
        plan: { code: 'FREE', cultureSystemLimit: 1 },
        activeCultureSystems: 0,
        remainingCultureSystems: 1,
        pendingUpgradeRequest: null,
      })
      expectError(await client.get('/users/me/tier'), 401, 'AUTH_REQUIRED')
    })

    it('keeps the demo farmer on a plan that fits both active cultivations', async () => {
      const { accessToken } = await signInAsDemo(client)

      const tier = expectEnvelope(
        await client.get('/users/me/tier').set('Authorization', bearer(accessToken)),
      )

      expect(tier.plan.code).toBe('PRO')
      expect(tier.activeCultureSystems).toBeGreaterThanOrEqual(1)
      expect(tier.activeCultureSystems).toBeLessThanOrEqual(tier.plan.cultureSystemLimit)
      expect(tier.remainingCultureSystems).toBe(
        tier.plan.cultureSystemLimit - tier.activeCultureSystems,
      )
    })

    it("refuses a Free account's second active cultivation until the first is harvested", async () => {
      const { accessToken } = await registerAccount(client, 'Limit Tester')
      const auth = bearer(accessToken)
      const body = await cultivationBody(client, accessToken, STOCKING_DAY)
      const key = idempotencyKey('first-culture-system')
      const first = expectEnvelope(
        await client
          .post('/cultivations')
          .set('Authorization', auth)
          .set('Idempotency-Key', key)
          .send(body),
        201,
      )

      const full = expectEnvelope(await client.get('/users/me/tier').set('Authorization', auth))
      expect(full).toMatchObject({ activeCultureSystems: 1, remainingCultureSystems: 0 })

      const refused = expectError(
        await requestCultivation(client, accessToken),
        403,
        'TIER_LIMIT_REACHED',
      )
      expect(refused.message).toEqual(expect.any(String))
      expect(refused.fields).toBeNull()
      expect(refused.details).toEqual({
        tier: 'FREE',
        cultureSystemLimit: 1,
        activeCultureSystems: 1,
      })

      const replay = expectEnvelope(
        await client
          .post('/cultivations')
          .set('Authorization', auth)
          .set('Idempotency-Key', key)
          .send(body),
        201,
      )
      expect(replay.id).toBe(first.id)

      const harvest = await client
        .post(`/cultivations/${first.id}/harvest`)
        .set('Authorization', auth)
        .set('Idempotency-Key', idempotencyKey('limit-harvest'))
        .send({
          harvestDate: SEED_DAY,
          numberHarvested: 450,
          totalHarvestWeight: { value: 150, unit: 'KG' },
          averageFishWeight: { value: 333, unit: 'G' },
          sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' },
          notes: null,
        })
      expectEnvelope(harvest, 201)

      const freed = expectEnvelope(await client.get('/users/me/tier').set('Authorization', auth))
      expect(freed).toMatchObject({ activeCultureSystems: 0, remainingCultureSystems: 1 })
      expectEnvelope(await requestCultivation(client, accessToken), 201)
    })

    it('records one upgrade request at a time and keeps the current plan meanwhile', async () => {
      const { accessToken } = await registerAccount(client, 'Upgrade Requester')
      const auth = bearer(accessToken)
      const ask = (body) =>
        client.post('/users/me/tier/upgrade-requests').set('Authorization', auth).send(body)

      for (const requestedTier of ['FREE', 'GOLD', undefined]) {
        const invalid = expectError(await ask({ requestedTier }), 422, 'VALIDATION_ERROR')
        expect(invalid.fields, String(requestedTier)).toHaveProperty('requestedTier')
      }
      const longNote = expectError(
        await ask({ requestedTier: 'PRO', note: 'x'.repeat(501) }),
        422,
        'VALIDATION_ERROR',
      )
      expect(longNote.fields).toHaveProperty('note')

      const created = expectEnvelope(
        await ask({ requestedTier: 'PRO', note: '  Two more ponds next season.  ' }),
        201,
      )
      expect(created).toEqual({
        id: expect.any(String),
        currentTier: 'FREE',
        requestedTier: 'PRO',
        status: 'PENDING',
        note: 'Two more ponds next season.',
        createdAt: expect.any(String),
      })

      const tier = expectEnvelope(await client.get('/users/me/tier').set('Authorization', auth))
      expect(tier.plan.code).toBe('FREE')
      expect(tier.pendingUpgradeRequest).toEqual(created)

      const second = expectError(await ask({ requestedTier: 'ORGANIZATION' }), 409, 'CONFLICT')
      expect(second.details).toEqual({ pendingRequestId: created.id, requestedTier: 'PRO' })
    })
  })
}
