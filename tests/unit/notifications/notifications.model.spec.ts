import {
  categoryOf,
  countUnread,
  groupNotificationsByDate,
  notificationCategoryDisplay,
  notificationDateLabel,
  notificationFilterFrom,
  notificationSchema,
  withAllNotificationsRead,
  withNotificationRead,
} from '@pages/notifications/domain/notifications.model'

import { feedingDue, feedingTip, lateNightCheck, notifications, orderShipped } from './fixtures'

const READ_AT = '2026-09-23T09:00:00Z'

describe('notifications model', () => {
  it('parses a notification and refuses a deep link that is not an app path', () => {
    expect(notificationSchema.parse(feedingDue).action?.label).toBe('Review task')
    expect(
      notificationSchema.safeParse({
        ...feedingDue,
        action: { label: 'Open', deepLink: 'https://example.com' },
      }).success,
    ).toBe(false)
  })

  it('reads the filter from the route query and falls back to all', () => {
    expect(notificationFilterFrom('ORDER')).toBe('ORDER')
    expect(notificationFilterFrom('SYSTEM')).toBe('all')
    expect(notificationFilterFrom(undefined)).toBe('all')
    expect(categoryOf('all')).toBeUndefined()
    expect(categoryOf('EDUCATION')).toBe('EDUCATION')
  })

  it('names each category in words with an icon', () => {
    expect(notificationCategoryDisplay('EDUCATION')).toEqual({
      label: 'Learning',
      tone: 'warning',
      icon: 'star',
    })
    expect(notificationCategoryDisplay('ORDER').label).toBe('Order')
  })

  it('labels dates relative to today in Manila', () => {
    expect(notificationDateLabel('2026-09-23', '2026-09-23')).toBe('Today')
    expect(notificationDateLabel('2026-09-22', '2026-09-23')).toBe('Yesterday')
    expect(notificationDateLabel('2026-08-31', '2026-09-01')).toBe('Yesterday')
    expect(notificationDateLabel('2026-09-20', '2026-09-23')).toBe('Sep 20, 2026')
  })

  it('groups by the Manila date each notification occurred on, keeping the server order', () => {
    const groups = groupNotificationsByDate(notifications, '2026-09-23')

    expect(groups.map((group) => group.label)).toEqual(['Today', 'Yesterday', 'Sep 20, 2026'])
    expect(groups[0]?.notifications.map((item) => item.id)).toEqual([
      feedingDue.id,
      lateNightCheck.id,
    ])
    expect(groups[1]?.notifications).toEqual([orderShipped])
    expect(groups[2]?.notifications).toEqual([feedingTip])
  })

  it('marks one notification read without touching the others or an earlier read time', () => {
    const updated = withNotificationRead(notifications, feedingDue.id, READ_AT)

    expect(updated[0]?.readAt).toBe(READ_AT)
    expect(countUnread(updated)).toBe(2)
    expect(withNotificationRead(notifications, feedingTip.id, READ_AT)[3]?.readAt).toBe(
      feedingTip.readAt,
    )
  })

  it('marks every notification read, or only one category', () => {
    expect(countUnread(withAllNotificationsRead(notifications, READ_AT))).toBe(0)

    const ordersOnly = withAllNotificationsRead(notifications, READ_AT, 'ORDER')
    expect(ordersOnly.find((item) => item.id === orderShipped.id)?.readAt).toBe(READ_AT)
    expect(countUnread(ordersOnly)).toBe(2)
  })
})
