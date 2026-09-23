import { expect, test } from '@playwright/test'

test('welcome screen exposes the two primary entry paths', async ({ page }) => {
  await page.goto('/welcome')

  await expect(
    page.getByRole('heading', { name: 'Start your fish farming journey with confidence.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'I already have an account' })).toBeVisible()
})

test('an unreachable API cannot trap a signed-out user on the splash screen', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', (route) => route.abort('connectionfailed'))
  await page.goto('/')

  await expect(page).toHaveURL(/\/welcome$/)
  await expect(
    page.getByRole('heading', { name: 'Start your fish farming journey with confidence.' }),
  ).toBeVisible()
})
