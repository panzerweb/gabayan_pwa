import { expect, test, type Page } from '@playwright/test'

// Weather alerts come from the fixture forecast (contract §12 "Weather alerts"), counted from
// the server's today. The browser clock is pinned to the seed day the journeys' mock runs on,
// so Home asks for the same day. Dagupan City, Pangasinan has hot days forecast tomorrow and
// the day after; the demo farm in San Pablo City, Laguna has none.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-23T08:00:00+08:00'))
})

function weatherCard(page: Page) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Weather alerts' }),
  })
}

test('a farm without a location is prompted to add one, then sees a heat alert on Home and in the notifications', async ({
  page,
}) => {
  test.slow()
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Rosa Villanueva')
  await page.getByLabel('Email address').fill('rosa.weather.e2e@example.com')
  await page.getByLabel('Mobile number').fill('09171234581')
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Continue with Free' }).click()
  await page.getByRole('link', { name: 'Set up later' }).click()
  await expect(page).toHaveURL(/\/app\/home$/)

  // No farm profile yet, so no location: the card asks for one and links to the farm profile.
  const card = weatherCard(page)
  await expect(card.getByRole('heading', { name: 'Add your farm’s location' })).toBeVisible()
  await card.getByRole('link', { name: 'Add farm location' }).click()
  await expect(page).toHaveURL(/\/app\/profile#farm-profile$/)

  const farmSection = page.locator('section#farm-profile')
  await farmSection.getByRole('button', { name: 'Create' }).click()
  await page.getByLabel('Farm name').fill('Villanueva Bangus Pond')
  await page.getByLabel('City or municipality').fill('Dagupan City')
  await page.getByLabel('Province').fill('Pangasinan')
  await page.getByRole('button', { name: 'Save farm profile' }).click()
  await expect(page.getByText('Farm profile updated.')).toBeVisible()

  // Home: the heat alert for the next two days, with the risk to the fish and its provenance.
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(card.getByText('Dagupan City, Pangasinan')).toBeVisible()
  const alert = card.getByRole('article', { name: /Hot weather/ })
  await expect(alert.getByRole('heading', { name: 'Hot days ahead' })).toBeVisible()
  await expect(alert.getByText('Advisory')).toBeVisible()
  await expect(alert.getByText('Thu, Sep 24 – Fri, Sep 25')).toBeVisible()
  await expect(alert.getByText(/Forecast high of 35\.3 °C air temperature/)).toBeVisible()
  await expect(alert.getByText(/Warm water holds less oxygen/)).toBeVisible()
  await expect(alert.getByText('Demo estimate')).toBeVisible()
  await expect(alert).not.toContainText(/replace the water|all the water/i)

  // Notifications: the same alert, unread once, with its explanation.
  await page.getByRole('link', { name: /unread notification/ }).click()
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
  const notification = page
    .locator('.notification-card')
    .filter({ has: page.getByRole('heading', { name: 'Hot days ahead' }) })
  await expect(notification).toHaveCount(1)
  await expect(notification).toContainText('Unread')
  await expect(notification.getByText(/Warm water holds less oxygen/)).toBeVisible()
  await notification.getByRole('button', { name: 'Mark as read' }).click()
  await expect(notification).not.toContainText('Unread')
})

test('the demo farm is told plainly when no hot or cloudy spell is coming', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Tilapia Batch #001' })).toBeVisible()

  const card = weatherCard(page)
  await expect(card.getByText('San Pablo City, Laguna')).toBeVisible()
  await expect(card.getByText(/No hot or cloudy spells are forecast/)).toBeVisible()
  await expect(card.getByRole('article')).toHaveCount(0)
})
