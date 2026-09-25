import { mount } from '@vue/test-utils'

import ProductInstallationGuide from '@pages/marketplace/presentation/components/ProductInstallationGuide.vue'

import { aeratorGuide } from '../../unit/marketplace/fixtures'

describe('ProductInstallationGuide', () => {
  it('numbers the steps in order with their titles and instructions', () => {
    const wrapper = mount(ProductInstallationGuide, { props: { guide: aeratorGuide } })

    const steps = wrapper.get('ol[aria-label="Installation steps"]').findAll('li')
    expect(steps).toHaveLength(2)
    expect(steps[0]?.get('.install-guide__number').text()).toBe('1')
    expect(steps[0]?.text()).toContain('Choose a spot')
    expect(steps[1]?.get('.install-guide__number').text()).toBe('2')
    expect(steps[1]?.text()).toContain('Keep the power point dry')
    expect(steps[1]?.text()).toContain('above flood level')
  })

  it('lists the cautions before the steps', () => {
    const wrapper = mount(ProductInstallationGuide, { props: { guide: aeratorGuide } })

    const html = wrapper.html()
    expect(wrapper.get('ul[aria-label="Safety cautions"]').text()).toContain(
      'Switch off and unplug the aerator',
    )
    expect(html.indexOf('Safety cautions')).toBeLessThan(html.indexOf('Installation steps'))
  })

  it('leaves out the cautions box when a guide has none', () => {
    const wrapper = mount(ProductInstallationGuide, {
      props: { guide: { ...aeratorGuide, cautions: [] } },
    })

    expect(wrapper.find('ul[aria-label="Safety cautions"]').exists()).toBe(false)
  })

  it('marks a demo guide and shows its disclaimer', () => {
    const wrapper = mount(ProductInstallationGuide, { props: { guide: aeratorGuide } })

    expect(wrapper.text()).toContain('Demo guide.')
    expect(wrapper.text()).toContain('Follow the manual that comes with the product')
  })
})
