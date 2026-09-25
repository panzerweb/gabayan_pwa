import { flushPromises, type VueWrapper } from '@vue/test-utils'

import CultivationRecordsView from '@pages/cultivations/presentation/views/CultivationRecordsView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { tilapiaFeedGuide } from '../../unit/feeds/fixtures'
import {
  batch001Detail,
  calmWaterCheck,
  feedingPlan,
  feedingRecord,
  mortalityRecord,
} from '../../unit/cultivations/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { apiError, mountInApp } from '../support/app'
import { button } from './support'

const repositories = vi.hoisted(() => ({
  cultivations: {} as Record<string, ReturnType<typeof vi.fn>>,
  feeds: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/feeds/data/feeds.repository', () => ({
  get feedsRepository() {
    return repositories.feeds
  },
}))

vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  get cultivationsRepository() {
    return repositories.cultivations
  },
}))

beforeEach(() => {
  repositories.cultivations = {
    listFeedingRecords: vi.fn().mockResolvedValue(page([feedingRecord])),
    listMortalityRecords: vi.fn().mockResolvedValue(page([mortalityRecord])),
    listWaterChecks: vi.fn().mockResolvedValue(page([calmWaterCheck])),
    getFeedingPlan: vi.fn().mockResolvedValue(envelope(feedingPlan)),
  }
  repositories.feeds = { getFeedGuide: vi.fn().mockResolvedValue(envelope(tilapiaFeedGuide)) }
})

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(CultivationRecordsView, {
    name: ROUTE_NAMES.cultivationRecords,
    params: { cultivationId: 'cul_tilapia_001' },
    query,
  })
  await flushPromises()
  return mounted
}

function tab(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('[aria-label="Farm record categories"] button')
    .find((candidate) => candidate.text() === label)
  if (!found) throw new Error(`No tab "${label}"`)
  return found
}

describe('CultivationRecordsView', () => {
  it('opens on the feeding records and fetches no other tab', async () => {
    const { wrapper } = await open()

    expect(tab(wrapper, 'Feeding').attributes('aria-current')).toBe('page')
    expect(wrapper.text()).toContain('1.2 kg')
    expect(wrapper.text()).toContain('Fish responded normally.')
    expect(repositories.cultivations.listMortalityRecords).not.toHaveBeenCalled()
    expect(repositories.cultivations.getFeedingPlan).not.toHaveBeenCalled()
  })

  it('keeps the chosen tab in the route query and back to none for feeding', async () => {
    const { wrapper, router } = await open()

    await tab(wrapper, 'Mortality').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ tab: 'mortality' })
    expect(tab(wrapper, 'Mortality').attributes('aria-current')).toBe('page')
    expect(wrapper.text()).toContain('15 fish')
    expect(wrapper.text()).toContain('Water quality')

    await tab(wrapper, 'Feeding').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('opens on the water checks a shared link names, with their conditional guidance', async () => {
    const { wrapper } = await open({ tab: 'water' })

    expect(wrapper.text()).toContain('Slightly green')
    expect(wrapper.text()).toContain('No unusual change')
    expect(wrapper.text()).toContain('Continue regular observation')
    expect(wrapper.text()).toContain('not a site-specific water-quality assessment')
  })

  it('shows today’s demo feed plan with its basis and estimate notice', async () => {
    const { wrapper } = await open({ tab: 'plan' })

    const [, , date] = repositories.cultivations.getFeedingPlan!.mock.calls[0]!
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const card = wrapper.get('.plan-card').text()
    expect(card).toContain('Daily demo estimate')
    expect(card).toContain('2.62 kg')
    expect(card).toContain('485')
    expect(card).toContain('Morning feeding')
    expect(card).toContain('This estimate is not a prescription')
    expect(card).toContain('Rule demo-2026-09')
  })

  it('shows the feed for the cultivation’s current stage below the feed plan', async () => {
    repositories.cultivations.getCultivation = vi.fn().mockResolvedValue(envelope(batch001Detail))
    const { wrapper } = await open({ tab: 'plan' })

    expect(repositories.feeds.getFeedGuide).toHaveBeenCalledWith('sp_tilapia', 'access_1')
    expect(wrapper.get('h2').text()).toBe('Feed for the Growing stage')
    expect(wrapper.text()).toContain('Tilapia grower pellets, floating')
    expect(wrapper.find('a[aria-label="Buy now: Tilapia Grower Feed 20 kg"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Typical figures from commercial feed labels')
  })

  it('explains an empty feeding history', async () => {
    repositories.cultivations.listFeedingRecords!.mockResolvedValue(page([]))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Complete a feeding task to add the first record.')
  })

  it('offers a retry when a tab cannot load', async () => {
    repositories.cultivations.listWaterChecks!.mockRejectedValueOnce(
      apiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
    )
    const { wrapper } = await open({ tab: 'water' })

    await button(wrapper, 'Try Again').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Slightly green')
  })

  it('goes back to the cultivation by route name', async () => {
    const { wrapper } = await open()

    expect(wrapper.get('a[aria-label="Go back"]').attributes('href')).toBe(
      '/app/cultivations/cul_tilapia_001',
    )
  })
})
