import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import SizingGuidancePanel from '@pages/setup/presentation/components/SizingGuidancePanel.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { bangusPondSizing, tilapiaTankSizing } from '../../unit/setup/fixtures'
import { apiError, mountInApp } from '../support/app'

const repositories = vi.hoisted(() => ({
  setup: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/setup/data/setup.repository', () => ({
  get setupRepository() {
    return repositories.setup
  },
}))

beforeEach(() => {
  repositories.setup = {
    getSizingGuidance: vi.fn().mockResolvedValue(envelope(bangusPondSizing)),
  }
})

async function mountPanel(speciesId = 'sp_milkfish', environmentId = 'env_pond') {
  const Host = defineComponent(() => () => h(SizingGuidancePanel, { speciesId, environmentId }))
  const mounted = await mountInApp(Host, { name: ROUTE_NAMES.setupDimensions })
  await flushPromises()
  return mounted
}

describe('SizingGuidancePanel', () => {
  it('shows the brief’s Bangus pond size and depth with its demo label and source', async () => {
    const { wrapper } = await mountPanel()

    expect(repositories.setup.getSizingGuidance).toHaveBeenCalledWith('sp_milkfish', 'env_pond')
    const text = wrapper.text()
    expect(text).toContain('For 5,000 fish')
    expect(text).toContain('About 5,000 m² (0.5 ha)')
    expect(text).toContain('of water surface (length × width)')
    expect(text).toContain('About 1 m²')
    expect(text).toContain('At least 1.0–1.2 m')
    expect(text).toContain('Demo figures, not yet reviewed')
    expect(text).toContain(bangusPondSizing.disclaimer)
    expect(text).toContain(
      'Gabayan: Gabayan product brief: semi-intensive bangus pond sizing sample',
    )
  })

  it('gives a volume for a tank and says when no depth is suggested', async () => {
    repositories.setup.getSizingGuidance = vi.fn().mockResolvedValue(envelope(tilapiaTankSizing))

    const { wrapper } = await mountPanel('sp_tilapia', 'env_tank')

    expect(wrapper.text()).toContain('About 14.29 m³')
    expect(wrapper.text()).toContain('of water (length × width × depth)')
    expect(wrapper.text()).toContain('About 0.072 m³')
    expect(wrapper.text()).toContain('No suggested depth yet')
    expect(wrapper.text()).toContain(tilapiaTankSizing.depthBasis)
  })

  it('shows the profile’s reason for a pairing it advises against, without a retry', async () => {
    repositories.setup.getSizingGuidance = vi
      .fn()
      .mockRejectedValue(
        apiError(400, 'INCOMPATIBLE_SELECTION', 'A floating fish cage does not suit them.'),
      )

    const { wrapper } = await mountPanel('sp_shrimp', 'env_cage')

    expect(wrapper.get('[role="alert"]').text()).toBe('A floating fish cage does not suit them.')
    expect(wrapper.text()).not.toContain('Try Again')
  })

  it('offers a retry when the size cannot be loaded, and shows it once it arrives', async () => {
    repositories.setup.getSizingGuidance = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(envelope(bangusPondSizing))

    const { wrapper } = await mountPanel()

    expect(wrapper.text()).toContain('We couldn’t load the suggested size')
    expect(wrapper.text()).toContain('You can still enter your own measurements.')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Try Again'))
      ?.trigger('click')
    await flushPromises()

    expect(repositories.setup.getSizingGuidance).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('About 5,000 m² (0.5 ha)')
  })
})
