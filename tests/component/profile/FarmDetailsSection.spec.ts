import { flushPromises, type VueWrapper } from '@vue/test-utils'

import FarmDetailsSection from '@pages/profile/presentation/components/FarmDetailsSection.vue'

import {
  apiError,
  envelope,
  farm,
  goOffline,
  mountSignedIn,
  stubProfileRepository,
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

async function mountWithFarm() {
  repository.current.getFarmProfile.mockResolvedValue(envelope(farm))
  const mounted = mountSignedIn(FarmDetailsSection)
  await flushPromises()
  return mounted
}

describe('FarmDetailsSection', () => {
  it('shows the farm with its location and experience level', async () => {
    const { wrapper } = await mountWithFarm()

    expect(wrapper.get('h3').text()).toBe('Dela Cruz Family Fish Farm')
    expect(wrapper.text()).toContain('San Pablo City, Laguna, CALABARZON')
    expect(wrapper.text()).toContain('Beginner')
    expect(button(wrapper, 'Edit').exists()).toBe(true)
  })

  it('offers to create a farm profile when none exists yet', async () => {
    repository.current.getFarmProfile.mockRejectedValue(
      apiError(404, 'NOT_FOUND', 'No farm profile has been created yet.'),
    )
    const { wrapper } = mountSignedIn(FarmDetailsSection)
    await flushPromises()

    expect(wrapper.text()).toContain('No farm profile yet')
    await button(wrapper, 'Create').trigger('click')
    expect((control(wrapper, 'Farm name').element as HTMLInputElement).value).toBe('')
    expect((control(wrapper, 'Experience level').element as HTMLSelectElement).value).toBe(
      'BEGINNER',
    )
  })

  it('labels every farm input and names a missing farm name', async () => {
    const { wrapper } = await mountWithFarm()
    await button(wrapper, 'Edit').trigger('click')

    for (const label of [
      'Farm name',
      'City or municipality',
      'Province',
      'Region',
      'Experience level',
      'Farm notes (optional)',
    ]) {
      expect(control(wrapper, label).element).toBeTruthy()
    }
    await control(wrapper, 'Farm name').setValue(' ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const name = control(wrapper, 'Farm name')
    expect(wrapper.get(`#${name.attributes('aria-describedby')}`).text()).toBe(
      'Enter a farm name between 2 and 120 characters.',
    )
    expect(repository.current.upsertFarmProfile).not.toHaveBeenCalled()
  })

  it('disables saving while offline and says why', async () => {
    goOffline()
    const { wrapper } = await mountWithFarm()
    await button(wrapper, 'Edit').trigger('click')

    expect(button(wrapper, 'Save farm profile').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Reconnect to save. Changes are not queued offline.')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(repository.current.upsertFarmProfile).not.toHaveBeenCalled()
  })

  it('saves the farm, shows the server answer and confirms it', async () => {
    const renamed = { ...farm, name: 'Dela Cruz Aquaculture Farm', experienceLevel: 'INTERMEDIATE' }
    repository.current.upsertFarmProfile.mockResolvedValue(envelope(renamed))
    const { wrapper, toast } = await mountWithFarm()
    await button(wrapper, 'Edit').trigger('click')
    await control(wrapper, 'Farm name').setValue('Dela Cruz Aquaculture Farm')
    await control(wrapper, 'Experience level').setValue('INTERMEDIATE')
    await control(wrapper, 'Province').setValue('')
    repository.current.getFarmProfile.mockResolvedValue(envelope(renamed))

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(repository.current.upsertFarmProfile).toHaveBeenCalledWith(
      {
        name: 'Dela Cruz Aquaculture Farm',
        municipality: 'San Pablo City',
        province: null,
        region: 'CALABARZON',
        experienceLevel: 'INTERMEDIATE',
        notes: 'Small-scale freshwater pond operation.',
      },
      'access_1',
    )
    expect(wrapper.get('h3').text()).toBe('Dela Cruz Aquaculture Farm')
    expect(wrapper.text()).toContain('Intermediate')
    expect(toast.messages.map((item) => item.message)).toEqual(['Farm profile updated.'])
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('refreshes the weather alerts, notifications and Home once a new farm location is saved', async () => {
    const moved = { ...farm, municipality: 'Dagupan City', province: 'Pangasinan' }
    repository.current.upsertFarmProfile.mockResolvedValue(envelope(moved))
    const { wrapper, queryClient } = await mountWithFarm()
    const stale = [
      ['weather-alerts', 'current'],
      ['notifications', 'list'],
      ['home', 'dashboard'],
    ]
    for (const queryKey of stale) queryClient.setQueryData(queryKey, { data: null })
    queryClient.setQueryData(['orders', 'list'], { data: [] })
    await button(wrapper, 'Edit').trigger('click')
    await control(wrapper, 'City or municipality').setValue('Dagupan City')
    await control(wrapper, 'Province').setValue('Pangasinan')
    repository.current.getFarmProfile.mockResolvedValue(envelope(moved))

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    for (const queryKey of stale) {
      expect(queryClient.getQueryState(queryKey)?.isInvalidated, queryKey.join('/')).toBe(true)
    }
    expect(queryClient.getQueryState(['orders', 'list'])?.isInvalidated).toBe(false)
  })
})
