import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import WaterThresholdsPanel from '@pages/water-quality/presentation/components/WaterThresholdsPanel.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { tilapiaPondThresholds } from '../../unit/water-quality/fixtures'
import { apiError, mountInApp } from '../support/app'

const repositories = vi.hoisted(() => ({
  waterQuality: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/water-quality/data/water-quality.repository', () => ({
  get waterQualityRepository() {
    return repositories.waterQuality
  },
}))

const Host = defineComponent({
  setup: () => () =>
    h(WaterThresholdsPanel, { speciesId: 'sp_tilapia', environmentId: 'env_pond' }),
})

async function mountPanel(getWaterThresholds: ReturnType<typeof vi.fn>) {
  repositories.waterQuality = { getWaterThresholds }
  const mounted = await mountInApp(Host, { name: ROUTE_NAMES.setupWaterRanges })
  await flushPromises()
  return mounted
}

describe('WaterThresholdsPanel', () => {
  it('lists the seven ranges with their units, explanations and basis', async () => {
    const { wrapper } = await mountPanel(vi.fn().mockResolvedValue(envelope(tilapiaPondThresholds)))

    const ranges = wrapper.get('[aria-label="Suggested water ranges"]').findAll('li')
    expect(ranges).toHaveLength(7)
    expect(ranges[2]?.text()).toContain('Ammonia')
    expect(ranges[2]?.text()).toContain('Up to 0.5 mg/L')
    expect(ranges[2]?.text()).toContain('A waste that builds up')
    expect(ranges[2]?.text()).toContain('Placeholder demo range')
    expect(ranges[5]?.text()).toContain('At least 3 mg/L')
  })

  it('shows the demo label, the disclaimer and the sources under the ranges', async () => {
    const { wrapper } = await mountPanel(vi.fn().mockResolvedValue(envelope(tilapiaPondThresholds)))

    const note = wrapper.get('[aria-label="About these figures"]')
    expect(note.text()).toContain('Demo figures, not yet reviewed')
    expect(note.text()).toContain(tilapiaPondThresholds.disclaimer)
    expect(note.text()).toContain('University of Florida IFAS Extension')
  })

  it('shows a loading state while the ranges are read', async () => {
    repositories.waterQuality = { getWaterThresholds: vi.fn(() => new Promise(() => {})) }
    const { wrapper } = await mountInApp(Host, { name: ROUTE_NAMES.setupWaterRanges })

    expect(wrapper.text()).toContain('Loading suggested water ranges…')
  })

  it('offers a retry when the ranges cannot be read', async () => {
    const getWaterThresholds = vi.fn().mockRejectedValue(new TypeError('network'))
    const { wrapper } = await mountPanel(getWaterThresholds)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(getWaterThresholds).toHaveBeenCalledTimes(2)
  })

  it('explains a pairing that has no ranges instead of offering a retry', async () => {
    const { wrapper } = await mountPanel(
      vi
        .fn()
        .mockRejectedValue(
          apiError(400, 'INCOMPATIBLE_SELECTION', 'Shrimp are not advised for a fish cage.'),
        ),
    )

    expect(wrapper.get('[role="alert"]').text()).toBe('Shrimp are not advised for a fish cage.')
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
