import { ApiError } from '@core/http'
import { requiredTierOf } from '@pages/tiers/domain/tiers.model'

function refusal(status: number, code: string, details: unknown) {
  return new ApiError(status, {
    code,
    message: 'This needs the Pro plan. See the plans to ask for it.',
    fields: null,
    details,
    requestId: 'req_1',
  })
}

describe('plan refusal', () => {
  it('reads the plan a plan-gated route asked for', () => {
    const error = refusal(403, 'FORBIDDEN', { requiredTier: 'PRO', currentTier: 'FREE' })

    expect(requiredTierOf(error)).toBe('PRO')
  })

  it('is not a plan refusal without the plan codes, or for another status or code', () => {
    expect(requiredTierOf(refusal(403, 'FORBIDDEN', null))).toBeNull()
    expect(
      requiredTierOf(
        refusal(403, 'TIER_LIMIT_REACHED', { requiredTier: 'PRO', currentTier: 'FREE' }),
      ),
    ).toBeNull()
    expect(
      requiredTierOf(refusal(404, 'FORBIDDEN', { requiredTier: 'PRO', currentTier: 'FREE' })),
    ).toBeNull()
    expect(requiredTierOf(new TypeError('Failed to fetch'))).toBeNull()
    expect(requiredTierOf(null)).toBeNull()
  })
})
