import { defineComponent, h } from 'vue'

import BuyNowButton from '@pages/marketplace/presentation/components/BuyNowButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { mountInApp } from '../support/app'

async function mountButton(props: InstanceType<typeof BuyNowButton>['$props']) {
  const host = defineComponent({ render: () => h(BuyNowButton, props) })
  const { wrapper } = await mountInApp(host, { name: ROUTE_NAMES.home })
  return wrapper.get('a')
}

describe('BuyNowButton', () => {
  it('opens the product with the suggested quantity and the cultivation it was suggested for', async () => {
    const link = await mountButton({
      productId: 'prd_pond_aerator',
      productName: 'Compact Pond Aerator',
      quantity: 2,
      cultivationId: 'cul_00002',
    })

    expect(link.text()).toBe('Buy now')
    expect(link.attributes('href')).toBe(
      '/app/products/prd_pond_aerator?quantity=2&cultivationId=cul_00002',
    )
  })

  it('presets one when no quantity is suggested', async () => {
    const link = await mountButton({
      productId: 'prd_scoop_net',
      productName: 'Soft Mesh Scoop Net',
    })

    expect(link.attributes('href')).toBe('/app/products/prd_scoop_net?quantity=1')
  })

  it('names the product for screen readers so several buttons stay distinguishable', async () => {
    const link = await mountButton({
      productId: 'prd_pond_aerator',
      productName: 'Compact Pond Aerator',
    })

    expect(link.attributes('aria-label')).toBe('Buy now: Compact Pond Aerator')
  })
})
