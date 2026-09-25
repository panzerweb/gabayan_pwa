import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import type { WaterSafetyCheck } from '@pages/water-quality/domain/water-quality.model'
import WaterSafetyResultList from '@pages/water-quality/presentation/components/WaterSafetyResultList.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { highAmmoniaCheck, lowOxygenCheck } from '../../unit/water-quality/fixtures'
import { mountInApp } from '../support/app'

// Products carry a "Buy now" link, so a result that names any needs a router.
async function mountWithRouter(check: WaterSafetyCheck) {
  const host = defineComponent({ render: () => h(WaterSafetyResultList, { check }) })
  const { wrapper } = await mountInApp(host, { name: ROUTE_NAMES.home })
  return wrapper
}

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

  it('offers Buy now on each product the server names for an out-of-range reading', async () => {
    const wrapper = await mountWithRouter(lowOxygenCheck)

    const products = wrapper.get('[aria-label="Products that may help with Dissolved oxygen"]')
    expect(products.text()).toContain('Compact Pond Aerator')
    expect(products.text()).toContain('₱1,299.00')
    expect(products.text()).toContain('adds oxygen to the water')
    expect(products.text()).toContain('Check what your own setup needs before buying.')
    const buy = products.get('a[aria-label="Buy now: Compact Pond Aerator"]')
    expect(buy.attributes('href')).toBe('/app/products/prd_pond_aerator?quantity=1')
  })

  it('names no products for readings the server recommends nothing for', () => {
    const wrapper = mount(WaterSafetyResultList, { props: { check: highAmmoniaCheck } })

    expect(wrapper.text()).not.toContain('Products that may help')
  })

  it('says when a suggested product is out of stock', async () => {
    const [oxygen] = lowOxygenCheck.results
    const product = { ...oxygen!.recommendedProducts![0]!, availability: 'OUT_OF_STOCK' as const }
    const check = { ...lowOxygenCheck, results: [{ ...oxygen!, recommendedProducts: [product] }] }
    const wrapper = await mountWithRouter(check)

    expect(wrapper.get('.problem-product .status-chip').text()).toBe('Out of stock')
  })
})
