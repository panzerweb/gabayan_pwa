import { z } from 'zod'

import { formatPhp } from '@core/utils/format'
import { moneySchema } from '@pages/marketplace/domain/marketplace.model'

// Plans from the smallest upward; a plan's place here is its rank.
export const TIER_CODES = ['FREE', 'PRO', 'ORGANIZATION'] as const

export const UPGRADE_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'DECLINED'] as const

// The error code `POST /cultivations` answers when the plan has no room left.
export const TIER_LIMIT_REACHED = 'TIER_LIMIT_REACHED'

export const TIER_OFFLINE_MESSAGE =
  'You’re offline. Reconnect to send your plan request. It will not be queued.'

export const tierCodeSchema = z.enum(TIER_CODES)

// Entitlement codes are kept open: a plan may list one this client has no screen for yet.
export const tierEntitlementSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
})

export const tierPlanSchema = z.object({
  code: tierCodeSchema,
  name: z.string().min(1),
  description: z.string(),
  cultureSystemLimit: z.number().int().positive(),
  price: moneySchema.nullable(),
  billingPeriod: z.literal('MONTH').nullable(),
  entitlements: z.array(tierEntitlementSchema),
})

export const upgradeRequestSchema = z.object({
  id: z.string().min(1),
  currentTier: tierCodeSchema,
  requestedTier: tierCodeSchema,
  status: z.enum(UPGRADE_REQUEST_STATUSES),
  note: z.string().nullable(),
  createdAt: z.string(),
})

export const accountTierSchema = z.object({
  plan: tierPlanSchema,
  activeCultureSystems: z.number().int().nonnegative(),
  remainingCultureSystems: z.number().int().nonnegative(),
  pendingUpgradeRequest: upgradeRequestSchema.nullable(),
})

// `details` of a 403 TIER_LIMIT_REACHED answer.
export const tierLimitDetailsSchema = z.object({
  tier: tierCodeSchema,
  cultureSystemLimit: z.number().int().positive(),
  activeCultureSystems: z.number().int().nonnegative(),
})

// `details` of the 403 FORBIDDEN a plan-gated route answers an account below its plan
// (contract §6 "Plan-gated routes").
export const tierRequiredDetailsSchema = z.object({
  requiredTier: tierCodeSchema,
  currentTier: tierCodeSchema,
})

// The plan a failed request needed, or null when the failure was not a plan refusal.
export function requiredTierOf(failure: unknown): TierCode | null {
  if (typeof failure !== 'object' || failure === null) return null
  const { status, code, details } = failure as Record<string, unknown>
  if (status !== 403 || code !== 'FORBIDDEN') return null
  const parsed = tierRequiredDetailsSchema.safeParse(details)
  return parsed.success ? parsed.data.requiredTier : null
}

export type TierCode = z.infer<typeof tierCodeSchema>
export type TierEntitlement = z.infer<typeof tierEntitlementSchema>
export type TierPlan = z.infer<typeof tierPlanSchema>
export type UpgradeRequest = z.infer<typeof upgradeRequestSchema>
export type AccountTier = z.infer<typeof accountTierSchema>
export type TierLimitDetails = z.infer<typeof tierLimitDetailsSchema>

export interface CreateUpgradeRequest {
  requestedTier: TierCode
  note?: string | null
}

export function tierRank(code: TierCode) {
  return TIER_CODES.indexOf(code)
}

// True when an account on `current` may open a screen that needs `required`.
export function meetsTier(current: TierCode, required: TierCode) {
  return tierRank(current) >= tierRank(required)
}

export function isTierCode(value: unknown): value is TierCode {
  return tierCodeSchema.safeParse(value).success
}

// "PHP 0.00 / month", or the plain statement that a plan has no price yet.
export function planPriceLabel(plan: TierPlan) {
  if (!plan.price) return 'Pricing coming soon'
  const amount = formatPhp(plan.price.amountMinor)
  return plan.billingPeriod === 'MONTH' ? `${amount} / month` : amount
}

export function cultureSystemLimitLabel(limit: number) {
  return limit === 1 ? '1 culture system' : `Up to ${limit} culture systems`
}

// "1 of 10 culture systems in use"
export function cultureSystemUsageLabel(tier: AccountTier) {
  const limit = tier.plan.cultureSystemLimit
  return `${tier.activeCultureSystems} of ${limit} culture ${limit === 1 ? 'system' : 'systems'} in use`
}

export function tierName(code: TierCode, plans: readonly TierPlan[] = []) {
  const fallback: Record<TierCode, string> = {
    FREE: 'Free',
    PRO: 'Pro',
    ORGANIZATION: 'Organization',
  }
  return plans.find((plan) => plan.code === code)?.name ?? fallback[code]
}
