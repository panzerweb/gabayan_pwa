import { flushPromises, type VueWrapper } from '@vue/test-utils'

import CultivationsView from '@pages/cultivations/presentation/views/CultivationsView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001, harvestedBatch } from '../../unit/cultivations/fixtures'
import { page } from '../../unit/marketplace/fixtures'
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
    listCultivations: vi.fn().mockResolvedValue(page([batch001, harvestedBatch])),
  }
})

function tab(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('[aria-label="Filter cultivations"] button')
    .find((button) => button.text() === label)
  if (!found) throw new Error(`No tab "${label}"`)
  return found
}

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(CultivationsView, { name: ROUTE_NAMES.cultivations, query })
  await flushPromises()
  return mounted
}

describe('CultivationsView', () => {
  it('lists each cultivation with its status in words and links it by name', async () => {
    const { wrapper } = await open()

    const cards = wrapper.findAll('.cultivation-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.text()).toContain('Tilapia Batch #001')
    expect(cards[0]?.text()).toContain('Growing')
    expect(cards[0]?.text()).toContain('485')
    expect(cards[1]?.text()).toContain('Completed')
    expect(wrapper.find('a[href="/app/cultivations/cul_tilapia_001"]').exists()).toBe(true)
    expect(repositories.cultivations.listCultivations).toHaveBeenCalledWith('access_1')
  })

  it('keeps the chosen tab in the route query and shows only those cultivations', async () => {
    const { wrapper, router } = await open()

    await tab(wrapper, 'Completed').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ view: 'completed' })
    expect(tab(wrapper, 'Completed').attributes('aria-current')).toBe('page')
    expect(wrapper.findAll('.cultivation-card').map((card) => card.text())).toEqual([
      expect.stringContaining('Tilapia Batch #000'),
    ])
  })

  it('offers guided setup when there is no active cultivation', async () => {
    repositories.cultivations.listCultivations!.mockResolvedValue(page([harvestedBatch]))
    const { wrapper } = await open({ view: 'active' })

    expect(wrapper.text()).toContain('No cultivations here')
    expect(wrapper.get('a[href="/setup"]').text()).toContain('Start cultivation')
  })

  it('offers a retry when the list cannot load', async () => {
    repositories.cultivations.listCultivations!.mockRejectedValueOnce(
      apiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
    )
    const { wrapper } = await open()

    const retry = wrapper.findAll('button').find((button) => button.text() === 'Try Again')
    expect(retry).toBeDefined()
    await retry!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.cultivation-card')).toHaveLength(2)
  })
})
