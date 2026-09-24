import { expect, test, type Page } from '@playwright/test'

async function createAccount(page: Page, fullName: string, email: string, mobileNumber: string) {
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill(fullName)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Mobile number').fill(mobileNumber)
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/setup\/plan$/)
}

// Runs the setup wizard from its introduction up to the review step, for an in-range
// Tilapia pond.
async function planTilapiaPond(page: Page) {
  await page.getByRole('link', { name: 'Start setup' }).click()
  await page.getByRole('radio', { name: /Tilapia/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Pond/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Good water for your stock' })).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByLabel('Length').fill('5')
  await page.getByLabel('Width').fill('4')
  await page.getByLabel('Average water depth').fill('1.5')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Planned fingerlings').fill('500')
  await page.getByRole('button', { name: 'Calculate estimate' }).click()
  await page.getByRole('link', { name: 'Review cultivation' }).click()
}

test('new farmer compares plans, asks for Pro, and sees the plan in Profile', async ({ page }) => {
  await createAccount(page, 'Ana Villanueva', 'ana.tiers@example.com', '09171234571')

  await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^Free/ })).toBeChecked()
  const pro = page.locator('article').filter({ has: page.getByRole('radio', { name: /^Pro/ }) })
  await expect(pro.getByText('Pricing coming soon')).toBeVisible()
  await expect(pro.getByText('Up to 10 culture systems')).toBeVisible()

  await page.getByRole('radio', { name: /^Pro/ }).check()
  await page.getByRole('button', { name: 'Request Pro and continue' }).click()
  await expect(
    page.getByText('Pro request sent. You stay on Free until it is reviewed.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/setup$/)

  await page.getByRole('link', { name: 'Set up later' }).click()
  await page.getByRole('link', { name: 'Profile' }).click()
  const plan = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Your plan' }),
  })
  await expect(plan.getByText('Free', { exact: true })).toBeVisible()
  await expect(plan.getByText('1 culture system', { exact: true })).toBeVisible()
  await expect(plan.getByText('0 of 1 culture system in use')).toBeVisible()
  await expect(plan.getByText('Pro request pending')).toBeVisible()

  await plan.getByRole('link', { name: 'See plans' }).click()
  await expect(page).toHaveURL(/\/app\/plans$/)
  await expect(page.getByText(/Your request for Pro was sent on/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request Organization' })).toBeDisabled()
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(navigation.getByRole('link')).toHaveCount(4)
})

test('Free farmer is refused a second cultivation with a way to the plans', async ({ page }) => {
  // Two passes through the setup wizard.
  test.slow()
  await createAccount(page, 'Ben Castillo', 'ben.tiers@example.com', '09171234572')
  await page.getByRole('button', { name: 'Continue with Free' }).click()
  await expect(page).toHaveURL(/\/setup$/)

  await planTilapiaPond(page)
  await page.getByRole('button', { name: 'Create cultivation' }).click()
  await expect(page.getByRole('heading', { name: 'Your cultivation is ready' })).toBeVisible()

  await page.goto('/setup')
  await planTilapiaPond(page)
  await page.getByRole('button', { name: 'Create cultivation' }).click()
  const refusal = page.getByRole('alert').filter({ hasText: 'Your Free plan covers 1 active' })
  await expect(refusal).toBeVisible()
  await expect(refusal).toContainText('A harvested cultivation no longer counts.')

  await refusal.getByRole('link', { name: 'See plans' }).click()
  await expect(page).toHaveURL(/\/app\/plans$/)
  await expect(page.getByRole('heading', { name: 'You’re on Free' })).toBeVisible()
  await expect(page.getByText('1 of 1 culture system in use')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request Pro' })).toBeEnabled()
})
