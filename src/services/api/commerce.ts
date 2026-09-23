import { z } from 'zod'

import { apiRequest } from './http'
import { envelopeSchema, mediaAssetSchema, pageSchema } from './schemas'

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.literal('PHP'),
})

export const productCategorySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
})

export const productSummarySchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  primaryImage: mediaAssetSchema,
  price: moneySchema,
  rating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  soldCount: z.number().int().nonnegative(),
  availability: z.enum(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']),
  stockQuantity: z.number().int().nonnegative().nullable(),
  category: productCategorySchema,
  badges: z.array(z.string()),
  isFavorite: z.boolean(),
})

export const productDetailSchema = productSummarySchema.extend({
  images: z.array(mediaAssetSchema),
  description: z.string(),
  specifications: z.array(z.object({ label: z.string(), value: z.string() })),
  suitableSpeciesIds: z.array(z.string()),
  suitableEnvironmentIds: z.array(z.string()),
  recommendation: z.object({ cultivationId: z.string(), why: z.string() }).nullable(),
  maximumOrderQuantity: z.number().int().positive(),
})

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      product: productSummarySchema,
      quantity: z.number().int().positive(),
      unitPrice: moneySchema,
      lineTotal: moneySchema,
      addedAt: z.string(),
    }),
  ),
  itemCount: z.number().int().nonnegative(),
  subtotal: moneySchema,
  estimatedDeliveryFee: moneySchema,
  estimatedTotal: moneySchema,
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const addressSchema = z.object({
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
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  version: z.number().int().positive().optional(),
})

export const paymentOptionSchema = z.object({
  type: z.enum(['CASH_ON_DELIVERY', 'GCASH', 'CARD']),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  disabledReason: z.string().nullable(),
})

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

const contactSchema = z.object({
  fullName: z.string(),
  mobileNumber: z.string(),
  email: z.string(),
})

export const checkoutQuoteSchema = z.object({
  quoteId: z.string(),
  cartVersion: z.number().int().positive(),
  items: z.array(orderItemSchema),
  deliveryAddress: addressSchema,
  contact: contactSchema,
  paymentMethod: paymentOptionSchema.shape.type,
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  total: moneySchema,
  expiresAt: z.string(),
  warnings: z.array(z.string()),
})

export const orderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.enum(['TO_PAY', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  itemCount: z.number().int().positive(),
  previewImages: z.array(mediaAssetSchema),
  total: moneySchema,
  placedAt: z.string(),
  estimatedDeliveryDate: z.string().nullable(),
})

const courierSchema = z.object({
  name: z.string(),
  trackingNumber: z.string(),
  contactUrl: z.string().nullable(),
})

export const orderDetailSchema = orderSummarySchema.extend({
  items: z.array(orderItemSchema),
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  paymentMethod: paymentOptionSchema.shape.type,
  paymentStatus: z.string(),
  deliveryAddress: addressSchema,
  contact: contactSchema,
  courier: courierSchema.nullable(),
  cancellation: z.unknown().nullable(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const orderTrackingSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  status: orderSummarySchema.shape.status,
  courier: courierSchema.nullable(),
  estimatedDeliveryDate: z.string().nullable(),
  deliveryAddress: addressSchema,
  events: z.array(
    z.object({
      id: z.string(),
      status: orderSummarySchema.shape.status,
      label: z.string(),
      description: z.string(),
      occurredAt: z.string().nullable(),
      completed: z.boolean(),
      current: z.boolean(),
    }),
  ),
  items: z.array(orderItemSchema),
  total: moneySchema,
})

const favoriteResultSchema = z.object({ productId: z.string(), isFavorite: z.boolean() })

export type Money = z.infer<typeof moneySchema>
export type ProductCategory = z.infer<typeof productCategorySchema>
export type ProductSummary = z.infer<typeof productSummarySchema>
export type ProductDetail = z.infer<typeof productDetailSchema>
export type Cart = z.infer<typeof cartSchema>
export type Address = z.infer<typeof addressSchema>
export type PaymentOption = z.infer<typeof paymentOptionSchema>
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>
export type OrderSummary = z.infer<typeof orderSummarySchema>
export type OrderDetail = z.infer<typeof orderDetailSchema>
export type OrderTracking = z.infer<typeof orderTrackingSchema>

export interface ProductFilters {
  search?: string
  categoryId?: string
  suitableSpeciesId?: string
  suitableEnvironmentId?: string
  availability?: ProductSummary['availability']
  sort?: 'price' | 'rating' | 'name'
  order?: 'asc' | 'desc'
}

export const commerceQueryKeys = {
  categories: ['product-categories'] as const,
  products: (filters: ProductFilters) => ['products', filters] as const,
  product: (id: string) => ['product', id] as const,
  cart: ['cart'] as const,
  addresses: ['addresses'] as const,
  paymentOptions: ['payment-options'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  tracking: (id: string) => ['order-tracking', id] as const,
}

export function listProductCategories() {
  return apiRequest('/product-categories?limit=100', {
    method: 'GET',
    schema: pageSchema(productCategorySchema),
  })
}

export function listProducts(filters: ProductFilters, accessToken: string) {
  const query = new URLSearchParams({ limit: '100' })
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return apiRequest(`/products?${query.toString()}`, {
    method: 'GET',
    accessToken,
    schema: pageSchema(productSummarySchema),
  })
}

export function getProduct(productId: string, accessToken: string) {
  return apiRequest(`/products/${productId}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(productDetailSchema),
  })
}

export function setProductFavorite(productId: string, favorite: boolean, accessToken: string) {
  return apiRequest(`/products/${productId}/favorite`, {
    method: favorite ? 'PUT' : 'DELETE',
    accessToken,
    schema: envelopeSchema(favoriteResultSchema),
  })
}

export function getCart(accessToken: string) {
  return apiRequest('/cart', { method: 'GET', accessToken, schema: envelopeSchema(cartSchema) })
}

export function addCartItem(productId: string, quantity: number, accessToken: string) {
  return apiRequest('/cart/items', {
    method: 'POST',
    body: { productId, quantity },
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}

export function updateCartItem(itemId: string, quantity: number, accessToken: string) {
  return apiRequest(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: { quantity },
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}

export function removeCartItem(itemId: string, accessToken: string) {
  return apiRequest(`/cart/items/${itemId}`, {
    method: 'DELETE',
    accessToken,
    schema: envelopeSchema(cartSchema),
  })
}

export function listAddresses(accessToken: string) {
  return apiRequest('/users/me/addresses?limit=100', {
    method: 'GET',
    accessToken,
    schema: pageSchema(addressSchema),
  })
}

export function listPaymentOptions(accessToken: string) {
  return apiRequest('/checkout/payment-options?limit=100', {
    method: 'GET',
    accessToken,
    schema: pageSchema(paymentOptionSchema),
  })
}

export function createCheckoutQuote(
  body: {
    addressId: string
    contact: { fullName: string; mobileNumber: string; email: string }
    paymentMethod: PaymentOption['type']
    cartVersion: number
  },
  accessToken: string,
) {
  return apiRequest('/checkout/quote', {
    method: 'POST',
    body,
    accessToken,
    schema: envelopeSchema(checkoutQuoteSchema),
  })
}

export function createOrder(
  quoteId: string,
  acceptedTotal: Money,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiRequest('/orders', {
    method: 'POST',
    body: { quoteId, acceptedTotal },
    accessToken,
    headers: { 'Idempotency-Key': idempotencyKey },
    schema: envelopeSchema(orderDetailSchema),
  })
}

export function listOrders(accessToken: string) {
  return apiRequest('/orders?limit=100&sort=placedAt&order=desc', {
    method: 'GET',
    accessToken,
    schema: pageSchema(orderSummarySchema),
  })
}

export function getOrder(orderId: string, accessToken: string) {
  return apiRequest(`/orders/${orderId}`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(orderDetailSchema),
  })
}

export function getOrderTracking(orderId: string, accessToken: string) {
  return apiRequest(`/orders/${orderId}/tracking`, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(orderTrackingSchema),
  })
}
