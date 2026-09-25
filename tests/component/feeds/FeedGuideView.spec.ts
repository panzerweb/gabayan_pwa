import { flushPromises } from '@vue/test-utils'

import FeedGuideView from '@pages/feeds/presentation/views/FeedGuideView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { tilapiaFeedGuide } from '../../unit/feeds/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountInApp } from '../support/app'

const repositories = vi.hoisted(() => ({
  feeds: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/feeds/data/feeds.repository', () => ({
  get feedsRepository() {
    return repositories.feeds
  },
}))

beforeEach(() => {
  repositories.feeds = { getFeedGuide: vi.fn().mockResolvedValue(envelope(tilapiaFeedGuide)) }
})

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(FeedGuideView, {
    name: ROUTE_NAMES.feedGuide,
    params: { speciesId: 'sp_tilapia' },
    query,
  })
  await flushPromises()
  return mounted
}

describe('FeedGuideView', () => {
  it('lists every growth stage of the species with its feed and the guide’s sources', async () => {
    const { wrapper } = await open()

    expect(wrapper.get('.app-header').text()).toContain('Tilapia (Tilapia)')
    expect(wrapper.findAll('h2').map((heading) => heading.text())).toEqual([
      'Growing stage',
      'Pre-harvest stage',
    ])
    expect(wrapper.text()).toContain('Tilapia finisher pellets, floating')
    expect(wrapper.text()).toContain('From 300 g')
    const provenance = wrapper.get('[aria-label="About these feed figures"]')
    expect(provenance.text()).toContain(
      'SEAFDEC Aquaculture Department: Development of cost-efficient feeds',
    )
  })

  it('marks the stage the cultivation is in and returns to its feed plan', async () => {
    const { wrapper } = await open({ cultivationId: 'cul_tilapia_001', stage: 'GROWING' })

    const marked = wrapper
      .findAll('.feed-guide-stage')
      .filter((section) => section.text().includes('Your fish now'))
    expect(marked).toHaveLength(1)
    expect(marked[0]?.get('h2').text()).toBe('Growing stage')
    expect(wrapper.get('a[aria-label="Go back"]').attributes('href')).toBe(
      '/app/cultivations/cul_tilapia_001/records?tab=plan',
    )
    expect(
      wrapper.get('a[aria-label="Buy now: Tilapia Grower Feed 20 kg"]').attributes('href'),
    ).toBe('/app/products/prd_grower_feed?quantity=1&cultivationId=cul_tilapia_001')
  })

  it('goes back Home when opened without a cultivation', async () => {
    const { wrapper } = await open()

    expect(wrapper.get('a[aria-label="Go back"]').attributes('href')).toBe('/app/home')
    expect(wrapper.text()).not.toContain('Your fish now')
  })

  it('explains a species with no guide yet', async () => {
    repositories.feeds.getFeedGuide!.mockRejectedValueOnce(
      apiError(404, 'NOT_FOUND', 'No feed guide is available for this fish yet.'),
    )
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('No feed guide yet')
  })
})
