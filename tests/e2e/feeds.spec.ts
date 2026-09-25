import { expect, test } from '@playwright/test'

// The feeding plan is read for today, and the seed is written for 2026-09-23 (Asia/Manila),
// so the clock is pinned to that day.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-23T08:00:00+08:00'))
})

test('the feeding plan of Tilapia Batch #001 shows the feed for its stage and Buy now opens it', async ({
  page,
}) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Batch #001/ }).click()
  await page.getByRole('link', { name: /Farm records/ }).click()
  await page.getByRole('button', { name: 'Feed plan' }).click()

  await expect(page.getByText('Daily demo estimate')).toBeVisible()
  const feed = page.getByRole('region', { name: 'Feed for the Growing stage' })
  await expect(feed).toContainText('Tilapia grower pellets, floating')
  await expect(feed).toContainText('28–32%')
  await expect(feed).toContainText('2–4 mm')
  await expect(feed).toContainText('2 feedings a day')
  await expect(feed.getByText('Demo figures, not yet reviewed')).toBeVisible()
  await expect(feed).toContainText('Typical figures from commercial feed labels')

  // The whole guide marks the batch's stage and returns to the feed plan.
  await feed.getByRole('link', { name: 'See the whole Tilapia feed guide' }).click()
  await expect(page).toHaveURL(/\/app\/species\/sp_tilapia\/feed-guide\?/)
  await expect(page.getByRole('heading', { name: 'Growing stage' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pre-harvest stage' })).toBeVisible()
  await expect(page.getByText('Your fish now')).toHaveCount(1)
  await expect(page.getByText('No matching feed in the shop yet.')).toBeVisible()
  await page.getByRole('link', { name: 'Go back' }).click()
  await expect(page).toHaveURL(/\/records\?tab=plan$/)

  await page
    .getByRole('region', { name: 'Feed for the Growing stage' })
    .getByRole('link', { name: 'Buy now: Tilapia Grower Feed 20 kg' })
    .click()
  await expect(page).toHaveURL(
    /\/app\/products\/prd_grower_feed\?quantity=1&cultivationId=cul_tilapia_001$/,
  )
  await expect(page.getByRole('heading', { name: 'Tilapia Grower Feed 20 kg' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Quantity' })).toContainText('1')

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  expect(await navigation.getByRole('link').allTextContents()).toEqual([
    'Home',
    'Cultivations',
    'Orders',
    'Profile',
  ])
})
