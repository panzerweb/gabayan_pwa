import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

import type { FeedsRepository } from '@pages/feeds/domain/feeds.repository.interface'
import { useFeedGuide } from '@pages/feeds/presentation/composables/useFeedGuide'
import { ROUTE_NAMES } from '@router/route-names'

import { tilapiaFeedGuide } from '../../unit/feeds/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountComposable } from '../support/app'

async function mountGuide(
  getFeedGuide: ReturnType<typeof vi.fn>,
  speciesId = 'sp_tilapia',
  growthStageCode: string | null = 'GROWING',
) {
  const stage = ref(growthStageCode)
  const mounted = await mountComposable(
    () => useFeedGuide(ref(speciesId), stage, { getFeedGuide } as unknown as FeedsRepository),
    { name: ROUTE_NAMES.cultivationRecords, params: { cultivationId: 'cul_tilapia_001' } },
  )
  await flushPromises()
  return { ...mounted, stage }
}

describe('useFeedGuide', () => {
  it('reads the species’ guide and picks the stage the cultivation is in', async () => {
    const getFeedGuide = vi.fn().mockResolvedValue(envelope(tilapiaFeedGuide))

    const { result, stage } = await mountGuide(getFeedGuide)

    expect(getFeedGuide).toHaveBeenCalledWith('sp_tilapia', 'access_1')
    expect(result.guide.value?.stages).toHaveLength(2)
    expect(result.currentStage.value?.feedType).toBe('Tilapia grower pellets, floating')

    stage.value = 'PRE_HARVEST'
    expect(result.currentStage.value?.feedType).toBe('Tilapia finisher pellets, floating')
    stage.value = 'PLANNING'
    expect(result.currentStage.value).toBeNull()
  })

  it('asks nothing until a species is known', async () => {
    const getFeedGuide = vi.fn()

    const { result } = await mountGuide(getFeedGuide, '')

    expect(getFeedGuide).not.toHaveBeenCalled()
    expect(result.loading.value).toBe(false)
    expect(result.guide.value).toBeNull()
  })

  it('reports a species without a guide as not found rather than a failure to retry', async () => {
    const getFeedGuide = vi
      .fn()
      .mockRejectedValue(
        apiError(404, 'NOT_FOUND', 'No feed guide is available for this fish yet.'),
      )

    const { result } = await mountGuide(getFeedGuide)

    expect(result.notFound.value).toBe(true)
    expect(result.loadFailed.value).toBe(false)
  })

  it('reports any other failure so the screen can offer a retry', async () => {
    const getFeedGuide = vi.fn().mockRejectedValue(apiError(503, 'SERVICE_UNAVAILABLE', 'Down'))

    const { result } = await mountGuide(getFeedGuide)

    expect(result.loadFailed.value).toBe(true)
    expect(result.notFound.value).toBe(false)
  })
})
