import {
  cartBadge,
  checkoutContactFormSchema,
  checkoutQuoteSchema,
  contactFieldErrors,
  deliveryAddressFrom,
  initialPaymentMethod,
} from '@pages/cart/domain/cart.model'
import { zodFieldErrors } from '@core/utils/validation'

import { address, paymentOptions, quote } from './fixtures'

const secondAddress = { ...address, id: 'addr_second', label: 'Second pond', isDefault: false }

describe('cart model', () => {
  it('delivers to the default address, or the first one when none is marked', () => {
    expect(deliveryAddressFrom([secondAddress, address])?.id).toBe('addr_juan_home')
    expect(deliveryAddressFrom([secondAddress])?.id).toBe('addr_second')
    expect(deliveryAddressFrom([])).toBeNull()
  })

  it('starts checkout on cash on delivery, or on the first enabled option without it', () => {
    expect(initialPaymentMethod(paymentOptions)).toBe('CASH_ON_DELIVERY')
    expect(
      initialPaymentMethod([
        { ...paymentOptions[0]!, enabled: false },
        { ...paymentOptions[1]!, enabled: true },
      ]),
    ).toBe('GCASH')
  })

  it('names the contact fields the quote refused as the form names them', () => {
    expect(
      contactFieldErrors({ 'contact.email': 'Enter a valid email.', addressId: 'Unknown.' }),
    ).toEqual({ email: 'Enter a valid email.', addressId: 'Unknown.' })
  })

  it('asks for every contact detail with a sentence a farmer can act on', () => {
    const parsed = checkoutContactFormSchema.safeParse({
      fullName: ' ',
      mobileNumber: '',
      email: 'juan@',
    })

    expect(parsed.success).toBe(false)
    expect(zodFieldErrors(parsed.error!)).toEqual({
      fullName: 'Enter the name of the person receiving the order.',
      mobileNumber: 'Enter a mobile number the courier can call.',
      email: 'Enter a valid email address.',
    })
  })

  it('names the cart icon by its item count and caps the badge at 9+', () => {
    expect(cartBadge(0)).toEqual({ label: 'Cart with 0 items', badge: '' })
    expect(cartBadge(3)).toEqual({ label: 'Cart with 3 items', badge: '3' })
    expect(cartBadge(12)).toEqual({ label: 'Cart with 12 items', badge: '9+' })
  })

  it('parses a quote whose address snapshot carries no audit fields', () => {
    expect(checkoutQuoteSchema.parse(quote).deliveryAddress.label).toBe('Farm address')
  })
})
