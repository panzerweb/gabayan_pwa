import { flushPromises, type VueWrapper } from '@vue/test-utils'

import AddressBook from '@pages/profile/presentation/components/AddressBook.vue'

import {
  address,
  apiError,
  envelope,
  goOffline,
  meta,
  mountSignedIn,
  pageInfo,
  stubProfileRepository,
} from './support'

const repository = vi.hoisted(() => ({ current: {} as ReturnType<typeof stubProfileRepository> }))

vi.mock('@pages/profile/data/profile.repository', () => ({
  get profileRepository() {
    return repository.current
  },
}))

const secondAddress = {
  ...address,
  id: 'addr_second',
  label: 'Second pond',
  line1: '22 Rizal Avenue',
  barangay: 'Santo Angel',
  isDefault: false,
}

function page(items: unknown[]) {
  return { data: items, page: { ...pageInfo, total: items.length }, meta }
}

beforeEach(() => {
  repository.current = stubProfileRepository()
})

function control(wrapper: VueWrapper, label: string) {
  const labelElement = wrapper.findAll('label').find((item) => item.text().startsWith(label))
  if (!labelElement) throw new Error(`No label "${label}"`)
  return wrapper.get(`#${labelElement.attributes('for')}`)
}

function button(wrapper: VueWrapper, text: string) {
  const found = wrapper.findAll('button').find((item) => item.text() === text)
  if (!found) throw new Error(`No button "${text}"`)
  return found
}

async function mountWith(addresses: unknown[]) {
  repository.current.listAddresses.mockResolvedValue(page(addresses))
  const mounted = mountSignedIn(AddressBook)
  await flushPromises()
  return mounted
}

describe('AddressBook', () => {
  it('lists addresses, marks the default and offers actions only on the others', async () => {
    const { wrapper } = await mountWith([address, secondAddress])

    const cards = wrapper.findAll('.address-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.text()).toContain('Default')
    expect(cards[0]?.text()).not.toContain('Remove')
    expect(cards[1]?.text()).toContain('22 Rizal Avenue, Santo Angel, San Pablo City, Laguna 4000')
    expect(cards[1]?.text()).toContain('Make default')
  })

  it('says when there is no address yet and proposes the first one as default', async () => {
    const { wrapper } = await mountWith([])

    expect(wrapper.text()).toContain('No addresses')
    await button(wrapper, 'Add').trigger('click')
    expect((control(wrapper, 'Recipient name').element as HTMLInputElement).value).toBe(
      'Juan Dela Cruz',
    )
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('labels every address input and names the missing ones before sending', async () => {
    const { wrapper } = await mountWith([address])
    await button(wrapper, 'Add').trigger('click')

    for (const label of [
      'Address label',
      'Recipient name',
      'Mobile number',
      'Street and building',
      'Barangay',
      'City or municipality',
      'Province',
      'Region',
      'Postal code',
      'Delivery instructions (optional)',
    ]) {
      expect(control(wrapper, label).element).toBeTruthy()
    }
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const barangay = control(wrapper, 'Barangay')
    expect(wrapper.get(`#${barangay.attributes('aria-describedby')}`).text()).toBe(
      'Enter the barangay.',
    )
    expect(repository.current.createAddress).not.toHaveBeenCalled()
  })

  it('disables adding and address actions while offline, and says why', async () => {
    goOffline()
    const { wrapper } = await mountWith([address, secondAddress])

    expect(button(wrapper, 'Make default').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Remove').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Add').trigger('click')
    expect(button(wrapper, 'Add address').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Reconnect to save. Changes are not queued offline.')
  })

  it('adds an address and shows the refreshed list', async () => {
    repository.current.createAddress.mockResolvedValue(envelope(secondAddress))
    const { wrapper, toast } = await mountWith([address])
    await button(wrapper, 'Add').trigger('click')
    await control(wrapper, 'Address label').setValue('Second pond')
    await control(wrapper, 'Street and building').setValue('22 Rizal Avenue')
    await control(wrapper, 'Barangay').setValue('Santo Angel')
    await control(wrapper, 'City or municipality').setValue('San Pablo City')
    await control(wrapper, 'Province').setValue('Laguna')
    await control(wrapper, 'Region').setValue('CALABARZON')
    await control(wrapper, 'Postal code').setValue('4000')
    repository.current.listAddresses.mockResolvedValue(page([address, secondAddress]))

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(repository.current.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Second pond',
        recipientName: 'Juan Dela Cruz',
        mobileNumber: '+639171234567',
        countryCode: 'PH',
        deliveryInstructions: null,
        isDefault: false,
      }),
      'access_1',
    )
    expect(toast.messages.map((item) => item.message)).toEqual(['Address added.'])
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.findAll('.address-card')).toHaveLength(2)
  })

  it('shows the server sentence when an address cannot be removed', async () => {
    repository.current.deleteAddress.mockRejectedValue(
      apiError(409, 'CONFLICT', 'Choose another default address before deleting this one.'),
    )
    const { wrapper } = await mountWith([address, secondAddress])

    await button(wrapper, 'Remove').trigger('click')
    await flushPromises()

    expect(repository.current.deleteAddress).toHaveBeenCalledWith('addr_second', 'access_1')
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Choose another default address before deleting this one.',
    )
  })

  it('makes another address the default', async () => {
    repository.current.updateAddress.mockResolvedValue(
      envelope({ ...secondAddress, isDefault: true }),
    )
    const { wrapper, toast } = await mountWith([address, secondAddress])

    await button(wrapper, 'Make default').trigger('click')
    await flushPromises()

    expect(repository.current.updateAddress).toHaveBeenCalledWith(
      'addr_second',
      { isDefault: true },
      'access_1',
    )
    expect(toast.messages.map((item) => item.message)).toEqual(['Default address updated.'])
  })
})
