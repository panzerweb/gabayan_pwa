import { expect, test } from '@playwright/test'

test('new user completes the above-range onboarding path with explicit acceptance', async ({
  page,
}) => {
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Maria Santos')
  await page.getByLabel('Email address').fill('maria.e2e@example.com')
  await page.getByLabel('Mobile number').fill('09171234568')
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/setup$/)
  await page.getByRole('link', { name: 'Start setup' }).click()
  await page.getByRole('radio', { name: /Tilapia/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Pond/ }).click()
  await expect(page.getByText('This setup can be planned')).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()

  await page.getByLabel('Length').fill('5')
  await page.getByLabel('Width').fill('4')
  await page.getByLabel('Average water depth').fill('1.5')
  await expect(page.getByText('30 m³')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel('Planned fingerlings').fill('800')
  await page.getByRole('button', { name: 'Calculate estimate' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your plan is above the demo range' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Review cultivation' })).toBeDisabled()
  await page.getByRole('checkbox').check()
  await page.getByRole('link', { name: 'Review cultivation' }).click()

  await page.getByLabel('Cultivation name (optional)').fill('Maria’s Tilapia Pond')
  await page.getByRole('button', { name: 'Create cultivation' }).click()
  await expect(page.getByRole('heading', { name: 'Your cultivation is ready' })).toBeVisible()
  await expect(page.getByText('Compact Pond Aerator')).toBeVisible()
})

test('new user can postpone setup and sees an honest empty dashboard', async ({ page }) => {
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Lina Reyes')
  await page.getByLabel('Email address').fill('lina.e2e@example.com')
  await page.getByLabel('Mobile number').fill('09171234570')
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('link', { name: 'Set up later' }).click()

  await expect(page).toHaveURL(/\/app\/home$/)
  await expect(page.getByRole('heading', { name: 'Start your first cultivation' })).toBeVisible()
})

test('existing demo user signs in and sees exactly four primary destinations', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/app\/home$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Here’s today’s farm plan.' })).toBeVisible()
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(navigation.getByRole('link')).toHaveCount(4)
  expect(await navigation.getByRole('link').allTextContents()).toEqual([
    'Home',
    'Cultivations',
    'Orders',
    'Profile',
  ])
})

test('protected routes redirect signed-out users to sign in', async ({ page }) => {
  await page.goto('/app/home')
  await expect(page).toHaveURL(/\/sign-in\?redirect=/)
  await expect(page.getByRole('heading', { name: 'Sign in to Gabayan' })).toBeVisible()
})
