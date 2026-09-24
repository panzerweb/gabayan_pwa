import { flushPromises } from '@vue/test-utils'

import CultivationGrowthView from '@pages/cultivations/presentation/views/CultivationGrowthView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { growthResult, growthSamples } from '../../unit/cultivations/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { apiError, goOffline, mountInApp } from '../support/app'
import { button, labelled, submitButton } from './support'

const repositories = vi.hoisted(() => ({
  cultivations: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  get cultivationsRepository() {
    return repositories.cultivations
  },
}))

beforeEach(() => {
  repositories.cultivations = {
    listGrowthMeasurements: vi.fn().mockResolvedValue(page(growthSamples)),
    createGrowthMeasurement: vi.fn().mockResolvedValue(envelope(growthResult)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function open() {
  const mounted = await mountInApp(CultivationGrowthView, {
    name: ROUTE_NAMES.cultivationGrowth,
    params: { cultivationId: 'cul_tilapia_001' },
  })
  await flushPromises()
  return mounted
}

describe('CultivationGrowthView', () => {
  it('charts the cultivation’s growth samples', async () => {
    const { wrapper } = await open()

    expect(repositories.cultivations.listGrowthMeasurements).toHaveBeenCalledWith(
      'cul_tilapia_001',
      'access_1',
    )
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('2 measurements')
    expect(wrapper.text()).toContain('180 g')
    expect(wrapper.text()).toContain('not a scientific')
  })

  it('goes back to the cultivation by route name', async () => {
    const { wrapper } = await open()

    expect(wrapper.get('a[aria-label="Go back"]').attributes('href')).toBe(
      '/app/cultivations/cul_tilapia_001',
    )
  })

  it('offers a retry when the samples cannot load', async () => {
    repositories.cultivations.listGrowthMeasurements!.mockRejectedValueOnce(
      apiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
    )
    const { wrapper } = await open()

    await button(wrapper, 'Try Again').trigger('click')
    await flushPromises()

    expect(wrapper.find('svg[role="img"]').exists()).toBe(true)
  })

  it('labels the growth form and stops a blank weight before sending', async () => {
    const { wrapper } = await open()
    await button(wrapper, 'Add record').trigger('click')

    expect(labelled(wrapper, 'Measurement date').attributes('type')).toBe('date')
    expect(labelled(wrapper, 'Fish sampled').attributes('inputmode')).toBe('numeric')
    expect(labelled(wrapper, 'Average fish weight').attributes('inputmode')).toBe('decimal')
    expect(wrapper.text()).toContain('Notes (optional)')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter an average weight greater than 0.')
    expect(labelled(wrapper, 'Average fish weight').attributes('aria-invalid')).toBe('true')
    expect(repositories.cultivations.createGrowthMeasurement).not.toHaveBeenCalled()
  })

  it('saves a sample in grams and closes the sheet', async () => {
    const { wrapper, toast } = await open()
    await button(wrapper, 'Add record').trigger('click')

    await labelled(wrapper, 'Fish sampled').setValue('12')
    await labelled(wrapper, 'Average fish weight').setValue('200')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [cultivationId, body, key, token] =
      repositories.cultivations.createGrowthMeasurement!.mock.calls[0]!
    expect(cultivationId).toBe('cul_tilapia_001')
    expect(body).toMatchObject({
      numberOfFishSampled: 12,
      averageWeight: { value: 200, unit: 'G' },
      notes: null,
    })
    expect(key).toEqual(expect.any(String))
    expect(token).toBe('access_1')
    expect(toast.messages.map((item) => item.message)).toContain('Growth record saved.')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows the server’s field message beside its input', async () => {
    repositories.cultivations.createGrowthMeasurement!.mockRejectedValueOnce(
      apiError(422, 'VALIDATION_ERROR', 'Review the growth record.', {
        numberOfFishSampled: ['Enter a sample size greater than 0.'],
      }),
    )
    const { wrapper } = await open()
    await button(wrapper, 'Add record').trigger('click')
    await labelled(wrapper, 'Average fish weight').setValue('200')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter a sample size greater than 0.')
    expect(labelled(wrapper, 'Fish sampled').attributes('aria-invalid')).toBe('true')
  })

  it('keeps the form disabled offline and says the record will not be queued', async () => {
    goOffline()
    const { wrapper } = await open()
    await button(wrapper, 'Add record').trigger('click')

    expect(wrapper.text()).toContain('Reconnect to save this growth record; it will not be queued.')
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
