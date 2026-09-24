import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import CultivationTimeline from '@pages/cultivations/presentation/components/CultivationTimeline.vue'

import { timeline } from '../../unit/cultivations/fixtures'

function render(props: InstanceType<typeof CultivationTimeline>['$props']) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
  return mount(CultivationTimeline, { props, global: { plugins: [router] } })
}

describe('CultivationTimeline', () => {
  it('announces loading while the timeline is fetched', () => {
    const wrapper = render({ timeline: null, loading: true, failed: false })

    expect(wrapper.get('[role="status"]').text()).toContain('Loading timeline')
    expect(wrapper.find('ol').exists()).toBe(false)
  })

  it('offers a retry when the timeline cannot load', async () => {
    const wrapper = render({ timeline: null, loading: false, failed: true })

    expect(wrapper.text()).toContain('We couldn’t load this timeline.')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('explains an empty timeline instead of showing a blank list', () => {
    const wrapper = render({
      timeline: { ...timeline, events: [] },
      loading: false,
      failed: false,
    })

    expect(wrapper.text()).toContain('No timeline yet')
    expect(wrapper.find('ol').exists()).toBe(false)
  })

  it('lists each stage with its status in words and marks estimated dates', () => {
    const wrapper = render({ timeline, loading: false, failed: false })

    const stages = wrapper.findAll('li')
    expect(stages.map((stage) => stage.get('h2').text())).toEqual([
      'Fingerlings stocked',
      'Growing stage',
      'Estimated harvest window',
    ])
    expect(stages[0]?.text()).toContain('Done')
    expect(stages[1]?.text()).toContain('Now')
    expect(stages[1]?.classes()).toContain('timeline--current')
    expect(stages[2]?.text()).toContain('Upcoming')
    expect(stages[2]?.get('small').text()).toMatch(/^Estimated Jan 4, 2027$/)
  })
})
