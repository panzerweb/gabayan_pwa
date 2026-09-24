import type { Cart, CheckoutQuote, PaymentOption } from '@pages/cart/domain/cart.model'

import { aerator } from '../marketplace/fixtures'
import { farmAddress, orderDetail } from '../orders/fixtures'

export { address } from '../profile/fixtures'

export const cart: Cart = {
  id: 'cart_juan',
  items: [
    {
      id: 'cart_item_1',
      product: aerator,
      quantity: 1,
      unitPrice: { amountMinor: 129900, currency: 'PHP' },
      lineTotal: { amountMinor: 129900, currency: 'PHP' },
      addedAt: '2026-09-23T01:00:00Z',
    },
  ],
  itemCount: 1,
  subtotal: { amountMinor: 129900, currency: 'PHP' },
  estimatedDeliveryFee: { amountMinor: 15000, currency: 'PHP' },
  estimatedTotal: { amountMinor: 144900, currency: 'PHP' },
  updatedAt: '2026-09-23T01:00:00Z',
  version: 2,
}

export const emptyCart: Cart = {
  ...cart,
  items: [],
  itemCount: 0,
  subtotal: { amountMinor: 0, currency: 'PHP' },
  estimatedDeliveryFee: { amountMinor: 0, currency: 'PHP' },
  estimatedTotal: { amountMinor: 0, currency: 'PHP' },
  version: 3,
}

export const paymentOptions: PaymentOption[] = [
  {
    type: 'CASH_ON_DELIVERY',
    label: 'Cash on delivery',
    description: 'Pay the courier when your order arrives.',
    enabled: true,
    disabledReason: null,
  },
  {
    type: 'GCASH',
    label: 'GCash',
    description: 'Demo option unavailable until payment integration is configured.',
    enabled: false,
    disabledReason: 'Online payment is not available in this prototype.',
  },
]

export const quote: CheckoutQuote = {
  quoteId: 'quote_1',
  cartVersion: 2,
  items: orderDetail.items,
  deliveryAddress: farmAddress,
  contact: orderDetail.contact,
  paymentMethod: 'CASH_ON_DELIVERY',
  subtotal: { amountMinor: 129900, currency: 'PHP' },
  deliveryFee: { amountMinor: 15000, currency: 'PHP' },
  total: { amountMinor: 144900, currency: 'PHP' },
  expiresAt: '2026-09-23T02:00:00Z',
  warnings: [],
}
