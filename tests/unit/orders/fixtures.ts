import type {
  AddressSnapshot,
  OrderDetail,
  OrderSummary,
  OrderTracking,
} from '@pages/orders/domain/orders.model'

export const farmAddress: AddressSnapshot = {
  id: 'addr_juan_home',
  label: 'Farm address',
  recipientName: 'Juan Dela Cruz',
  mobileNumber: '+639171234567',
  line1: '18 Mabini Street',
  line2: null,
  barangay: 'San Roque',
  cityMunicipality: 'San Pablo City',
  province: 'Laguna',
  region: 'CALABARZON',
  postalCode: '4000',
  countryCode: 'PH',
  deliveryInstructions: 'Call before entering the farm gate.',
}

const aeratorLine = {
  id: 'ord_item_10245_1',
  productId: 'prd_pond_aerator',
  sku: 'GBY-AER-001',
  name: 'Compact Pond Aerator',
  image: { url: '/icon.svg', alt: 'Compact pond aerator' },
  quantity: 1,
  unitPrice: { amountMinor: 129900, currency: 'PHP' as const },
  lineTotal: { amountMinor: 129900, currency: 'PHP' as const },
}

export const shippedOrder: OrderSummary = {
  id: 'ord_10245',
  orderNumber: 'GBY-10245',
  status: 'SHIPPED',
  itemCount: 1,
  previewImages: [{ url: '/icon.svg', alt: 'Compact pond aerator' }],
  total: { amountMinor: 144900, currency: 'PHP' },
  placedAt: '2026-09-18T02:15:00Z',
  estimatedDeliveryDate: '2026-09-24',
}

export const deliveredOrder: OrderSummary = {
  ...shippedOrder,
  id: 'ord_10201',
  orderNumber: 'GBY-10201',
  status: 'DELIVERED',
  itemCount: 2,
  placedAt: '2026-08-20T01:00:00Z',
}

export const cancelledOrder: OrderSummary = {
  ...shippedOrder,
  id: 'ord_10230',
  orderNumber: 'GBY-10230',
  status: 'CANCELLED',
}

export const orderDetail: OrderDetail = {
  ...shippedOrder,
  items: [aeratorLine],
  subtotal: { amountMinor: 129900, currency: 'PHP' },
  deliveryFee: { amountMinor: 15000, currency: 'PHP' },
  paymentMethod: 'CASH_ON_DELIVERY',
  paymentStatus: 'PENDING',
  deliveryAddress: farmAddress,
  contact: {
    fullName: 'Juan Dela Cruz',
    mobileNumber: '+639171234567',
    email: 'juan@example.com',
  },
  courier: { name: 'Bayanihan Express', trackingNumber: 'BX-884120', contactUrl: null },
  cancellation: null,
  updatedAt: '2026-09-20T03:30:00Z',
  version: 3,
}

export const tracking: OrderTracking = {
  orderId: 'ord_10245',
  orderNumber: 'GBY-10245',
  status: 'SHIPPED',
  courier: { name: 'Bayanihan Express', trackingNumber: 'BX-884120', contactUrl: null },
  estimatedDeliveryDate: '2026-09-24',
  deliveryAddress: farmAddress,
  events: [
    {
      id: 'trk_1',
      status: 'TO_PAY',
      label: 'Order placed',
      description: 'We received your order.',
      occurredAt: '2026-09-18T02:15:00Z',
      completed: true,
      current: false,
    },
    {
      id: 'trk_4',
      status: 'SHIPPED',
      label: 'Shipped',
      description: 'Your farm supplies are on the way.',
      occurredAt: '2026-09-20T03:30:00Z',
      completed: true,
      current: true,
    },
    {
      id: 'trk_6',
      status: 'DELIVERED',
      label: 'Delivered',
      description: 'The courier hands over your order.',
      occurredAt: null,
      completed: false,
      current: false,
    },
  ],
  items: [aeratorLine],
  total: { amountMinor: 144900, currency: 'PHP' },
}
