import { flushPromises, type VueWrapper } from '@vue/test-utils'

import ProductDetailView from '@pages/marketplace/presentation/views/ProductDetailView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { cart } from '../../unit/cart/fixtures'
import { aeratorDetail, envelope } from '../../unit/marketplace/fixtures'
import { goOffline, mountInApp, refusingRepository } from '../support/app'

const repositories = vi.hoisted(() => ({
  marketplace: {} as Record<string, ReturnType<typeof vi.fn>>,
  cart: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/marketplace/data/marketplace.repository', () => ({
  get marketplaceRepository() {
    return repositories.marketplace
  },
}))
vi.mock('@pages/cart/data/cart.repository', () => ({
  get cartRepository() {
    return repositories.cart
  },
}))

beforeEach(() => {
  repositories.marketplace = refusingRepository([
    'getProduct',
    'favoriteProduct',
    'unfavoriteProduct',
    'addCartItem',
  ] as const)
  repositories.marketplace.getProduct!.mockResolvedValue(envelope(aeratorDetail))
  repositories.cart = { getCart: vi.fn().mockResolvedValue(envelope({ ...cart, itemCount: 0 })) }
})

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('button')
    .find((item) => item.attributes('aria-label') === label || item.text().startsWith(label))
  if (!found) throw new Error(`No button "${label}"`)
  return found
}

async function open() {
  const mounted = await mountInApp(ProductDetailView, {
    name: ROUTE_NAMES.productDetail,
    params: { productId: 'prd_pond_aerator' },
  })
  await flushPromises()
  return mounted
}

describe('ProductDetailView', () => {
  it('shows the product, why it may help and its specifications', async () => {
    const { wrapper } = await open()

    expect(repositories.marketplace.getProduct).toHaveBeenCalledWith('prd_pond_aerator', 'access_1')
    expect(wrapper.get('.product-info h1').text()).toBe('Compact Pond Aerator')
    expect(wrapper.text()).toContain('Why this may help')
    expect(wrapper.text()).toContain('Confirm actual site needs before purchasing.')
    expect(wrapper.text()).toContain('Rated power')
    expect(wrapper.text()).toContain('45 W')
  })

  it('stops the quantity at the most one order may hold and prices the choice', async () => {
    const { wrapper } = await open()

    for (let step = 0; step < 5; step += 1) {
      await button(wrapper, 'Increase quantity').trigger('click')
    }

    expect(button(wrapper, 'Increase quantity').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Up to 4 per order.')
    expect(button(wrapper, 'Add to cart').text()).toContain('₱5,196.00')
  })

  it('adds the chosen quantity to the cart and updates the cart badge', async () => {
    repositories.marketplace.addCartItem!.mockResolvedValue(envelope({ ...cart, itemCount: 2 }))
    const { wrapper } = await open()
    repositories.cart.getCart!.mockResolvedValue(envelope({ ...cart, itemCount: 2 }))

    await button(wrapper, 'Increase quantity').trigger('click')
    await button(wrapper, 'Add to cart').trigger('click')
    await flushPromises()

    expect(repositories.marketplace.addCartItem).toHaveBeenCalledWith(
      { productId: 'prd_pond_aerator', quantity: 2 },
      'access_1',
    )
    expect(wrapper.get('a[aria-label="Cart with 2 items"]').text()).toBe('2')
  })

  it('explains why adding is unavailable while offline', async () => {
    goOffline()
    const { wrapper } = await open()

    expect(button(wrapper, 'Add to cart').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Cart changes are not queued offline.')
  })

  it('says a product is out of stock instead of offering it', async () => {
    repositories.marketplace.getProduct!.mockResolvedValue(
      envelope({ ...aeratorDetail, availability: 'OUT_OF_STOCK', stockQuantity: 0 }),
    )
    const { wrapper } = await open()

    expect(button(wrapper, 'Out of stock').attributes('disabled')).toBeDefined()
  })
})
