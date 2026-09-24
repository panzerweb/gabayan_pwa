import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

import type { WaterQualityRepository } from '@pages/water-quality/domain/water-quality.repository.interface'
import { useWaterThresholds } from '@pages/water-quality/presentation/composables/useWaterThresholds'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { tilapiaPondThresholds } from '../../unit/water-quality/fixtures'
import { apiError, mountComposable } from '../support/app'

async function mountThresholds(
  getWaterThresholds: ReturnType<typeof vi.fn>,
  environmentId = 'env_pond',
) {
  const environment = ref(environmentId)
  const mounted = await mountComposable(
    () =>
      useWaterThresholds(ref('sp_tilapia'), environment, {
        getWaterThresholds,
      } as unknown as WaterQualityRepository),
    { name: ROUTE_NAMES.setupEnvironment },
  )
  await flushPromises()
  return { ...mounted, environment }
}

describe('useWaterThresholds', () => {
  it('reads the ranges of the chosen species and culture system', async () => {
    const getWaterThresholds = vi.fn().mockResolvedValue(envelope(tilapiaPondThresholds))

    const { result } = await mountThresholds(getWaterThresholds)

    expect(getWaterThresholds).toHaveBeenCalledWith('sp_tilapia', 'env_pond', 'access_1')
    expect(result.thresholdSet.value?.thresholds).toHaveLength(7)
    expect(result.loading.value).toBe(false)
  })

  it('asks nothing until a culture system is chosen', async () => {
    const getWaterThresholds = vi.fn()

    const { result } = await mountThresholds(getWaterThresholds, '')

    expect(getWaterThresholds).not.toHaveBeenCalled()
    expect(result.thresholdSet.value).toBeNull()
    expect(result.loading.value).toBe(false)
  })

  it('returns the compatibility message of a pairing that has no ranges instead of a failure', async () => {
    const getWaterThresholds = vi
      .fn()
      .mockRejectedValue(
        apiError(400, 'INCOMPATIBLE_SELECTION', 'Shrimp are not advised for a fish cage.'),
      )

    const { result } = await mountThresholds(getWaterThresholds)

    expect(result.incompatibleMessage.value).toBe('Shrimp are not advised for a fish cage.')
    expect(result.loadFailed.value).toBe(false)
  })

  it('reports any other failure so the screen can offer a retry', async () => {
    const getWaterThresholds = vi.fn().mockRejectedValue(new TypeError('network'))

    const { result } = await mountThresholds(getWaterThresholds)

    expect(result.loadFailed.value).toBe(true)
    expect(result.incompatibleMessage.value).toBeNull()
  })
})
