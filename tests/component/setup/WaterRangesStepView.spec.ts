import { flushPromises } from '@vue/test-utils'

import WaterRangesStepView from '@pages/setup/presentation/views/WaterRangesStepView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope, page } from '../../unit/marketplace/fixtures'
import { fishCage, pond, tilapia } from '../../unit/setup/fixtures'
import { tilapiaPondThresholds } from '../../unit/water-quality/fixtures'
import { mountInApp } from '../support/app'
import { seedDraft } from './support'

const repositories = vi.hoisted(() => ({
  setup: {} as Record<string, ReturnType<typeof vi.fn>>,
  waterQuality: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/setup/data/setup.repository', () => ({
  get setupRepository() {
    return repositories.setup
  },
}))

vi.mock('@pages/water-quality/data/water-quality.repository', () => ({
  get waterQualityRepository() {
    return repositories.waterQuality
  },
}))

beforeEach(() => {
  window.sessionStorage.clear()
  seedDraft({ speciesId: 'sp_tilapia', environmentId: 'env_pond' })
  repositories.setup = {
    listSpecies: vi.fn().mockResolvedValue(page([tilapia])),
    listCultureEnvironments: vi.fn().mockResolvedValue(page([pond, fishCage])),
  }
  repositories.waterQuality = {
    getWaterThresholds: vi.fn().mockResolvedValue(envelope(tilapiaPondThresholds)),
  }
})

async function open() {
  const mounted = await mountInApp(WaterRangesStepView, { name: ROUTE_NAMES.setupWaterRanges })
  await flushPromises()
  return mounted
}

describe('WaterRangesStepView', () => {
  it('shows the suggested ranges of the chosen fish in the chosen culture system', async () => {
    const { wrapper } = await open()

    expect(repositories.waterQuality.getWaterThresholds).toHaveBeenCalledWith(
      'sp_tilapia',
      'env_pond',
      'access_1',
    )
    expect(wrapper.get('h2').text()).toBe('Good water for your stock')
    expect(wrapper.text()).toContain('with Tilapia (Tilapia) in a pond.')
    expect(wrapper.findAll('[aria-label="Suggested water ranges"] li')).toHaveLength(7)
    expect(wrapper.text()).toContain('Demo figures, not yet reviewed')
  })

  it('asks for no readings and always lets the farmer continue to the dimensions', async () => {
    const { wrapper } = await open()

    expect(wrapper.find('input').exists()).toBe(false)
    const next = wrapper.findAll('.setup-flow-actions .button').find((b) => b.text() === 'Continue')
    expect(next?.attributes('href')).toBe('/setup/dimensions')
  })
})
