import {
  addressLines,
  filterOrders,
  orderDetailSchema,
  orderFilterFrom,
  orderStatusDisplay,
  paymentMethodLabel,
} from '@pages/orders/domain/orders.model'

import { cancelledOrder, deliveredOrder, farmAddress, orderDetail, shippedOrder } from './fixtures'

const orders = [shippedOrder, deliveredOrder, cancelledOrder]

describe('orders model', () => {
  it('keeps orders on their way under Active and closed ones out of it', () => {
    expect(filterOrders(orders, 'active').map((order) => order.orderNumber)).toEqual(['GBY-10245'])
    expect(filterOrders(orders, 'delivered').map((order) => order.orderNumber)).toEqual([
      'GBY-10201',
    ])
    expect(filterOrders(orders, 'all')).toHaveLength(3)
  })

  it('reads the tab from the route query and falls back to All', () => {
    expect(orderFilterFrom('active')).toBe('active')
    expect(orderFilterFrom(['delivered'])).toBe('delivered')
    expect(orderFilterFrom('SHIPPED')).toBe('all')
    expect(orderFilterFrom(undefined)).toBe('all')
  })

  it('shows every status as words with an icon, not colour alone', () => {
    expect(orderStatusDisplay('OUT_FOR_DELIVERY')).toEqual({
      label: 'Out for delivery',
      tone: 'info',
      icon: 'truck',
    })
    expect(orderStatusDisplay('DELIVERED')).toEqual({
      label: 'Delivered',
      tone: 'success',
      icon: 'check',
    })
    expect(orderStatusDisplay('CANCELLED')).toMatchObject({ label: 'Cancelled', tone: 'danger' })
  })

  it('names payment methods and lays out an address as a courier reads it', () => {
    expect(paymentMethodLabel('CASH_ON_DELIVERY')).toBe('Cash on delivery')
    expect(addressLines({ ...farmAddress, line2: 'Purok 3' })).toEqual([
      'Juan Dela Cruz',
      '18 Mabini Street, Purok 3, San Roque',
      'San Pablo City, Laguna 4000',
    ])
  })

  it('refuses an order detail with a status the contract does not define', () => {
    expect(orderDetailSchema.parse(orderDetail).courier?.name).toBe('Bayanihan Express')
    expect(orderDetailSchema.safeParse({ ...orderDetail, status: 'LOST' }).success).toBe(false)
  })
})
