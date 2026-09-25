import { flushPromises } from '@vue/test-utils'

import CultivationFeedConversionView from '@pages/cultivations/presentation/views/CultivationFeedConversionView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import {
  batch001Conversion,
  oneSampleConversion,
} from '../../unit/cultivations/feed-conversion-fixtures'
import { batch001Detail } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, mountInApp } from '../support/app'
import { button } from './support'

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
    getFeedConversion: vi.fn().mockResolvedValue(envelope(batch001Conversion)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function open() {
  const mounted = await mountInApp(CultivationFeedConversionView, {
    name: ROUTE_NAMES.cultivationFeedConversion,
    params: { cultivationId: 'cul_tilapia_001' },
  })
  await flushPromises()
  return mounted
}

describe('CultivationFeedConversionView', () => {
  it('shows the ratio with a plain explanation and what it was worked out from', async () => {
    const { wrapper } = await open()

    expect(repositories.cultivations.getFeedConversion).toHaveBeenCalledWith(
      'cul_tilapia_001',
      'access_1',
    )
    const text = wrapper.text()
    expect(wrapper.get('.fcr__figure strong').text()).toBe('1.37')
    expect(text).toContain('1.37 kg of feed for each kg gained')
    expect(text).toContain('how many kilograms of feed went into each kilogram')
    expect(text).toContain('Aug 21, 2026 to Sep 21, 2026')
    expect(text).toContain('90.5 kg from 4 feeding records')
    expect(text).toContain('21 kg to 87.3 kg')
    expect(text).toContain('Fish that died are not counted as weight gained')
  })

  it('lists the ratio between each pair of growth samples', async () => {
    const { wrapper } = await open()

    const intervals = wrapper.get('.fcr-intervals').findAll('li')
    expect(intervals.map((item) => item.get('strong').text())).toEqual(['FCR 1.33', 'FCR 1.39'])
  })

  it('labels the figure as an unreviewed demo calculation with its disclaimer', async () => {
    const { wrapper } = await open()

    const provenance = wrapper.get('.fcr__provenance').text()
    expect(provenance).toContain('Demo calculation, not yet reviewed')
    expect(provenance).toContain('use it as a guide, not a measurement')
  })

  it('says what is missing, with the way to add it, when the records cannot give a ratio', async () => {
    repositories.cultivations.getFeedConversion!.mockResolvedValue(
      envelope({ ...oneSampleConversion, cultivationId: 'cul_tilapia_001' }),
    )
    const { wrapper } = await open()

    expect(wrapper.find('.fcr__figure').exists()).toBe(false)
    expect(wrapper.text()).toContain('Not enough records yet')
    expect(wrapper.text()).toContain('Record at least two growth samples')
    expect(wrapper.find('a[href="/app/cultivations/cul_tilapia_001/growth"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/app/cultivations/cul_tilapia_001/records"]').exists()).toBe(true)
  })

  it('offers a retry when the ratio cannot be loaded', async () => {
    repositories.cultivations.getFeedConversion!.mockRejectedValueOnce(new TypeError('Failed'))
    const { wrapper } = await open()

    await button(wrapper, 'Try Again').trigger('click')
    await flushPromises()

    expect(wrapper.get('.fcr__figure strong').text()).toBe('1.37')
  })

  it('sends a farmer the API refuses to the plans', async () => {
    const refusal = apiError(403, 'FORBIDDEN', 'This needs the Pro plan.')
    Object.assign(refusal, { details: { requiredTier: 'PRO', currentTier: 'FREE' } })
    repositories.cultivations.getFeedConversion!.mockRejectedValue(refusal)
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Feed conversion is part of Pro')
    expect(wrapper.get('a[href="/app/plans?required=PRO"]').text()).toBe('See plans')
  })
})
