import { expect, test, type Page } from '@playwright/test'

// Reminders are raised by the server as Home and the notifications are read, at the server's
// time. The browser clock and the mock's (through its test-only X-Mock-Now header) are moved
// together through 2026-09-25, two days after the seed day: Tilapia Batch #001 was stocked on
// 2026-08-07, so that day opens a new weekly water-change slot, and its 08:00 and 16:30
// feeding times have not been decided yet.
const DAY = '2026-09-25'
const FULL_WATER_CHANGE = /\b(all|whole|entire)\b[^.]*\bwater\b|replace the water/i

let serverNow = `${DAY}T07:00:00+08:00`

// Requests a service worker makes are not routed, and would reach the mock without the header.
test.use({ serviceWorkers: 'block' })

async function setTime(page: Page, time: string) {
  serverNow = `${DAY}T${time}:00+08:00`
  await page.clock.setFixedTime(new Date(serverNow))
}

test.beforeEach(async ({ page }) => {
  await setTime(page, '07:00')
  await page.route('**/api/v1/**', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-mock-now': serverNow } }),
  )
})

async function openNotifications(page: Page) {
  await page.getByRole('link', { name: 'Home' }).click()
  await page.getByRole('link', { name: /notification/i }).click()
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
}

async function setFeedingReminders(page: Page, on: boolean) {
  await page.getByRole('link', { name: 'Profile' }).click()
  const feeding = page.getByLabel('Feeding reminders')
  await expect(feeding).toBeVisible()
  await feeding.setChecked(on)
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Notification preferences saved.')).toBeVisible()
}

function unreadCard(page: Page, title: string) {
  return page
    .locator('.notification-card')
    .filter({ has: page.getByRole('heading', { name: title }) })
    .filter({ hasText: 'Unread' })
    .filter({ hasText: 'Tilapia Batch #001' })
}

test('feeding, water-change and harvest reminders appear once, and not with the switch off', async ({
  page,
}) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Tilapia Batch #001' })).toBeVisible()

  // Before the morning feeding time, with feeding reminders on.
  await setFeedingReminders(page, true)
  await expect(page.getByText('A reminder at each feeding time below')).toBeVisible()
  await expect(page.getByLabel('Morning feeding time')).toHaveValue('08:00')

  // Just after 08:00: the morning feeding and this week's partial water change.
  await setTime(page, '08:05')
  await openNotifications(page)
  const today = page.getByRole('region', { name: 'Today' })
  const feeding = unreadCard(page, 'Morning feeding is due')
  await expect(feeding).toHaveCount(1)
  await expect(feeding).toContainText('planned feeding at 8:00 AM')
  await expect(feeding).toContainText('Planned amount:')
  await expect(feeding).toContainText('Demo estimate')

  const waterChange = unreadCard(page, 'Partial water change due')
  await expect(waterChange).toHaveCount(1)
  await expect(waterChange).toContainText(
    'Change about 30% of the water, a little at a time, and keep the rest in place.',
  )
  await expect(waterChange).toContainText('Demo estimate')
  await expect(today.getByText(FULL_WATER_CHANGE)).toHaveCount(0)

  // Reading again raises nothing twice; the reminder leads to the day's feeding task.
  await page.reload()
  await expect(unreadCard(page, 'Morning feeding is due')).toHaveCount(1)
  await expect(unreadCard(page, 'Partial water change due')).toHaveCount(1)
  await feeding.getByRole('button', { name: 'Review task' }).click()
  await expect(page).toHaveURL(/\/app\/cultivations\/[^/?]+\/tasks\?taskId=/)
  // The seed day's morning feeding is done; today's is still open.
  const openFeeding = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Morning feeding' }) })
    .filter({ hasNotText: 'Done' })
  await expect(openFeeding).toHaveCount(1)
  await expect(openFeeding).toContainText('Give the planned morning portion')

  // A current sample inside the demo target raises the harvest alert.
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Batch #001/ }).click()
  await page.getByRole('link', { name: /Growth Measurements and chart/ }).click()
  await page.getByRole('button', { name: 'Add record' }).click()
  await expect(page.getByLabel('Measurement date')).toHaveValue(DAY)
  await page.getByLabel('Fish sampled').fill('15')
  await page.getByLabel('Average fish weight').fill('380')
  await page.getByRole('button', { name: 'Save growth record' }).click()
  await expect(page.getByText('Growth record saved.')).toBeVisible()

  await setTime(page, '08:20')
  await openNotifications(page)
  const harvest = unreadCard(page, 'Your fish may be near harvest size')
  await expect(harvest).toHaveCount(1)
  await expect(harvest).toContainText('Latest sample: 380 g. Demo target: 350–450 g.')
  await expect(harvest).toContainText('You decide when the size is right for your buyers.')
  await expect(harvest).toContainText('around 120–150 days after stocking')
  await harvest.getByRole('button', { name: 'Check harvest readiness' }).click()
  await expect(page).toHaveURL(/\/app\/cultivations\/[^/?]+\/harvest$/)

  // With feeding reminders off, the afternoon feeding time passes without a reminder.
  await setFeedingReminders(page, false)
  await setTime(page, '16:35')
  await openNotifications(page)
  await expect(today.getByRole('heading', { name: 'Morning feeding is due' }).first()).toBeVisible()
  await expect(today.getByRole('heading', { name: 'Afternoon feeding is due' })).toHaveCount(0)
})
