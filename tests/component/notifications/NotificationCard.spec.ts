import { mount } from '@vue/test-utils'

import NotificationCard from '@pages/notifications/presentation/components/NotificationCard.vue'

import { heatAlert, heatNotification } from '../../unit/weather-alerts/fixtures'

describe('NotificationCard', () => {
  it('shows a weather alert with its explanation, its steps and its demo provenance', () => {
    const wrapper = mount(NotificationCard, { props: { notification: heatNotification } })

    expect(wrapper.findAll('h3').map((heading) => heading.text())).toEqual(['Hot days ahead'])
    expect(wrapper.text()).toContain(heatNotification.message)
    expect(wrapper.text()).toContain(heatAlert.explanation)
    expect(wrapper.text()).toContain(heatAlert.actions[0])
    expect(wrapper.text()).toContain(heatAlert.disclaimer)
  })

  it('lets an unread weather alert, which has no action, be marked read', async () => {
    const wrapper = mount(NotificationCard, { props: { notification: heatNotification } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('read')?.[0]).toEqual([heatNotification])
  })

  it('shows no weather detail on a notification that is not a weather alert', () => {
    const wrapper = mount(NotificationCard, {
      props: {
        notification: {
          ...heatNotification,
          type: 'SYSTEM',
          category: 'SYSTEM',
          weatherAlert: null,
        },
      },
    })

    expect(wrapper.find('.weather-alert').exists()).toBe(false)
  })
})
