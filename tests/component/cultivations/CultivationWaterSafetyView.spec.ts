import { flushPromises } from '@vue/test-utils'

import CultivationWaterSafetyView from '@pages/cultivations/presentation/views/CultivationWaterSafetyView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001Detail } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { highAmmoniaCheck, tilapiaPondThresholds } from '../../unit/water-quality/fixtures'
import { goOffline, mountInApp } from '../support/app'
import { button, labelled, submitButton } from './support'

const repositories = vi.hoisted(() => ({
  cultivations: {} as Record<string, ReturnType<typeof vi.fn>>,
  waterQuality: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  get cultivationsRepository() {
    return repositories.cultivations
  },
}))

vi.mock('@pages/water-quality/data/water-quality.repository', () => ({
  get waterQualityRepository() {
    return repositories.waterQuality
  },
}))

beforeEach(() => {
  repositories.cultivations = {
    getCultivation: vi.fn().mockResolvedValue(envelope(batch001Detail)),
  }
  repositories.waterQuality = {
    getWaterThresholds: vi.fn().mockResolvedValue(envelope(tilapiaPondThresholds)),
    createWaterSafetyCheck: vi.fn().mockResolvedValue(envelope(highAmmoniaCheck)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function open() {
  const mounted = await mountInApp(CultivationWaterSafetyView, {
    name: ROUTE_NAMES.cultivationWaterSafety,
    params: { cultivationId: 'cul_tilapia_001' },
  })
  await flushPromises()
  return mounted
}

describe('CultivationWaterSafetyView', () => {
  it('checks the readings against the ranges of this cultivation’s species and culture system', async () => {
    const { wrapper } = await open()

    await labelled(wrapper, 'Ammonia (mg/L)').setValue('1.2')
    await labelled(wrapper, 'pH (scale 0–14)').setValue('7.2')
    await submitButton(wrapper).trigger('submit')
    await flushPromises()

    expect(repositories.waterQuality.getWaterThresholds).toHaveBeenCalledWith(
      batch001Detail.species.id,
      batch001Detail.environment.id,
      'access_1',
    )
    expect(repositories.waterQuality.createWaterSafetyCheck).toHaveBeenCalledWith(
      {
        speciesId: batch001Detail.species.id,
        environmentId: batch001Detail.environment.id,
        readings: { ph: 7.2, ammoniaMgL: 1.2 },
      },
      'access_1',
    )
    expect(wrapper.text()).toContain('Above range')
    expect(wrapper.text()).toContain('Ammonia is higher than suggested')
    expect(wrapper.text()).toContain('Demo figures, not yet reviewed')
  })

  it('says the check is not saved and that Pro keeps a history', async () => {
    const { wrapper } = await open()

    expect(wrapper.text()).toContain(
      'This check is not saved. Pro plans keep a history of your readings.',
    )
    expect(wrapper.get('a[href="/app/plans"]').text()).toBe('Compare plans')
  })

  it('keeps an out-of-range reading on the form with its message', async () => {
    const { wrapper } = await open()

    await labelled(wrapper, 'pH (scale 0–14)').setValue('15')
    await submitButton(wrapper).trigger('submit')
    await flushPromises()

    expect(repositories.waterQuality.createWaterSafetyCheck).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Enter a number from 0 to 14.')
  })

  it('starts a new check from the result', async () => {
    const { wrapper } = await open()
    await labelled(wrapper, 'Ammonia (mg/L)').setValue('1.2')
    await submitButton(wrapper).trigger('submit')
    await flushPromises()

    await button(wrapper, 'Check new readings').trigger('click')

    expect((labelled(wrapper, 'Ammonia (mg/L)').element as HTMLInputElement).value).toBe('')
  })

  it('explains that the check needs a connection while offline', async () => {
    goOffline()
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('You’re offline. Reconnect to check your readings.')
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
