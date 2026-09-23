import { expect, test } from '@playwright/test'

test('farmer buys a recommended aerator and tracks the new order', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.getByRole('link', { name: 'Orders' }).click()
  await expect(page.getByText('GBY-10245')).toBeVisible()
  await page.getByRole('link', { name: 'Shop' }).click()
  await expect(page.getByRole('heading', { name: '6 products' })).toBeVisible()
  await page.getByRole('link', { name: /Compact Pond Aerator/ }).click()
  await expect(page.getByRole('heading', { name: 'Why this may help' })).toBeVisible()

  await page.getByRole('button', { name: /Add to cart/ }).click()
  await expect(page.getByText('Added to cart.')).toBeVisible()
  await page.getByRole('link', { name: 'Cart with 1 items' }).click()
  await expect(page.getByText('₱1,449.00')).toBeVisible()
  await page.getByRole('link', { name: 'Continue to checkout' }).click()

  await expect(page.getByRole('heading', { name: 'Farm address' })).toBeVisible()
  await page.getByRole('button', { name: 'Review final total' }).click()
  await expect(page.getByRole('button', { name: /Place order/ })).toBeVisible()
  await page.getByRole('button', { name: /Place order/ }).click()

  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible()
  await expect(page.getByText('GBY-10246')).toBeVisible()
  await page.getByRole('link', { name: 'Track order' }).click()
  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible()
  await expect(page.getByText('Upcoming').first()).toBeVisible()
})
