import { flushPromises, type VueWrapper } from '@vue/test-utils'

import ReminderSettingsSection from '@pages/profile/presentation/components/ReminderSettingsSection.vue'

import { envelope, goOffline, mountSignedIn, settings, stubProfileRepository } from './support'

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
  const target = labelElement.attributes('for')
  return target ? wrapper.get(`#${target}`) : labelElement.get('input')
}

function saveButton(wrapper: VueWrapper) {
  const found = wrapper.findAll('button').find((item) => item.text() === 'Save preferences')
  if (!found) throw new Error('No save button')
  return found
}

async function mountWithSettings(value = settings) {
  repository.current.getNotificationSettings.mockResolvedValue(envelope(value))
  const mounted = mountSignedIn(ReminderSettingsSection)
  await flushPromises()
  return mounted
}

describe('ReminderSettingsSection', () => {
  it('labels each reminder switch and both feeding times', async () => {
    const { wrapper } = await mountWithSettings()

    for (const label of [
      'Feeding reminders',
      'Water maintenance',
      'Growth sampling',
      'Harvest reminders',
      'Order updates',
      'Educational tips',
    ]) {
      expect((control(wrapper, label).element as HTMLInputElement).checked).toBe(true)
    }
    expect((control(wrapper, 'Morning feeding time').element as HTMLInputElement).value).toBe(
      '08:00',
    )
    expect((control(wrapper, 'Afternoon feeding time').element as HTMLInputElement).value).toBe(
      '16:30',
    )
  })

  it('says under each switch what it sends, describing the water change as partial', async () => {
    const { wrapper } = await mountWithSettings()
    const help = (label: string) => {
      const describedBy = control(wrapper, label).attributes('aria-describedby')
      if (!describedBy) throw new Error(`"${label}" has no description`)
      return wrapper.get(`#${describedBy}`).text()
    }

    expect(help('Feeding reminders')).toBe(
      'A reminder at each feeding time below, with the planned amount.',
    )
    expect(help('Water maintenance')).toBe(
      'A reminder to change part of the water, by the share your species and pond type suggest. Fish cages get none.',
    )
    expect(help('Harvest reminders')).toBe(
      'An alert when a recent sample reaches the target size. You still decide when to harvest.',
    )
    for (const label of ['Growth sampling', 'Order updates', 'Educational tips']) {
      expect(help(label)).not.toBe('')
    }
  })

  it('switches the feeding times off with feeding reminders', async () => {
    const { wrapper } = await mountWithSettings()

    await control(wrapper, 'Feeding reminders').setValue(false)

    expect(control(wrapper, 'Morning feeding time').attributes('disabled')).toBeDefined()
  })

  it('asks for a feeding time while feeding reminders are on', async () => {
    const { wrapper } = await mountWithSettings()
    await control(wrapper, 'Morning feeding time').setValue('')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const morning = control(wrapper, 'Morning feeding time')
    expect(wrapper.get(`#${morning.attributes('aria-describedby')}`).text()).toBe(
      'Choose a morning feeding time.',
    )
    expect(repository.current.updateNotificationSettings).not.toHaveBeenCalled()
  })

  it('disables saving while offline and says why', async () => {
    goOffline()
    const { wrapper } = await mountWithSettings()

    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Reconnect to save. Changes are not queued offline.')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(repository.current.updateNotificationSettings).not.toHaveBeenCalled()
  })

  it('saves the preferences and shows what the server stored', async () => {
    const stored = { ...settings, feedingReminders: false, orderUpdates: false, version: 2 }
    repository.current.updateNotificationSettings.mockResolvedValue(envelope(stored))
    const { wrapper, toast } = await mountWithSettings()
    await control(wrapper, 'Feeding reminders').setValue(false)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(repository.current.updateNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({ feedingReminders: false, morningFeedingTime: '08:00' }),
      'access_1',
    )
    expect((control(wrapper, 'Order updates').element as HTMLInputElement).checked).toBe(false)
    expect(toast.messages.map((item) => item.message)).toEqual(['Notification preferences saved.'])
  })
})
