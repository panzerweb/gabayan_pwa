import { flushPromises, type VueWrapper } from '@vue/test-utils'

import CartView from '@pages/cart/presentation/views/CartView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { cart, emptyCart } from '../../unit/cart/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { apiError, goOffline, mountInApp, refusingRepository } from '../support/app'

const repository = vi.hoisted(() => ({ current: {} as Record<string, ReturnType<typeof vi.fn>> }))

vi.mock('@pages/cart/data/cart.repository', () => ({
  get cartRepository() {
    return repository.current
  },
}))

const twoAerators = {
  ...cart,
  items: [
    {
      ...cart.items[0]!,
      quantity: 2,
      lineTotal: { amountMinor: 259800, currency: 'PHP' as const },
    },
  ],
  itemCount: 2,
  subtotal: { amountMinor: 259800, currency: 'PHP' as const },
  estimatedTotal: { amountMinor: 274800, currency: 'PHP' as const },
  version: 3,
}

beforeEach(() => {
  repository.current = refusingRepository(['getCart', 'updateCartItem', 'removeCartItem'] as const)
  repository.current.getCart!.mockResolvedValue(envelope(cart))
})

function button(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('button')
    .find((item) => item.attributes('aria-label') === label || item.text() === label)
  if (!found) throw new Error(`No button "${label}"`)
  return found
}

async function open() {
  const mounted = await mountInApp(CartView, { name: ROUTE_NAMES.cart })
  await flushPromises()
  return mounted
}

describe('CartView', () => {
  it('shows each line and the totals the server priced', async () => {
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Compact Pond Aerator')
    expect(wrapper.text()).toContain('₱1,299.00 each')
    expect(wrapper.text()).toContain('Estimated total')
    expect(wrapper.text()).toContain('₱1,449.00')
    expect(button(wrapper, 'Decrease quantity').attributes('disabled')).toBeDefined()
  })

  it('changes a quantity and shows the totals the server answers', async () => {
    repository.current.updateCartItem!.mockResolvedValue(envelope(twoAerators))
    const { wrapper } = await open()
    repository.current.getCart!.mockResolvedValue(envelope(twoAerators))

    await button(wrapper, 'Increase quantity').trigger('click')
    await flushPromises()

    expect(repository.current.updateCartItem).toHaveBeenCalledWith(
      'cart_item_1',
      { quantity: 2 },
      'access_1',
    )
    expect(wrapper.text()).toContain('₱2,748.00')
  })

  it('shows the server sentence when a change is refused', async () => {
    repository.current.updateCartItem!.mockRejectedValue(
      apiError(409, 'CONFLICT', 'Only 1 more of this product is in stock.'),
    )
    const { wrapper } = await open()

    await button(wrapper, 'Increase quantity').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Only 1 more of this product is in stock.')
  })

  it('removes a line and says so', async () => {
    repository.current.removeCartItem!.mockResolvedValue(envelope(emptyCart))
    const { wrapper, toast } = await open()
    repository.current.getCart!.mockResolvedValue(envelope(emptyCart))

    await button(wrapper, 'Remove').trigger('click')
    await flushPromises()

    expect(repository.current.removeCartItem).toHaveBeenCalledWith('cart_item_1', 'access_1')
    expect(toast.messages.at(-1)?.message).toBe('Item removed from cart.')
    expect(wrapper.text()).toContain('Your cart is empty')
  })

  it('locks cart changes while offline and says why', async () => {
    goOffline()
    const { wrapper } = await open()

    expect(button(wrapper, 'Increase quantity').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Remove').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Cart changes are not queued offline.')
  })
})
