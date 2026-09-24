import { apiRequest, envelopeSchema, pageSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import { orderDetailSchema, orderSummarySchema, orderTrackingSchema } from '../domain/orders.model'

// Newest first; one page of 100 covers a small farm's order history.
const ORDER_LIST_QUERY = 'limit=100&sort=placedAt&order=desc'

export async function listOrdersApi(accessToken: string) {
  return apiRequest(`${ENDPOINTS.orders.root}?${ORDER_LIST_QUERY}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(orderSummarySchema),
  })
}

export async function getOrderApi(orderId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.orders.detail(orderId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(orderDetailSchema),
  })
}

export async function getOrderTrackingApi(orderId: string, accessToken: string) {
  return apiRequest(ENDPOINTS.orders.tracking(orderId), {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(orderTrackingSchema),
  })
}
