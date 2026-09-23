import { expect, test } from '@playwright/test'

test('existing farmer completes feeding and reviews cultivation guidance', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Tilapia Batch #001' })).toBeVisible()
  await expect(page.getByText('1 of 3 done')).toBeVisible()
  await page.getByRole('button', { name: 'Record feeding' }).click()
  await expect(page.getByRole('dialog', { name: 'Record feeding' })).toBeVisible()
  await expect(page.getByLabel('Actual amount given')).toHaveValue('1.2')
  await page.getByLabel('Notes (optional)').fill('Fish responded normally.')
  await page.getByRole('button', { name: 'Save feeding record' }).click()

  await expect(page.getByText('Feeding record saved.')).toBeVisible()
  await expect(page.getByText('2 of 3 done')).toBeVisible()
  await page.getByRole('link', { name: 'View cultivation' }).click()
  await expect(page.getByText('485')).toBeVisible()
  await page.getByRole('button', { name: 'Timeline' }).click()
  await expect(page.getByRole('heading', { name: 'Estimated harvest window' })).toBeVisible()
})

test('notification filters and task deep links stay connected to daily guidance', async ({
  page,
}) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.getByRole('link', { name: /unread notification/ }).click()
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
  await page.getByRole('button', { name: 'Learning' }).click()
  await expect(
    page.getByRole('heading', { name: 'Look for changes in feeding response' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Cultivation' }).click()
  await page.getByRole('button', { name: 'View daily tasks' }).click()
  await expect(page).toHaveURL(/\/app\/cultivations\/cul_tilapia_001\/tasks/)
  await expect(page.getByRole('heading', { name: 'Check water condition' })).toBeVisible()
})
