import { z } from 'zod'

import type { AppIconName } from '@components/ui/AppIcon.vue'
import { mediaAssetSchema } from '@core/http'
import { moneySchema } from '@pages/marketplace/domain/marketplace.model'

export const orderStatusSchema = z.enum([
  'TO_PAY',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
])

export const paymentMethodTypeSchema = z.enum(['CASH_ON_DELIVERY', 'GCASH', 'CARD'])

// The delivery address as it was when the order was quoted; no audit or version fields.
export const addressSnapshotSchema = z.object({
  id: z.string(),
  label: z.string(),
  recipientName: z.string(),
  mobileNumber: z.string(),
  line1: z.string(),
  line2: z.string().nullable().optional(),
  barangay: z.string(),
  cityMunicipality: z.string(),
  province: z.string(),
  region: z.string(),
  postalCode: z.string(),
  countryCode: z.literal('PH'),
  deliveryInstructions: z.string().nullable().optional(),
})

export const orderContactSchema = z.object({
  fullName: z.string(),
  mobileNumber: z.string(),
  email: z.string(),
})

// A line as it was sold, so catalog changes never rewrite order history.
export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  image: mediaAssetSchema,
  quantity: z.number().int().positive(),
  unitPrice: moneySchema,
  lineTotal: moneySchema,
})

export const orderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  itemCount: z.number().int().positive(),
  previewImages: z.array(mediaAssetSchema),
  total: moneySchema,
  placedAt: z.string(),
  estimatedDeliveryDate: z.string().nullable(),
})

export const courierSchema = z.object({
  name: z.string(),
  trackingNumber: z.string(),
  contactUrl: z.string().nullable(),
})

export const orderDetailSchema = orderSummarySchema.extend({
  items: z.array(orderItemSchema),
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  paymentMethod: paymentMethodTypeSchema,
  paymentStatus: z.string(),
  deliveryAddress: addressSnapshotSchema,
  contact: orderContactSchema,
  courier: courierSchema.nullable(),
  cancellation: z.unknown().nullable(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const trackingEventSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  label: z.string(),
  description: z.string(),
  occurredAt: z.string().nullable(),
  completed: z.boolean(),
  current: z.boolean(),
})

export const orderTrackingSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  courier: courierSchema.nullable(),
  estimatedDeliveryDate: z.string().nullable(),
  deliveryAddress: addressSnapshotSchema,
  events: z.array(trackingEventSchema),
  items: z.array(orderItemSchema),
  total: moneySchema,
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>
export type AddressSnapshot = z.infer<typeof addressSnapshotSchema>
export type OrderContact = z.infer<typeof orderContactSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderSummary = z.infer<typeof orderSummarySchema>
export type Courier = z.infer<typeof courierSchema>
export type OrderDetail = z.infer<typeof orderDetailSchema>
export type TrackingEvent = z.infer<typeof trackingEventSchema>
export type OrderTracking = z.infer<typeof orderTrackingSchema>

// The orders list tabs, held in the route query as `?show=`.
export const ORDER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
] as const

export type OrderFilter = (typeof ORDER_FILTERS)[number]['value']

const CLOSED_STATUSES: readonly OrderStatus[] = ['DELIVERED', 'CANCELLED']

export function orderFilterFrom(value: unknown): OrderFilter {
  const first = Array.isArray(value) ? value[0] : value
  return ORDER_FILTERS.find((filter) => filter.value === first)?.value ?? 'all'
}

// Active orders are those still on their way; delivered and cancelled ones are closed.
export function filterOrders<T extends Pick<OrderSummary, 'status'>>(
  orders: readonly T[],
  filter: OrderFilter,
): T[] {
  if (filter === 'delivered') return orders.filter((order) => order.status === 'DELIVERED')
  if (filter === 'active') return orders.filter((order) => !CLOSED_STATUSES.includes(order.status))
  return [...orders]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  TO_PAY: 'To pay',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

type StatusTone = 'info' | 'success' | 'danger'

// An order status as words, tone and icon, so it never relies on colour alone.
export function orderStatusDisplay(status: OrderStatus): {
  label: string
  tone: StatusTone
  icon: AppIconName
} {
  if (status === 'DELIVERED')
    return { label: STATUS_LABELS[status], tone: 'success', icon: 'check' }
  if (status === 'CANCELLED')
    return { label: STATUS_LABELS[status], tone: 'danger', icon: 'warning' }
  return { label: STATUS_LABELS[status], tone: 'info', icon: 'truck' }
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  CASH_ON_DELIVERY: 'Cash on delivery',
  GCASH: 'GCash',
  CARD: 'Debit or credit card',
}

export function paymentMethodLabel(method: PaymentMethodType) {
  return PAYMENT_METHOD_LABELS[method]
}

export function itemCountLabel(count: number) {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

// The address as the lines a courier reads: recipient, street and barangay, then town.
export function addressLines(address: AddressSnapshot) {
  const street = [address.line1, address.line2].filter(Boolean).join(', ')
  return [
    address.recipientName,
    `${street}, ${address.barangay}`,
    `${address.cityMunicipality}, ${address.province} ${address.postalCode}`,
  ]
}
