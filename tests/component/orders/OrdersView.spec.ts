import { flushPromises, type VueWrapper } from '@vue/test-utils'

import OrdersView from '@pages/orders/presentation/views/OrdersView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { cart } from '../../unit/cart/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { cancelledOrder, deliveredOrder, shippedOrder } from '../../unit/orders/fixtures'
import { mountInApp } from '../support/app'

const repositories = vi.hoisted(() => ({
  orders: {} as Record<string, ReturnType<typeof vi.fn>>,
  cart: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/orders/data/orders.repository', () => ({
  get ordersRepository() {
    return repositories.orders
  },
}))
vi.mock('@pages/cart/data/cart.repository', () => ({
  get cartRepository() {
    return repositories.cart
  },
}))

beforeEach(() => {
  repositories.orders = {
    listOrders: vi.fn().mockResolvedValue(page([shippedOrder, deliveredOrder, cancelledOrder])),
  }
  repositories.cart = { getCart: vi.fn().mockResolvedValue(envelope(cart)) }
})

function tab(wrapper: VueWrapper, label: string) {
  const found = wrapper
    .findAll('[aria-label="Filter orders"] button')
    .find((b) => b.text() === label)
  if (!found) throw new Error(`No tab "${label}"`)
  return found
}

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(OrdersView, { name: ROUTE_NAMES.orders, query })
  await flushPromises()
  return mounted
}

describe('OrdersView', () => {
  it('lists every order with its status in words and links each by name', async () => {
    const { wrapper } = await open()

    const cards = wrapper.findAll('.order-card')
    expect(cards).toHaveLength(3)
    expect(cards[0]?.text()).toContain('GBY-10245')
    expect(cards[0]?.text()).toContain('Shipped')
    expect(cards[1]?.text()).toContain('Delivered')
    expect(cards[1]?.text()).toContain('2 items')
    expect(cards[2]?.text()).toContain('Cancelled')
    expect(wrapper.find('a[href="/app/orders/ord_10245"]').exists()).toBe(true)
    expect(wrapper.get('a[href="/app/marketplace"]').text()).toBe('Shop')
  })

  it('keeps the chosen tab in the route query and shows only those orders', async () => {
    const { wrapper, router } = await open()

    await tab(wrapper, 'Active').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ show: 'active' })
    expect(tab(wrapper, 'Active').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('.order-card').map((card) => card.text())).toEqual([
      expect.stringContaining('GBY-10245'),
    ])
  })

  it('opens on the tab a shared link names and says when nothing matches', async () => {
    repositories.orders.listOrders!.mockResolvedValue(page([shippedOrder]))
    const { wrapper } = await open({ show: 'delivered' })

    expect(tab(wrapper, 'Delivered').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('No matching orders')
  })
})
