import { flushPromises, type DOMWrapper, type VueWrapper } from '@vue/test-utils'

import NotificationsView from '@pages/notifications/presentation/views/NotificationsView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope, page } from '../../unit/marketplace/fixtures'
import {
  feedingDue,
  lateNightCheck,
  notifications,
  orderShipped,
} from '../../unit/notifications/fixtures'
import { mountInApp } from '../support/app'

const repository = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

vi.mock('@pages/notifications/data/notifications.repository', () => ({
  notificationsRepository: repository,
}))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-23T17:00:00+08:00'))
  repository.listNotifications.mockReset().mockResolvedValue(page(notifications))
  repository.markNotificationRead
    .mockReset()
    .mockImplementation((id: string) =>
      Promise.resolve(envelope({ ...feedingDue, id, readAt: '2026-09-23T09:00:00Z' })),
    )
  repository.markAllNotificationsRead.mockReset().mockResolvedValue(envelope({ count: 0 }))
})

afterEach(() => {
  vi.useRealTimers()
})

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(NotificationsView, { name: ROUTE_NAMES.notifications, query })
  await flushPromises()
  return mounted
}

function card(wrapper: VueWrapper, title: string) {
  const found = wrapper.findAll('.notification-card').find((item) => item.text().includes(title))
  if (!found) throw new Error(`No notification "${title}"`)
  return found
}

type Searchable = { findAll(selector: string): DOMWrapper<Element>[] }

function button(root: Searchable, label: string) {
  const found = root.findAll('button').find((item) => item.text() === label)
  if (!found) throw new Error(`No button "${label}"`)
  return found
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

describe('NotificationsView', () => {
  it('groups notifications under Manila dates with the category in words', async () => {
    const { wrapper } = await open()

    expect(wrapper.findAll('h2').map((heading) => heading.text())).toEqual([
      'Today',
      'Yesterday',
      'Sep 20, 2026',
    ])
    expect(card(wrapper, 'Night water observation').text()).toContain('Cultivation')
    expect(card(wrapper, 'Night water observation').text()).toContain('Unread')
    expect(card(wrapper, 'Your order is on the way').text()).toContain('Order')
    expect(card(wrapper, 'Afternoon feeding is due').text()).toContain('Planned amount: 1.2 kg')
    expect(card(wrapper, 'Look for changes in feeding response').text()).not.toContain('Unread')
  })

  it('keeps the chosen filter in the route query and asks the API for that category', async () => {
    const { wrapper, router } = await open()

    await button(wrapper, 'Orders').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ category: 'ORDER' })
    expect(repository.listNotifications).toHaveBeenLastCalledWith('access_1', 'ORDER')
    expect(button(wrapper, 'Orders').attributes('aria-pressed')).toBe('true')
  })

  it('opens on the filter a shared link names and says when nothing matches', async () => {
    repository.listNotifications.mockResolvedValue(page([]))
    const { wrapper } = await open({ category: 'EDUCATION' })

    expect(repository.listNotifications).toHaveBeenCalledWith('access_1', 'EDUCATION')
    expect(button(wrapper, 'Learning').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('Nothing here yet')
  })

  it('shows a notification as read before the server answers, then refreshes lists and Home', async () => {
    const answer = deferred<unknown>()
    repository.markNotificationRead.mockReturnValue(answer.promise)
    const { wrapper, queryClient } = await open()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await button(card(wrapper, 'Night water observation'), 'Mark as read').trigger('click')
    await flushPromises()

    expect(repository.markNotificationRead).toHaveBeenCalledWith(lateNightCheck.id, 'access_1')
    expect(card(wrapper, 'Night water observation').text()).not.toContain('Unread')
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['notifications'] })

    answer.resolve(envelope({ ...lateNightCheck, readAt: '2026-09-23T09:00:00Z' }))
    await flushPromises()

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['home'] })
  })

  it('puts the unread state back and says so when marking read fails', async () => {
    repository.markNotificationRead.mockRejectedValue(new TypeError('Failed to fetch'))
    repository.listNotifications
      .mockResolvedValueOnce(page(notifications))
      .mockReturnValue(new Promise(() => {}))
    const { wrapper, toast } = await open()

    await button(card(wrapper, 'Night water observation'), 'Mark as read').trigger('click')
    await flushPromises()

    expect(card(wrapper, 'Night water observation').text()).toContain('Unread')
    expect(toast.messages.map((item) => item.message)).toContain(
      'We couldn’t mark that notification as read. Please try again.',
    )
  })

  it('marks a notification read and follows its deep link', async () => {
    const { wrapper, router } = await open()

    await button(wrapper, 'Review task').trigger('click')
    await flushPromises()

    expect(repository.markNotificationRead).toHaveBeenCalledWith(feedingDue.id, 'access_1')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.cultivationTasks)
    expect(router.currentRoute.value.query).toEqual({ taskId: 'task_feed_pm' })
  })

  it('stays on the list when a deep link matches no screen', async () => {
    repository.listNotifications.mockResolvedValue(
      page([{ ...feedingDue, action: { label: 'Review task', deepLink: '/app/retired-screen' } }]),
    )
    const { wrapper, router } = await open()

    await button(wrapper, 'Review task').trigger('click')
    await flushPromises()

    expect(repository.markNotificationRead).toHaveBeenCalledWith(feedingDue.id, 'access_1')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.notifications)
  })

  it('marks only the filtered category read from a filtered list', async () => {
    repository.listNotifications.mockResolvedValue(page([orderShipped]))
    const { wrapper } = await open({ category: 'ORDER' })

    await button(wrapper, 'Mark all read').trigger('click')
    await flushPromises()

    expect(repository.markAllNotificationsRead).toHaveBeenCalledWith('access_1', {
      category: 'ORDER',
    })
  })

  it('marks everything read from All, and hides the action once nothing is unread', async () => {
    const { wrapper } = await open()
    repository.listNotifications.mockResolvedValue(
      page(notifications.map((item) => ({ ...item, readAt: '2026-09-23T09:00:00Z' }))),
    )

    await button(wrapper, 'Mark all read').trigger('click')
    await flushPromises()

    expect(repository.markAllNotificationsRead).toHaveBeenCalledWith('access_1', undefined)
    expect(wrapper.findAll('button').some((item) => item.text() === 'Mark all read')).toBe(false)
  })

  it('offers a retry when the list fails to load', async () => {
    repository.listNotifications.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { wrapper } = await open()

    await button(wrapper, 'Try Again').trigger('click')
    await flushPromises()

    expect(repository.listNotifications).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Afternoon feeding is due')
  })
})
