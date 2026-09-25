import type { AccountTier, TierPlan, UpgradeRequest } from '@pages/tiers/domain/tiers.model'

export const meta = { requestId: 'req_1' }
export const pageInfo = { cursor: null, nextCursor: null, limit: 20, total: 3 }

const freeEntitlements = [
  { code: 'CULTIVATION_GUIDANCE', label: 'Daily cultivation guidance and farm records' },
  { code: 'STOCKING_CALCULATOR', label: 'Pond size and stocking calculator' },
  { code: 'MARKETPLACE', label: 'Marketplace for tools and feeds' },
]
const proEntitlements = [
  ...freeEntitlements,
  { code: 'WATER_PARAMETER_LOGS', label: 'Saved water readings with history' },
]

export const freePlan: TierPlan = {
  code: 'FREE',
  name: 'Free',
  description: 'For a first pond, cage or tank: one culture system with general guidance.',
  cultureSystemLimit: 1,
  price: { amountMinor: 0, currency: 'PHP' },
  billingPeriod: 'MONTH',
  entitlements: freeEntitlements,
}

export const proPlan: TierPlan = {
  code: 'PRO',
  name: 'Pro',
  description: 'For growers with several ponds or cages who want to keep their own water readings.',
  cultureSystemLimit: 10,
  price: null,
  billingPeriod: null,
  entitlements: proEntitlements,
}

export const organizationPlan: TierPlan = {
  code: 'ORGANIZATION',
  name: 'Organization',
  description:
    'For cooperatives, companies and government programmes that manage many culture systems.',
  cultureSystemLimit: 100,
  price: { amountMinor: 499900, currency: 'PHP' },
  billingPeriod: 'MONTH',
  entitlements: proEntitlements,
}

export const plans = [freePlan, proPlan, organizationPlan]

export const proRequest: UpgradeRequest = {
  id: 'upg_0001',
  currentTier: 'FREE',
  requestedTier: 'PRO',
  status: 'PENDING',
  note: null,
  createdAt: '2026-09-23T02:00:00Z',
}

export function accountTier(overrides: Partial<AccountTier> = {}): AccountTier {
  return {
    plan: freePlan,
    activeCultureSystems: 1,
    remainingCultureSystems: 0,
    pendingUpgradeRequest: null,
    ...overrides,
  }
}
