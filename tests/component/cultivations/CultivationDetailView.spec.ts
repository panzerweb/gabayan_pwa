import { flushPromises, type VueWrapper } from '@vue/test-utils'

import CultivationDetailView from '@pages/cultivations/presentation/views/CultivationDetailView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001Detail, timeline } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountInApp } from '../support/app'

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
    getCultivation: vi.fn().mockResolvedValue(envelope(batch001Detail)),
    getCultivationTimeline: vi.fn().mockResolvedValue(envelope(timeline)),
  }
})

function sectionButton(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('[aria-label="Cultivation sections"] button')
    .find((button) => button.text() === label)
  if (!found) throw new Error(`No section "${label}"`)
  return found
}

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(CultivationDetailView, {
    name: ROUTE_NAMES.cultivationDetail,
    params: { cultivationId: 'cul_tilapia_001' },
    query,
  })
  await flushPromises()
  return mounted
}

describe('CultivationDetailView', () => {
  it('shows the stock, feeding and harvest summaries with the estimate notice', async () => {
    const { wrapper } = await open()

    expect(repositories.cultivations.getCultivation).toHaveBeenCalledWith(
      'cul_tilapia_001',
      'access_1',
    )
    const stock = wrapper.get('[aria-label="Stock"]').text()
    expect(stock).toContain('485')
    expect(stock).toContain('15 mortality recorded')
    expect(stock).toContain('180 g')
    const feeding = wrapper.get('[aria-label="Feeding"]').text()
    expect(feeding).toContain('2.4 kg')
    expect(feeding).toContain('2 feedings per day')
    const harvest = wrapper.get('.harvest-summary').text()
    expect(harvest).toContain('Keep monitoring')
    expect(harvest).toContain('350 g')
    expect(harvest).toContain('Weigh a fresh sample before deciding to harvest.')
    expect(wrapper.get('.disclaimer').text()).toContain('demo estimates')
  })

  it('links the tasks, records and harvest screens by route name', async () => {
    const { wrapper } = await open()

    for (const path of ['tasks', 'growth', 'records', 'harvest']) {
      expect(wrapper.find(`a[href="/app/cultivations/cul_tilapia_001/${path}"]`).exists()).toBe(
        true,
      )
    }
  })

  it('fetches the timeline only once its section is chosen, and keeps that choice in the query', async () => {
    const { wrapper, router } = await open()
    expect(repositories.cultivations.getCultivationTimeline).not.toHaveBeenCalled()

    await sectionButton(wrapper, 'Timeline').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ section: 'timeline' })
    expect(sectionButton(wrapper, 'Timeline').attributes('aria-current')).toBe('page')
    expect(repositories.cultivations.getCultivationTimeline).toHaveBeenCalledWith(
      'cul_tilapia_001',
      'access_1',
    )
    expect(wrapper.text()).toContain('Estimated harvest window')
    expect(wrapper.find('[aria-label="Stock"]').exists()).toBe(false)
  })

  it('opens on the timeline a shared link names', async () => {
    const { wrapper } = await open({ section: 'timeline' })

    expect(wrapper.findAll('.timeline li')).toHaveLength(3)
  })

  it('offers a retry when the cultivation cannot load', async () => {
    repositories.cultivations.getCultivation!.mockRejectedValueOnce(
      apiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
    )
    const { wrapper } = await open()

    const retry = wrapper.findAll('button').find((button) => button.text() === 'Try Again')
    await retry!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[aria-label="Stock"]').exists()).toBe(true)
  })
})
