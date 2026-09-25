import { expect, type Page, test } from '@playwright/test'

// The cultivation screens count days from today, and the seed is written for 2026-09-23
// (Asia/Manila), so the clock is pinned to that day.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-23T08:00:00+08:00'))
})

// The product page a "Buy now" opened: the preset quantity, the installation guide, and a
// cart that takes the item. The shop stays a header link and never a fifth tab.
async function expectAeratorReadyToBuy(page: Page) {
  await expect(page.getByRole('heading', { name: 'Compact Pond Aerator' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Quantity' })).toContainText('1')
  await expect(
    page.getByText('Suggested quantity for your need: 1. You can change it.'),
  ).toBeVisible()

  await expect(page.getByRole('heading', { name: 'How to install' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Safety cautions' })).toContainText(
    'Switch off and unplug the aerator',
  )
  const steps = page.getByRole('list', { name: 'Installation steps' }).getByRole('listitem')
  await expect(steps).toHaveCount(4)
  await expect(steps.first()).toContainText('Choose a spot')
  await expect(page.getByText('Demo guide.')).toBeVisible()

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  expect(await navigation.getByRole('link').allTextContents()).toEqual([
    'Home',
    'Cultivations',
    'Orders',
    'Profile',
  ])

  await page.getByRole('button', { name: /Add to cart · ₱1,299\.00/ }).click()
  await expect(page.getByText('Added to cart.')).toBeVisible()
}

test('Buy now on a setup recommendation opens the aerator with its guide and it reaches the cart', async ({
  page,
}) => {
  // Account, plan and every setup step, each compiled on its first visit.
  test.slow()
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Rosa Mercado')
  await page.getByLabel('Email address').fill('rosa.buynow@example.com')
  await page.getByLabel('Mobile number').fill('09171234592')
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Continue with Free' }).click()
  await page.getByRole('link', { name: 'Start setup' }).click()

  await page.getByRole('radio', { name: /Tilapia/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Pond/ }).click()
  await expect(page.getByText('This setup can be planned')).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Good water for your stock' })).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Got it' }).click()
  await page.getByLabel('Length').fill('5')
  await page.getByLabel('Width').fill('4')
  await page.getByLabel('Average water depth').fill('1.5')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Planned fingerlings').fill('500')
  await page.getByRole('button', { name: 'Calculate estimate' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your plan is within the demo range' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Review cultivation' }).click()
  await page.getByRole('button', { name: 'Create cultivation' }).click()
  await expect(page.getByRole('heading', { name: 'Your cultivation is ready' })).toBeVisible()

  await page.getByRole('link', { name: 'Buy now: Compact Pond Aerator' }).click()
  await expect(page).toHaveURL(/\/app\/products\/prd_pond_aerator\?quantity=1&cultivationId=/)
  await expectAeratorReadyToBuy(page)

  await page.getByRole('link', { name: 'Cart with 1 items' }).click()
  await expect(page.getByText('Compact Pond Aerator')).toBeVisible()
})

test('Buy now on a low-oxygen safety check opens the aerator and it reaches the cart', async ({
  page,
}) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Batch #001/ }).click()
  await page.getByRole('link', { name: /Water safety check/ }).click()

  await page.getByLabel('Dissolved oxygen (mg/L)').fill('1.5')
  await page.getByRole('button', { name: 'Check readings' }).click()
  const oxygen = page
    .getByRole('list', { name: 'Your readings' })
    .getByRole('listitem')
    .filter({ hasText: /^Dissolved oxygen/ })
    .first()
  await expect(oxygen).toContainText('Below range')
  const products = page.getByRole('region', {
    name: 'Products that may help with Dissolved oxygen',
  })
  await expect(products).toContainText('adds oxygen to the water')

  await products.getByRole('link', { name: 'Buy now: Compact Pond Aerator' }).click()
  await expect(page).toHaveURL(/\/app\/products\/prd_pond_aerator\?quantity=1$/)
  await expectAeratorReadyToBuy(page)

  // The demo farmer's cart is shared with the commerce journey, so the line is removed again.
  await page.getByRole('link', { name: /^Cart with \d+ items$/ }).click()
  await expect(page.getByText('Compact Pond Aerator')).toBeVisible()
  await page.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('Compact Pond Aerator')).toBeHidden()

  await page.getByRole('link', { name: 'Orders' }).click()
  await expect(page.getByRole('link', { name: 'Shop' })).toBeVisible()
})
