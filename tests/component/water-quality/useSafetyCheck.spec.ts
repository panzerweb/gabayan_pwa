import { ref } from 'vue'

import type { WaterQualityRepository } from '@pages/water-quality/domain/water-quality.repository.interface'
import { useSafetyCheck } from '@pages/water-quality/presentation/composables/useSafetyCheck'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { highAmmoniaCheck } from '../../unit/water-quality/fixtures'
import { apiError, goOffline, mountComposable } from '../support/app'

async function mountSafetyCheck(createWaterSafetyCheck: ReturnType<typeof vi.fn>) {
  return mountComposable(
    () =>
      useSafetyCheck(ref('sp_tilapia'), ref('env_pond'), {
        createWaterSafetyCheck,
      } as unknown as WaterQualityRepository),
    { name: ROUTE_NAMES.cultivationDetail, params: { cultivationId: 'cul_tilapia_001' } },
  )
}

describe('useSafetyCheck', () => {
  it('sends the entered readings for the species and culture system and keeps the answer', async () => {
    const createWaterSafetyCheck = vi.fn().mockResolvedValue(envelope(highAmmoniaCheck))
    const { result } = await mountSafetyCheck(createWaterSafetyCheck)
    result.form.AMMONIA = '1.2'
    result.form.PH = '7.2'

    expect(await result.submit()).toBe(true)

    expect(createWaterSafetyCheck).toHaveBeenCalledWith(
      {
        speciesId: 'sp_tilapia',
        environmentId: 'env_pond',
        readings: { ph: 7.2, ammoniaMgL: 1.2 },
      },
      'access_1',
    )
    expect(result.result.value?.results[1]?.status).toBe('ABOVE_RANGE')
  })

  it('keeps an invalid reading on the form without asking the server', async () => {
    const createWaterSafetyCheck = vi.fn()
    const { result } = await mountSafetyCheck(createWaterSafetyCheck)
    result.form.PH = '15'

    expect(await result.submit()).toBe(false)

    expect(createWaterSafetyCheck).not.toHaveBeenCalled()
    expect(result.fieldErrors.value).toEqual({ 'readings.ph': 'Enter a number from 0 to 14.' })
  })

  it('binds the server field messages and explains the refusal', async () => {
    const createWaterSafetyCheck = vi.fn().mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Review the readings.', {
        'readings.ammoniaMgL': ['Enter a number from 0 to 50.'],
      }),
    )
    const { result } = await mountSafetyCheck(createWaterSafetyCheck)
    result.form.AMMONIA = '2'

    expect(await result.submit()).toBe(false)

    expect(result.fieldErrors.value).toEqual({
      'readings.ammoniaMgL': 'Enter a number from 0 to 50.',
    })
    expect(result.formError.value).toBe(
      'Some details need a second look. Check the highlighted fields.',
    )
  })

  it('sends nothing while offline and says nothing is queued', async () => {
    goOffline()
    const createWaterSafetyCheck = vi.fn()
    const { result } = await mountSafetyCheck(createWaterSafetyCheck)
    result.form.AMMONIA = '1.2'

    expect(await result.submit()).toBe(false)

    expect(createWaterSafetyCheck).not.toHaveBeenCalled()
    expect(result.formError.value).toMatch(/offline.*Nothing is saved or queued/)
  })

  it('clears the readings and the last answer for a new check', async () => {
    const createWaterSafetyCheck = vi.fn().mockResolvedValue(envelope(highAmmoniaCheck))
    const { result } = await mountSafetyCheck(createWaterSafetyCheck)
    result.form.AMMONIA = '1.2'
    await result.submit()

    result.reset()

    expect(result.form.AMMONIA).toBe('')
    expect(result.result.value).toBeNull()
  })
})
