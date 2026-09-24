import { flushPromises } from '@vue/test-utils'

import OrderTrackingView from '@pages/orders/presentation/views/OrderTrackingView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { tracking } from '../../unit/orders/fixtures'
import { mountInApp } from '../support/app'

const repository = vi.hoisted(() => ({ current: {} as Record<string, ReturnType<typeof vi.fn>> }))

vi.mock('@pages/orders/data/orders.repository', () => ({
  get ordersRepository() {
    return repository.current
  },
}))

async function open(payload: unknown) {
  repository.current = { getOrderTracking: vi.fn().mockResolvedValue(envelope(payload)) }
  const mounted = await mountInApp(OrderTrackingView, {
    name: ROUTE_NAMES.orderTracking,
    params: { orderId: 'ord_10245' },
  })
  await flushPromises()
  return mounted
}

describe('OrderTrackingView', () => {
  it('marks the current step, dates what happened and calls the rest upcoming', async () => {
    const { wrapper } = await open(tracking)

    expect(wrapper.get('.tracking-summary h1').text()).toBe('Shipped')
    expect(wrapper.text()).toContain('BX-884120')
    const steps = wrapper.findAll('.timeline li')
    expect(steps).toHaveLength(3)
    expect(steps[1]?.attributes('aria-current')).toBe('step')
    expect(steps[1]?.text()).toContain('Current')
    expect(steps[2]?.text()).toContain('Upcoming')
    expect(wrapper.get('a[aria-label="Go back"]').attributes('href')).toBe('/app/orders/ord_10245')
  })

  it('says when the order has no delivery updates yet', async () => {
    const { wrapper } = await open({ ...tracking, events: [], courier: null })

    expect(wrapper.text()).toContain('No delivery updates yet')
  })
})
