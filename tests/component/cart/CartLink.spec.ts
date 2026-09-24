import { flushPromises } from '@vue/test-utils'

import CartLink from '@pages/cart/presentation/components/CartLink.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { cart } from '../../unit/cart/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { mountInApp } from '../support/app'

const repository = vi.hoisted(() => ({ current: {} as Record<string, ReturnType<typeof vi.fn>> }))

vi.mock('@pages/cart/data/cart.repository', () => ({
  get cartRepository() {
    return repository.current
  },
}))

async function mountWith(itemCount: number) {
  repository.current = { getCart: vi.fn().mockResolvedValue(envelope({ ...cart, itemCount })) }
  const mounted = await mountInApp(CartLink, { name: ROUTE_NAMES.orders })
  await flushPromises()
  return mounted
}

describe('CartLink', () => {
  it('names the item count and links to the cart by name', async () => {
    const { wrapper } = await mountWith(3)

    const link = wrapper.get('a')
    expect(link.attributes('aria-label')).toBe('Cart with 3 items')
    expect(link.attributes('href')).toBe('/app/cart')
    expect(link.text()).toBe('3')
  })

  it('caps the badge at 9+ and hides it for an empty cart', async () => {
    expect((await mountWith(14)).wrapper.get('a').text()).toBe('9+')
    expect((await mountWith(0)).wrapper.find('a > span').exists()).toBe(false)
  })
})
