import { flushPromises, type VueWrapper } from '@vue/test-utils'

import CheckoutView from '@pages/cart/presentation/views/CheckoutView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { address, cart, emptyCart, paymentOptions, quote } from '../../unit/cart/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { goOffline, mountInApp, refusingRepository } from '../support/app'

const repository = vi.hoisted(() => ({ current: {} as Record<string, ReturnType<typeof vi.fn>> }))

vi.mock('@pages/cart/data/cart.repository', () => ({
  get cartRepository() {
    return repository.current
  },
}))

beforeEach(() => {
  repository.current = refusingRepository([
    'getCart',
    'listDeliveryAddresses',
    'listPaymentOptions',
    'createCheckoutQuote',
    'createOrder',
  ] as const)
  repository.current.getCart!.mockResolvedValue(envelope(cart))
  repository.current.listDeliveryAddresses!.mockResolvedValue(page([address]))
  repository.current.listPaymentOptions!.mockResolvedValue(page(paymentOptions))
})

function button(wrapper: VueWrapper, text: string) {
  const found = wrapper.findAll('button').find((item) => item.text().startsWith(text))
  if (!found) throw new Error(`No button "${text}"`)
  return found
}

async function open() {
  const mounted = await mountInApp(CheckoutView, { name: ROUTE_NAMES.checkout })
  await flushPromises()
  return mounted
}

describe('CheckoutView', () => {
  it('shows the delivery address, contact form and the only enabled payment method', async () => {
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Deliver to')
    expect(wrapper.get('h2').text()).toBe('Farm address')
    expect(wrapper.text()).toContain('18 Mabini Street, San Roque')
    expect((wrapper.get('input[name="email"]').element as HTMLInputElement).value).toBe(
      'juan@example.com',
    )
    const radios = wrapper.findAll('input[type="radio"]')
    expect((radios[0]!.element as HTMLInputElement).checked).toBe(true)
    expect(radios[1]!.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Online payment is not available in this prototype.')
  })

  it('shows the server total before the order can be placed', async () => {
    repository.current.createCheckoutQuote!.mockResolvedValue(envelope(quote))
    const { wrapper } = await open()

    await button(wrapper, 'Review final total').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Quote valid until')
    expect(button(wrapper, 'Place order').text()).toContain('₱1,449.00')
  })

  it('sends a farmer without an address to Profile to add one', async () => {
    repository.current.listDeliveryAddresses!.mockResolvedValue(page([]))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('No delivery address yet')
    expect(wrapper.get('a[href="/app/profile"]').text()).toBe('Add an address in Profile')
    expect(button(wrapper, 'Review final total').attributes('disabled')).toBeDefined()
  })

  it('shows a contact message beside its input', async () => {
    const { wrapper } = await open()

    await wrapper.get('input[name="fullName"]').setValue('')
    await button(wrapper, 'Review final total').trigger('click')
    await flushPromises()

    const input = wrapper.get('input[name="fullName"]')
    const messageId = input.attributes('aria-describedby')
    expect(wrapper.get(`#${messageId}`).text()).toBe(
      'Enter the name of the person receiving the order.',
    )
  })

  it('disables the total and the order while offline and says why', async () => {
    goOffline()
    const { wrapper } = await open()

    expect(button(wrapper, 'Review final total').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain(
      'Reconnect before placing the order. Orders are not queued offline.',
    )
  })

  it('offers the marketplace when the cart is empty', async () => {
    repository.current.getCart!.mockResolvedValue(envelope(emptyCart))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Your cart is empty')
    expect(wrapper.get('a[href="/app/marketplace"]').text()).toBe('Explore supplies')
  })
})
