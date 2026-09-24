import { apiBaseUrl } from '@core/http'
import { QUERY_KEY_PREFIXES } from '@core/query'
import {
  getUnreadCountApi,
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '@pages/notifications/data/notifications.api'
import { notificationsKeys } from '@pages/notifications/data/notifications.keys'

import { envelope, page } from '../marketplace/fixtures'
import { feedingDue, notifications } from './fixtures'

function respondWith(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function sent(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access_1')
  return { path: String(url).replace(apiBaseUrl, ''), method: init.method, body: init.body }
}

describe('notifications api', () => {
  it('lists every notification, or one category', async () => {
    const allFetch = respondWith(page(notifications))
    expect((await listNotificationsApi('access_1')).data).toHaveLength(4)
    expect(sent(allFetch)).toMatchObject({ path: '/notifications?limit=100', method: 'GET' })

    const orderFetch = respondWith(page([]))
    await listNotificationsApi('access_1', 'ORDER')
    expect(sent(orderFetch).path).toBe('/notifications?limit=100&category=ORDER')
  })

  it('reads the unread count', async () => {
    const fetchMock = respondWith(envelope({ count: 3 }))

    expect((await getUnreadCountApi('access_1')).data.count).toBe(3)
    expect(sent(fetchMock)).toMatchObject({ path: '/notifications/unread-count', method: 'GET' })
  })

  it('marks one notification read by id', async () => {
    const fetchMock = respondWith(envelope({ ...feedingDue, readAt: '2026-09-23T09:00:00Z' }))

    const result = await markNotificationReadApi('ntf_feed_pm', 'access_1')

    expect(result.data.readAt).toBe('2026-09-23T09:00:00Z')
    expect(sent(fetchMock)).toMatchObject({
      path: '/notifications/ntf_feed_pm/read',
      method: 'POST',
      body: undefined,
    })
  })

  it('marks all read with no body, or narrowed to a category', async () => {
    const allFetch = respondWith(envelope({ count: 0 }))
    await markAllNotificationsReadApi('access_1')
    expect(sent(allFetch)).toMatchObject({
      path: '/notifications/read-all',
      method: 'POST',
      body: undefined,
    })

    const categoryFetch = respondWith(envelope({ count: 2 }))
    expect((await markAllNotificationsReadApi('access_1', { category: 'ORDER' })).data.count).toBe(
      2,
    )
    expect(sent(categoryFetch).body).toBe(JSON.stringify({ category: 'ORDER' }))
  })
})

describe('notifications keys', () => {
  it('keeps every list under the notifications prefix task and order writes invalidate', () => {
    for (const key of [notificationsKeys.list('all'), notificationsKeys.unreadCount()]) {
      expect(key.slice(0, 1)).toEqual([...QUERY_KEY_PREFIXES.notifications])
    }
    expect(notificationsKeys.list('ORDER')).toEqual(['notifications', 'list', 'ORDER'])
  })
})
