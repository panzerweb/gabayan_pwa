import { expect, test } from '@playwright/test'

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('farmer records growth, mortality, and a conditional water observation', async ({ page }) => {
  await signIn(page)
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Batch #001/ }).click()

  await page.getByRole('link', { name: /Growth Measurements and chart/ }).click()
  await page.getByRole('button', { name: 'Add record' }).click()
  await page.getByLabel('Fish sampled').fill('12')
  await page.getByLabel('Average fish weight').fill('200')
  await page.getByLabel('Notes (optional)').fill('Representative net sample.')
  await page.getByRole('button', { name: 'Save growth record' }).click()
  await expect(page.getByText('Growth record saved.')).toBeVisible()
  await expect(page.getByText('200 g', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Go back' }).click()
  await page.getByRole('link', { name: /Farm records Feeding, mortality, and water/ }).click()
  await page.getByRole('button', { name: 'Mortality' }).click()
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Number of fish').fill('5')
  await page.getByLabel('Likely reason').selectOption('UNKNOWN')
  await page.getByRole('button', { name: 'Save mortality record' }).click()
  await expect(page.getByText(/Estimated live fish: 480/)).toBeVisible()

  await page.getByRole('button', { name: 'Water' }).click()
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Water clarity').fill('Cloudier than usual')
  await page.getByLabel('Fish behavior').fill('Slower near one corner')
  await page.getByLabel('I noticed an unusual change').check()
  await page.getByRole('button', { name: 'Save water check' }).click()
  await expect(page.getByText('Review the change promptly').first()).toBeVisible()
  await expect(page.getByText(/seek local technical guidance/i)).toBeVisible()
})

test('measured harvest creates an auditable summary and completed cultivation', async ({
  page,
}) => {
  await signIn(page)
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Harvest Demo/ }).click()
  await page.getByRole('link', { name: /Harvest Readiness and completion/ }).click()

  await expect(page.getByText('POTENTIALLY READY')).toBeVisible()
  await expect(page.getByText('360 g')).toBeVisible()
  await page.getByLabel('Fish harvested').fill('470')
  await page.getByLabel('Total harvest weight').fill('169.2')
  await page.getByLabel('Average fish weight').fill('360')
  await page.getByLabel('Selling price per kg').fill('120')
  await page.getByLabel('Notes (optional)').fill('Harvest completed and weighed.')
  await page.getByRole('button', { name: 'Complete cultivation' }).click()

  await expect(page.getByText('Cultivation completed')).toBeVisible()
  await expect(page.getByText('₱20,304.00')).toBeVisible()
  await expect(page.getByText('94%')).toBeVisible()
  await page.getByRole('link', { name: 'View completed cultivations' }).click()
  await expect(page).toHaveURL(/view=completed/)
  await expect(page.getByRole('link', { name: /Tilapia Harvest Demo/ })).toBeVisible()
})
