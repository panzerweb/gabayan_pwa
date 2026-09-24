import { flushPromises } from '@vue/test-utils'

import PersonalDetailsSection from '@pages/profile/presentation/components/PersonalDetailsSection.vue'

import {
  apiError,
  envelope,
  goOffline,
  mountSignedIn,
  stubProfileRepository,
  user,
} from './support'

const repository = vi.hoisted(() => ({ current: {} as ReturnType<typeof stubProfileRepository> }))

vi.mock('@pages/profile/data/profile.repository', () => ({
  get profileRepository() {
    return repository.current
  },
}))

beforeEach(() => {
  repository.current = stubProfileRepository()
})

async function openEditor() {
  const mounted = mountSignedIn(PersonalDetailsSection)
  await mounted.wrapper.get('button.button--text').trigger('click')
  await flushPromises()
  return mounted
}

function inputLabelled(wrapper: Awaited<ReturnType<typeof openEditor>>['wrapper'], label: string) {
  const labelElement = wrapper.findAll('label').find((item) => item.text().startsWith(label))
  if (!labelElement) throw new Error(`No label "${label}"`)
  return wrapper.get(`#${labelElement.attributes('for')}`)
}

describe('PersonalDetailsSection', () => {
  it('shows the mobile number and timezone, and labels both inputs of the editor', async () => {
    const { wrapper } = await openEditor()

    expect(wrapper.text()).toContain('+639171234567')
    expect(wrapper.text()).toContain('Asia/Manila')
    expect((inputLabelled(wrapper, 'Full name').element as HTMLInputElement).value).toBe(
      'Juan Dela Cruz',
    )
    expect((inputLabelled(wrapper, 'Mobile number').element as HTMLInputElement).value).toBe(
      '+639171234567',
    )
  })

  it('names the field to fix before sending anything', async () => {
    const { wrapper } = await openEditor()
    await inputLabelled(wrapper, 'Full name').setValue('J')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const fullName = inputLabelled(wrapper, 'Full name')
    expect(fullName.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get(`#${fullName.attributes('aria-describedby')}`).text()).toBe(
      'Enter a name between 2 and 100 characters.',
    )
    expect(repository.current.updateCurrentUser).not.toHaveBeenCalled()
  })

  it('disables saving while offline and says why', async () => {
    goOffline()
    const { wrapper } = await openEditor()

    const save = wrapper.findAll('button').find((button) => button.text() === 'Save details')
    expect(save?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Reconnect to save. Changes are not queued offline.')

    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(repository.current.updateCurrentUser).not.toHaveBeenCalled()
    expect(wrapper.get('.form-error').text()).toBe(
      'Reconnect before saving profile changes. Changes are not queued offline.',
    )
  })

  it('saves, replaces the signed-in user with the answer and confirms it', async () => {
    const updated = { ...user, fullName: 'Juan D. Cruz', version: 2 }
    repository.current.updateCurrentUser.mockResolvedValue(envelope(updated))
    const { wrapper, session, toast } = await openEditor()
    await inputLabelled(wrapper, 'Full name').setValue('  Juan D. Cruz ')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(repository.current.updateCurrentUser).toHaveBeenCalledWith(
      { fullName: 'Juan D. Cruz', mobileNumber: '+639171234567' },
      'access_1',
    )
    expect(session.user).toEqual(updated)
    expect(toast.messages.map((item) => item.message)).toEqual(['Personal details updated.'])
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('puts a refused mobile number beside its input', async () => {
    repository.current.updateCurrentUser.mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Review your profile details.', {
        mobileNumber: ['Enter a valid Philippine mobile number.'],
      }),
    )
    const { wrapper } = await openEditor()
    await inputLabelled(wrapper, 'Mobile number').setValue('12345')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const mobile = inputLabelled(wrapper, 'Mobile number')
    expect(wrapper.get(`#${mobile.attributes('aria-describedby')}`).text()).toBe(
      'Enter a valid Philippine mobile number.',
    )
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
