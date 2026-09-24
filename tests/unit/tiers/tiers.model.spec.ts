import {
  accountTierSchema,
  cultureSystemLimitLabel,
  cultureSystemUsageLabel,
  isTierCode,
  meetsTier,
  planPriceLabel,
  tierLimitDetailsSchema,
  tierName,
  tierPlanSchema,
} from '@pages/tiers/domain/tiers.model'

import { accountTier, freePlan, organizationPlan, plans, proPlan, proRequest } from './fixtures'

describe('tier plan schema', () => {
  it('reads a plan with a price, and one whose price is not set yet', () => {
    expect(tierPlanSchema.parse(freePlan)).toEqual(freePlan)
    expect(tierPlanSchema.parse(proPlan)).toMatchObject({ price: null, billingPeriod: null })
  })

  it('keeps an entitlement this client has no screen for yet', () => {
    const plan = {
      ...proPlan,
      entitlements: [{ code: 'AI_FRY_COUNTING', label: 'Camera fry counting' }],
    }

    expect(tierPlanSchema.parse(plan).entitlements[0]?.code).toBe('AI_FRY_COUNTING')
  })

  it('refuses a plan of an unknown tier or without a limit', () => {
    expect(tierPlanSchema.safeParse({ ...freePlan, code: 'GOLD' }).success).toBe(false)
    expect(tierPlanSchema.safeParse({ ...freePlan, cultureSystemLimit: 0 }).success).toBe(false)
  })

  it('reads an account tier with its pending request, ignoring fields it does not know', () => {
    const parsed = accountTierSchema.parse({
      ...accountTier({ pendingUpgradeRequest: proRequest }),
      since: '2026-09-01T00:00:00Z',
    })

    expect(parsed.pendingUpgradeRequest).toEqual(proRequest)
    expect(parsed).not.toHaveProperty('since')
  })

  it('reads the details of a culture-system limit refusal', () => {
    expect(
      tierLimitDetailsSchema.parse({
        tier: 'FREE',
        cultureSystemLimit: 1,
        activeCultureSystems: 1,
      }),
    ).toEqual({ tier: 'FREE', cultureSystemLimit: 1, activeCultureSystems: 1 })
  })
})

describe('tier helpers', () => {
  it('ranks Free below Pro below Organization', () => {
    expect(meetsTier('FREE', 'FREE')).toBe(true)
    expect(meetsTier('FREE', 'PRO')).toBe(false)
    expect(meetsTier('PRO', 'PRO')).toBe(true)
    expect(meetsTier('ORGANIZATION', 'PRO')).toBe(true)
    expect(meetsTier('PRO', 'ORGANIZATION')).toBe(false)
  })

  it('recognises only the three tier codes', () => {
    expect(isTierCode('PRO')).toBe(true)
    expect(isTierCode('pro')).toBe(false)
    expect(isTierCode(['PRO'])).toBe(false)
    expect(isTierCode(undefined)).toBe(false)
  })

  it('shows a monthly price in pesos and says so when a plan has none yet', () => {
    expect(planPriceLabel(freePlan)).toBe('₱0.00 / month')
    expect(planPriceLabel(organizationPlan)).toBe('₱4,999.00 / month')
    expect(planPriceLabel(proPlan)).toBe('Pricing coming soon')
  })

  it('describes the limit and how much of it is in use', () => {
    expect(cultureSystemLimitLabel(1)).toBe('1 culture system')
    expect(cultureSystemLimitLabel(10)).toBe('Up to 10 culture systems')
    expect(cultureSystemUsageLabel(accountTier())).toBe('1 of 1 culture system in use')
    expect(
      cultureSystemUsageLabel(
        accountTier({ plan: proPlan, activeCultureSystems: 2, remainingCultureSystems: 8 }),
      ),
    ).toBe('2 of 10 culture systems in use')
  })

  it('names a tier from the plans, falling back to its plain name', () => {
    expect(tierName('ORGANIZATION', plans)).toBe('Organization')
    expect(tierName('PRO')).toBe('Pro')
  })
})
