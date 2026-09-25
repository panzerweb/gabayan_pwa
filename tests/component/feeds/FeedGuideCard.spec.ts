import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import FeedGuideCard from '@pages/feeds/presentation/components/FeedGuideCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { tilapiaFeedGuide } from '../../unit/feeds/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { button } from '../cultivations/support'
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

async function mountCard(growthStageCode = 'GROWING') {
  const host = defineComponent({
    render: () =>
      h(FeedGuideCard, {
        speciesId: 'sp_tilapia',
        growthStageCode,
        cultivationId: 'cul_tilapia_001',
      }),
  })
  const mounted = await mountInApp(host, {
    name: ROUTE_NAMES.cultivationRecords,
    params: { cultivationId: 'cul_tilapia_001' },
    query: { tab: 'plan' },
  })
  await flushPromises()
  return mounted
}

describe('FeedGuideCard', () => {
  it('shows the feed for the current stage with its label figures and the demo disclaimer', async () => {
    const { wrapper } = await mountCard()

    expect(repositories.feeds.getFeedGuide).toHaveBeenCalledWith('sp_tilapia', 'access_1')
    expect(wrapper.get('h2').text()).toBe('Feed for the Growing stage')
    const text = wrapper.text()
    expect(text).toContain('Tilapia grower pellets, floating')
    expect(text).toContain('28–32%')
    expect(text).toContain('2–4 mm')
    expect(text).toContain('2 feedings a day')
    expect(text).toContain('Up to 300 g')
    expect(text).toContain('entered as a demo placeholder')
    const provenance = wrapper.get('[aria-label="About these feed figures"]')
    expect(provenance.text()).toContain('Demo figures, not yet reviewed')
    expect(provenance.text()).toContain('not yet reviewed for your farm')
    expect(provenance.text()).toContain('Rule demo-2026-09-gabayan')
  })

  it('offers Buy now on the matching feed, opening it for this cultivation', async () => {
    const { wrapper } = await mountCard()

    const buyNow = wrapper.get('a[aria-label="Buy now: Tilapia Grower Feed 20 kg"]')
    expect(buyNow.attributes('href')).toBe(
      '/app/products/prd_grower_feed?quantity=1&cultivationId=cul_tilapia_001',
    )
    expect(wrapper.text()).toContain('₱1,180.00')
  })

  it('says so when no feed in the shop matches the stage, with no Buy now', async () => {
    const { wrapper } = await mountCard('PRE_HARVEST')

    expect(wrapper.get('h2').text()).toBe('Feed for the Pre-harvest stage')
    expect(wrapper.text()).toContain('No matching feed in the shop yet.')
    expect(wrapper.find('a[aria-label^="Buy now"]').exists()).toBe(false)
  })

  it('links to the whole guide with the cultivation and its stage', async () => {
    const { wrapper } = await mountCard()

    const link = wrapper.findAll('a').find((anchor) => anchor.text().includes('whole'))
    expect(link?.text()).toBe('See the whole Tilapia feed guide')
    expect(link?.attributes('href')).toBe(
      '/app/species/sp_tilapia/feed-guide?cultivationId=cul_tilapia_001&stage=GROWING',
    )
  })

  it('points a cultivation still in planning to the whole guide instead of guessing a stage', async () => {
    const { wrapper } = await mountCard('PLANNING')

    expect(wrapper.get('h2').text()).toBe('Which feed to use')
    expect(wrapper.text()).toContain('Record a growth sample')
    expect(wrapper.text()).toContain('See the whole Tilapia feed guide')
  })

  it('explains a fish with no guide, and offers a retry when the guide fails to load', async () => {
    repositories.feeds.getFeedGuide!.mockRejectedValueOnce(
      apiError(404, 'NOT_FOUND', 'No feed guide is available for this fish yet.'),
    )
    const missing = await mountCard()
    expect(missing.wrapper.text()).toContain('There is no feed guide for this fish yet.')
    expect(missing.wrapper.find('button').exists()).toBe(false)

    repositories.feeds.getFeedGuide!.mockRejectedValueOnce(
      apiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'),
    )
    const failed = await mountCard()
    await button(failed.wrapper, 'Try Again').trigger('click')
    await flushPromises()
    expect(failed.wrapper.text()).toContain('Tilapia grower pellets, floating')
  })
})
