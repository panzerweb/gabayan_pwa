import type { OrdersRepository } from '../domain/orders.repository.interface'
import { getOrderApi, getOrderTrackingApi, listOrdersApi } from './orders.api'

export const ordersRepository: OrdersRepository = {
  listOrders: listOrdersApi,
  getOrder: getOrderApi,
  getOrderTracking: getOrderTrackingApi,
}
