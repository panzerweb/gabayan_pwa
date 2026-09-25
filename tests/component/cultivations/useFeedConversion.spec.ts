import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

import type { CultivationsRepository } from '@pages/cultivations/domain/cultivations.repository.interface'
import { useFeedConversion } from '@pages/cultivations/presentation/composables/useFeedConversion'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001Conversion } from '../../unit/cultivations/feed-conversion-fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountComposable } from '../support/app'

async function mountConversion(getFeedConversion: ReturnType<typeof vi.fn>) {
  const mounted = await mountComposable(
    () =>
      useFeedConversion(ref('cul_tilapia_001'), {
        getFeedConversion,
      } as unknown as CultivationsRepository),
    { name: ROUTE_NAMES.cultivationDetail, params: { cultivationId: 'cul_tilapia_001' } },
  )
  await flushPromises()
  return mounted
}

describe('useFeedConversion', () => {
  it("reads the cultivation's feed conversion under its own query key", async () => {
    const getFeedConversion = vi.fn().mockResolvedValue(envelope(batch001Conversion))
    const { result, queryClient } = await mountConversion(getFeedConversion)

    expect(getFeedConversion).toHaveBeenCalledWith('cul_tilapia_001', 'access_1')
    expect(result.conversion.value?.ratio).toBe(1.37)
    expect(
      queryClient.getQueryData(['cultivations', 'feed-conversion', 'cul_tilapia_001']),
    ).toBeDefined()
  })

  it('tells a plan refusal apart from a failure worth retrying', async () => {
    const refusal = apiError(403, 'FORBIDDEN', 'This needs the Pro plan.')
    Object.assign(refusal, { details: { requiredTier: 'PRO', currentTier: 'FREE' } })
    const refused = await mountConversion(vi.fn().mockRejectedValue(refusal))
    expect(refused.result.requiredTier.value).toBe('PRO')
    expect(refused.result.loadFailed.value).toBe(false)

    const failed = await mountConversion(vi.fn().mockRejectedValue(new TypeError('Failed')))
    expect(failed.result.requiredTier.value).toBeNull()
    expect(failed.result.loadFailed.value).toBe(true)
  })
})
