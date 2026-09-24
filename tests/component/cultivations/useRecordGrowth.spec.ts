import { ref } from 'vue'

import type { CultivationsRepository } from '@pages/cultivations/domain/cultivations.repository.interface'
import { useRecordGrowth } from '@pages/cultivations/presentation/composables/useRecordGrowth'
import { ROUTE_NAMES } from '@router/route-names'

import { growthResult } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { mountComposable } from '../support/app'

function stubRepository() {
  return { createGrowthMeasurement: vi.fn().mockResolvedValue(envelope(growthResult)) }
}

async function mountGrowth(repository: ReturnType<typeof stubRepository>) {
  const mounted = await mountComposable(
    () => useRecordGrowth(ref('cul_tilapia_001'), repository as unknown as CultivationsRepository),
    { name: ROUTE_NAMES.cultivationGrowth, params: { cultivationId: 'cul_tilapia_001' } },
  )
  mounted.result.begin()
  mounted.result.form.averageWeight = '200'
  return mounted
}

function keysSent(create: ReturnType<typeof vi.fn>) {
  return create.mock.calls.map((call) => call[2] as string)
}

describe('useRecordGrowth', () => {
  it('starts each record from today’s date and a sample of 10 fish', async () => {
    const { result } = await mountGrowth(stubRepository())

    expect(result.form.measuredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.form.numberOfFishSampled).toBe('10')
  })

  it('invalidates detail, growth, feed plan, readiness and Home through the @core/query map', async () => {
    const { result, queryClient } = await mountGrowth(stubRepository())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    expect(await result.submit()).toBe(true)

    for (const queryKey of [
      ['cultivations', 'detail'],
      ['cultivations', 'growth'],
      ['cultivations', 'feeding-plan'],
      ['cultivations', 'harvest-readiness'],
      ['home'],
      ['home-dashboard'],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey })
    }
  })

  it('reuses one Idempotency-Key when the same submission is retried', async () => {
    const repository = stubRepository()
    repository.createGrowthMeasurement
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(envelope(growthResult))
    const { result } = await mountGrowth(repository)

    expect(await result.submit()).toBe(false)
    expect(result.formError.value).not.toBe('')
    expect(await result.submit()).toBe(true)

    const [first, second] = keysSent(repository.createGrowthMeasurement)
    expect(second).toBe(first)
  })

  it('gives the next record its own Idempotency-Key', async () => {
    const repository = stubRepository()
    const { result } = await mountGrowth(repository)

    await result.submit()
    result.begin()
    result.form.averageWeight = '210'
    await result.submit()

    const [first, second] = keysSent(repository.createGrowthMeasurement)
    expect(second).not.toBe(first)
  })

  it('sends nothing while offline and says the record was not queued', async () => {
    const repository = stubRepository()
    const { result } = await mountGrowth(repository)

    result.isOnline.value = false
    expect(await result.submit()).toBe(false)

    expect(result.formError.value).toBe(
      'Reconnect before saving this growth record. It has not been queued.',
    )
    expect(repository.createGrowthMeasurement).not.toHaveBeenCalled()
  })
})
