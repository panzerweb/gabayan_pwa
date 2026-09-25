import type { Envelope, Page } from '@core/http'

import type { OrderDetail, OrderSummary, OrderTracking } from './orders.model'

export interface OrdersRepository {
  listOrders(accessToken: string): Promise<Page<OrderSummary>>
  getOrder(orderId: string, accessToken: string): Promise<Envelope<OrderDetail>>
  getOrderTracking(orderId: string, accessToken: string): Promise<Envelope<OrderTracking>>
}
