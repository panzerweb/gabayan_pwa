import { flushPromises } from '@vue/test-utils'

import OrderDetailView from '@pages/orders/presentation/views/OrderDetailView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { orderDetail } from '../../unit/orders/fixtures'
import { mountInApp } from '../support/app'

const repository = vi.hoisted(() => ({ current: {} as Record<string, ReturnType<typeof vi.fn>> }))

vi.mock('@pages/orders/data/orders.repository', () => ({
  get ordersRepository() {
    return repository.current
  },
}))

beforeEach(() => {
  repository.current = { getOrder: vi.fn().mockResolvedValue(envelope(orderDetail)) }
})

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(OrderDetailView, {
    name: ROUTE_NAMES.orderDetail,
    params: { orderId: 'ord_10245' },
    query,
  })
  await flushPromises()
  return mounted
}

describe('OrderDetailView', () => {
  it('shows the lines, payment summary and delivery address of the order', async () => {
    const { wrapper } = await open()

    expect(repository.current.getOrder).toHaveBeenCalledWith('ord_10245', 'access_1')
    expect(wrapper.text()).toContain('GBY-10245')
    expect(wrapper.text()).toContain('1 × ₱1,299.00')
    expect(wrapper.text()).toContain('Cash on delivery')
    expect(wrapper.text()).toContain('Call before entering the farm gate.')
    expect(wrapper.get('a[href="/app/orders/ord_10245/tracking"]').text()).toContain('Track order')
    expect(wrapper.text()).not.toContain('Order placed')
  })

  it('confirms a just-placed order', async () => {
    const { wrapper } = await open({ placed: '1' })

    expect(wrapper.get('[role="status"]').text()).toContain('Order placed')
  })
})
