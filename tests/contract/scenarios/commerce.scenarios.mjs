import { describe, expect, it } from 'vitest'

import { bearer, idempotencyKey, registerAccount, signInAsDemo } from '../support/accounts.mjs'
import { AERATOR_SKU, DEMO_ORDER_NUMBER, findOrder, findProduct } from '../support/demo.mjs'
import { expectEnvelope, expectError, expectPage } from '../support/envelope.mjs'

const deliveryAddress = {
  label: 'Farm gate',
  recipientName: 'Ana Reyes',
  mobileNumber: '09181234567',
  line1: 'Purok 3, Barangay Road',
  line2: null,
  barangay: 'San Isidro',
  cityMunicipality: 'Cabanatuan City',
  province: 'Nueva Ecija',
  region: 'Central Luzon',
  postalCode: '3100',
  countryCode: 'PH',
  deliveryInstructions: 'Call on arrival.',
  isDefault: true,
}

export function registerCommerceContract(client) {
  describe('catalog and favorites', () => {
    it('reads a product detail and keeps a favourite per account', async () => {
      const { accessToken } = await registerAccount(client, 'Favourite Keeper')
      const auth = bearer(accessToken)
      const aerator = await findProduct(client, accessToken, AERATOR_SKU)

      const detail = expectEnvelope(
        await client.get(`/products/${aerator.id}`).set('Authorization', auth),
      )
      expect(detail).toMatchObject({
        id: aerator.id,
        sku: AERATOR_SKU,
        isFavorite: false,
        specifications: expect.arrayContaining([
          { label: expect.any(String), value: expect.any(String) },
        ]),
        maximumOrderQuantity: expect.any(Number),
      })

      const added = await client.put(`/products/${aerator.id}/favorite`).set('Authorization', auth)
      expect(expectEnvelope(added)).toEqual({ productId: aerator.id, isFavorite: true })
      const favourite = expectEnvelope(
        await client.get(`/products/${aerator.id}`).set('Authorization', auth),
      )
      expect(favourite.isFavorite).toBe(true)

      const removed = await client
        .delete(`/products/${aerator.id}/favorite`)
        .set('Authorization', auth)
      expect(expectEnvelope(removed)).toEqual({ productId: aerator.id, isFavorite: false })
    })
  })

  describe('cart and checkout', () => {
    it('changes, removes and clears cart lines with totals the server computes', async () => {
      const { accessToken } = await registerAccount(client, 'Cart Tester')
      const auth = bearer(accessToken)
      const products = expectPage(
        await client.get('/products?availability=AVAILABLE').set('Authorization', auth),
      )
      const [first, second] = products

      const added = expectEnvelope(
        await client
          .post('/cart/items')
          .set('Authorization', auth)
          .send({ productId: first.id, quantity: 1 }),
        201,
      )
      const line = added.items[0]
      const doubled = expectEnvelope(
        await client
          .patch(`/cart/items/${line.id}`)
          .set('Authorization', auth)
          .send({ quantity: 2 }),
      )
      expect(doubled.items[0]).toMatchObject({
        quantity: 2,
        lineTotal: { amountMinor: line.unitPrice.amountMinor * 2, currency: 'PHP' },
      })
      expect(doubled.version).toBeGreaterThan(added.version)

      const both = expectEnvelope(
        await client
          .post('/cart/items')
          .set('Authorization', auth)
          .send({ productId: second.id, quantity: 1 }),
        201,
      )
      const secondLine = both.items.find((item) => item.product.id === second.id)
      const removed = expectEnvelope(
        await client.delete(`/cart/items/${secondLine.id}`).set('Authorization', auth),
      )
      expect(removed.items.map((item) => item.id)).toEqual([line.id])
      expect(removed.subtotal).toEqual(doubled.subtotal)

      const cleared = expectEnvelope(await client.delete('/cart/items').set('Authorization', auth))
      expect(cleared).toMatchObject({
        items: [],
        itemCount: 0,
        subtotal: { amountMinor: 0, currency: 'PHP' },
        estimatedTotal: { amountMinor: 0, currency: 'PHP' },
      })
    })

    it('lists the payment options checkout offers', async () => {
      const { accessToken } = await registerAccount(client, 'Payment Reader')
      const options = expectPage(
        await client.get('/checkout/payment-options').set('Authorization', bearer(accessToken)),
      )

      expect(options).toContainEqual(
        expect.objectContaining({ type: 'CASH_ON_DELIVERY', enabled: true }),
      )
      for (const option of options) {
        expect(option).toMatchObject({ label: expect.any(String), enabled: expect.any(Boolean) })
      }
    })
  })

  describe('orders', () => {
    it('places, lists, reads and cancels an order of a new account', async () => {
      const session = await registerAccount(client, 'Ana Reyes')
      const auth = bearer(session.accessToken)
      const aerator = await findProduct(client, session.accessToken, AERATOR_SKU)
      const address = expectEnvelope(
        await client.post('/users/me/addresses').set('Authorization', auth).send(deliveryAddress),
        201,
      )
      const cart = expectEnvelope(
        await client
          .post('/cart/items')
          .set('Authorization', auth)
          .send({ productId: aerator.id, quantity: 1 }),
        201,
      )
      const quote = expectEnvelope(
        await client
          .post('/checkout/quote')
          .set('Authorization', auth)
          .send({
            addressId: address.id,
            contact: {
              fullName: 'Ana Reyes',
              mobileNumber: '09181234567',
              email: session.user.email,
            },
            paymentMethod: 'CASH_ON_DELIVERY',
            cartVersion: cart.version,
          }),
      )
      const order = expectEnvelope(
        await client
          .post('/orders')
          .set('Authorization', auth)
          .set('Idempotency-Key', idempotencyKey('cancelled-order'))
          .send({ quoteId: quote.quoteId, acceptedTotal: quote.total }),
        201,
      )

      const listed = expectPage(await client.get('/orders').set('Authorization', auth))
      expect(listed.map((summary) => summary.id)).toEqual([order.id])
      const detail = expectEnvelope(
        await client.get(`/orders/${order.id}`).set('Authorization', auth),
      )
      expect(detail).toMatchObject({
        id: order.id,
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [expect.objectContaining({ productId: aerator.id, quantity: 1 })],
        total: quote.total,
        cancellation: null,
      })

      const cancelled = expectEnvelope(
        await client
          .post(`/orders/${order.id}/cancel`)
          .set('Authorization', auth)
          .send({ reason: 'Ordered the wrong size.' }),
      )
      expect(cancelled).toMatchObject({
        status: 'CANCELLED',
        cancellation: { reason: 'Ordered the wrong size.' },
      })

      const again = await client
        .post(`/orders/${order.id}/cancel`)
        .set('Authorization', auth)
        .send({ reason: 'Still the wrong size.' })
      expectError(again, 409, 'INVALID_STATE_TRANSITION')
    })

    it('tracks the seeded shipped order step by step', async () => {
      const { accessToken } = await signInAsDemo(client)
      const auth = bearer(accessToken)
      const seeded = await findOrder(client, accessToken, DEMO_ORDER_NUMBER)

      const detail = expectEnvelope(
        await client.get(`/orders/${seeded.id}`).set('Authorization', auth),
      )
      expect(detail).toMatchObject({ orderNumber: DEMO_ORDER_NUMBER, status: 'SHIPPED' })

      const tracking = expectEnvelope(
        await client.get(`/orders/${seeded.id}/tracking`).set('Authorization', auth),
      )
      expect(tracking.events.map((event) => event.label)).toEqual([
        'Order placed',
        'Payment confirmed',
        'Preparing order',
        'Shipped',
        'Out for delivery',
        'Delivered',
      ])
      expect(tracking.events.filter((event) => event.current).map((event) => event.label)).toEqual([
        'Shipped',
      ])
    })
  })
}
