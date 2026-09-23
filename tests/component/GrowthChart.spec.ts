import { mount } from '@vue/test-utils'

import GrowthChart from '@/components/cultivations/GrowthChart.vue'
import type { GrowthMeasurement } from '@/services/api'

function measurement(id: string, measuredOn: string, value: number): GrowthMeasurement {
  return {
    id,
    cultivationId: 'cul_test',
    measuredOn,
    numberOfFishSampled: 10,
    averageWeight: { value, unit: 'G' },
    notes: null,
    recordedBy: { id: 'usr_test', fullName: 'Juan Dela Cruz' },
    createdAt: `${measuredOn}T08:00:00Z`,
    updatedAt: `${measuredOn}T08:00:00Z`,
    version: 1,
  }
}

describe('GrowthChart', () => {
  it('plots and lists measurements in a screen-reader-friendly form', () => {
    const wrapper = mount(GrowthChart, {
      props: {
        measurements: [
          measurement('grw_2', '2026-09-23', 200),
          measurement('grw_1', '2026-09-15', 180),
        ],
      },
    })

    expect(wrapper.get('svg').attributes('aria-label')).toContain('2 measurements')
    expect(wrapper.findAll('circle')).toHaveLength(2)
    expect(wrapper.text()).toContain('200 g')
    expect(wrapper.text()).toContain('180 g')
    expect(wrapper.text()).toContain('10 fish sampled')
  })

  it('shows an explicit empty state', () => {
    const wrapper = mount(GrowthChart, { props: { measurements: [] } })

    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.text()).toContain('No growth samples recorded yet.')
  })
})
