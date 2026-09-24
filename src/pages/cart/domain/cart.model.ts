import { z } from 'zod'

import { moneySchema, productSummarySchema } from '@pages/marketplace/domain/marketplace.model'
import {
  addressSnapshotSchema,
  orderContactSchema,
  orderItemSchema,
  paymentMethodTypeSchema,
  type PaymentMethodType,
} from '@pages/orders/domain/orders.model'
import type { Address } from '@pages/profile/domain/profile.model'

export const cartItemSchema = z.object({
  id: z.string(),
  product: productSummarySchema,
  quantity: z.number().int().positive(),
  unitPrice: moneySchema,
  lineTotal: moneySchema,
  addedAt: z.string(),
})

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  itemCount: z.number().int().nonnegative(),
  subtotal: moneySchema,
  estimatedDeliveryFee: moneySchema,
  estimatedTotal: moneySchema,
  updatedAt: z.string(),
  version: z.number().int().positive(),
})

export const paymentOptionSchema = z.object({
  type: paymentMethodTypeSchema,
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  disabledReason: z.string().nullable(),
})

export const checkoutQuoteSchema = z.object({
  quoteId: z.string(),
  cartVersion: z.number().int().positive(),
  items: z.array(orderItemSchema),
  deliveryAddress: addressSnapshotSchema,
  contact: orderContactSchema,
  paymentMethod: paymentMethodTypeSchema,
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  total: moneySchema,
  expiresAt: z.string(),
  warnings: z.array(z.string()),
})

export type CartItem = z.infer<typeof cartItemSchema>
export type Cart = z.infer<typeof cartSchema>
export type PaymentOption = z.infer<typeof paymentOptionSchema>
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CheckoutQuoteRequest {
  addressId: string
  contact: CheckoutContactForm
  paymentMethod: PaymentMethodType
  cartVersion: number
}

export interface CreateOrderRequest {
  quoteId: string
  acceptedTotal: CheckoutQuote['total']
}

export const checkoutContactFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter the name of the person receiving the order.'),
  mobileNumber: z.string().trim().min(1, 'Enter a mobile number the courier can call.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address for the order receipt.')
    .email('Enter a valid email address.'),
})

export type CheckoutContactForm = z.infer<typeof checkoutContactFormSchema>

export const CART_CHANGE_OFFLINE_MESSAGE =
  'Reconnect before changing your cart. Cart changes are not queued offline.'

export const CHECKOUT_OFFLINE_MESSAGE =
  'Reconnect before placing the order. Orders are not queued offline.'

export const DEFAULT_PAYMENT_METHOD: PaymentMethodType = 'CASH_ON_DELIVERY'

// Checkout delivers to the default address, or the first one when none is marked.
export function deliveryAddressFrom(addresses: readonly Address[]): Address | null {
  return addresses.find((address) => address.isDefault) ?? addresses[0] ?? null
}

// The payment method checkout starts on: the default when enabled, else the first enabled.
export function initialPaymentMethod(options: readonly PaymentOption[]): PaymentMethodType {
  const enabled = options.filter((option) => option.enabled)
  return (
    enabled.find((option) => option.type === DEFAULT_PAYMENT_METHOD)?.type ??
    enabled[0]?.type ??
    DEFAULT_PAYMENT_METHOD
  )
}

// The quote refuses contact details under `contact.<field>`; the form names them plainly.
export function contactFieldErrors(fields: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [field, message] of Object.entries(fields)) {
    errors[field.startsWith('contact.') ? field.slice('contact.'.length) : field] = message
  }
  return errors
}

// The cart icon's accessible name and its badge, which caps at 9+.
export function cartBadge(itemCount: number) {
  return {
    label: `Cart with ${itemCount} items`,
    badge: itemCount > 9 ? '9+' : itemCount > 0 ? String(itemCount) : '',
  }
}
