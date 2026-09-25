import { mount } from '@vue/test-utils'

import NotificationCard from '@pages/notifications/presentation/components/NotificationCard.vue'
import NotificationReminderDetail from '@pages/notifications/presentation/components/NotificationReminderDetail.vue'

import { feedingDue } from '../../unit/notifications/fixtures'
import {
  feedingDetail,
  harvestAlert,
  harvestDetail,
  waterChangeDetail,
  waterChangeDue,
} from '../../unit/notifications/reminder-fixtures'

describe('NotificationReminderDetail', () => {
  it('shows the water-change share as a partial change with the demo disclaimer', () => {
    const wrapper = mount(NotificationReminderDetail, {
      props: { type: 'WATER_CHANGE_DUE', reminder: waterChangeDetail },
    })

    expect(wrapper.text()).toContain(
      'Change about 30% of the water, a little at a time, and keep the rest in place.',
    )
    const provenance = wrapper.get('aside[aria-label="About this reminder"]')
    expect(provenance.text()).toContain('Demo estimate')
    expect(provenance.text()).toContain('A demo schedule, not yet reviewed for your farm.')
    expect(provenance.text()).toContain('Rule demo-2026-09-gabayan')
    expect(wrapper.text()).not.toContain('You decide')
  })

  it('leaves the harvest decision to the grower and shows the day window only as a hint', () => {
    const wrapper = mount(NotificationReminderDetail, {
      props: { type: 'HARVEST_APPROACHING', reminder: harvestDetail },
    })

    expect(wrapper.text()).toContain('Latest sample: 380 g. Demo target: 350–450 g.')
    expect(wrapper.text()).toContain('You decide when the size is right for your buyers.')
    expect(wrapper.get('.reminder-detail__hint').text()).toContain(
      'around 120–150 days after stocking. Use that only as a rough guide',
    )
    expect(wrapper.text()).toContain('Harvest readiness is an estimate, not a guarantee.')
  })

  it('shows only the provenance for a feeding reminder, and none once the figures are verified', async () => {
    const wrapper = mount(NotificationReminderDetail, {
      props: { type: 'FEEDING_DUE', reminder: feedingDetail },
    })
    expect(wrapper.findAll('.reminder-detail__lead')).toHaveLength(0)
    expect(wrapper.text()).toContain('Observe feeding response and local conditions.')

    await wrapper.setProps({
      reminder: { ...feedingDetail, isDemo: false, sourceStatus: 'VERIFIED' },
    })
    expect(wrapper.find('aside').exists()).toBe(false)
  })
})

describe('NotificationCard with a reminder', () => {
  it('adds the reminder figures under the message and keeps the deep-link action', async () => {
    const wrapper = mount(NotificationCard, { props: { notification: waterChangeDue } })

    expect(wrapper.text()).toContain('Partial water change due')
    expect(wrapper.text()).toContain('Change about 30% of the water')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('open')?.[0]).toEqual([waterChangeDue])
  })

  it('shows the harvest alert saying the grower decides', () => {
    const wrapper = mount(NotificationCard, { props: { notification: harvestAlert } })

    expect(wrapper.text()).toContain('Your fish may be near harvest size')
    expect(wrapper.text()).toContain('You decide when the size is right')
    expect(wrapper.get('button').text()).toBe('Check harvest readiness')
  })

  it('shows no reminder figures on a notification without them', () => {
    const wrapper = mount(NotificationCard, { props: { notification: feedingDue } })

    expect(wrapper.find('.reminder-detail').exists()).toBe(false)
  })
})
