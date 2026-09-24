import { mount } from '@vue/test-utils'

import WaterSafetyResultList from '@pages/water-quality/presentation/components/WaterSafetyResultList.vue'

import { highAmmoniaCheck } from '../../unit/water-quality/fixtures'

describe('WaterSafetyResultList', () => {
  it('lists each entered reading with its value, unit and suggested range', () => {
    const wrapper = mount(WaterSafetyResultList, { props: { check: highAmmoniaCheck } })

    const items = wrapper.get('[aria-label="Your readings"]').findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0]?.text()).toContain('pH: 7.2 pH')
    expect(items[0]?.text()).toContain('Suggested: 6.5–8.5 pH')
    expect(items[1]?.text()).toContain('Ammonia: 1.2 mg/L')
    expect(items[1]?.text()).toContain('Suggested: Up to 0.5 mg/L')
  })

  it('marks each status with a label and an icon as well as a colour', () => {
    const wrapper = mount(WaterSafetyResultList, { props: { check: highAmmoniaCheck } })

    const [within, above] = wrapper.findAll('.status-chip')
    expect(within?.text()).toBe('Within range')
    expect(within?.classes()).toContain('status-chip--success')
    expect(above?.text()).toBe('Above range')
    expect(above?.classes()).toContain('status-chip--warning')
    expect(above?.find('svg').exists()).toBe(true)
  })

  it('explains the parameter and gives its conditional guidance', () => {
    const wrapper = mount(WaterSafetyResultList, { props: { check: highAmmoniaCheck } })

    const ammonia = wrapper.findAll('li')[1]!
    expect(ammonia.text()).toContain('A waste that builds up from fish droppings')
    expect(ammonia.get('.safety-result__guidance--action').text()).toContain(
      'Ammonia is higher than suggested',
    )
    expect(ammonia.text()).toContain('consider changing part of the water')
  })

  it('names the readings that were left blank', () => {
    const wrapper = mount(WaterSafetyResultList, { props: { check: highAmmoniaCheck } })

    expect(wrapper.get('.safety-results__skipped').text()).toBe(
      'Not checked: Salinity, Nitrite, Nitrate, Dissolved oxygen, Water temperature.',
    )
  })
})
