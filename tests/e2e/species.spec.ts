import { expect, test, type Page } from '@playwright/test'

// Creates a Free account and opens the species step of the setup wizard.
async function startSetup(page: Page, fullName: string, email: string, mobileNumber: string) {
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill(fullName)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Mobile number').fill(mobileNumber)
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Continue with Free' }).click()
  await page.getByRole('link', { name: 'Start setup' }).click()
  await expect(page.getByRole('heading', { name: 'What species will you raise?' })).toBeVisible()
}

test('new farmer plans Bangus in a pond and sees its demo range and disclaimer', async ({
  page,
}) => {
  test.slow()
  await startSetup(page, 'Rosa Bautista', 'rosa.species@example.com', '09171234580')

  const species = page.getByRole('radiogroup', { name: 'Species' })
  await expect(species.getByRole('radio')).toHaveCount(6)
  for (const name of [
    'Tilapia',
    'Milkfish (Bangus)',
    'Catfish (Hito)',
    'Grouper (Lapu-lapu)',
    'Shrimp (Hipon)',
    'Carp',
  ]) {
    await expect(species.getByRole('radio', { name, exact: true })).toBeVisible()
  }

  await species.getByRole('radio', { name: 'Milkfish (Bangus)' }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Pond/ }).click()
  await expect(page.getByText('This setup can be planned')).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()

  await page.getByLabel('Length').fill('25')
  await page.getByLabel('Width').fill('20')
  await page.getByLabel('Average water depth').fill('1.2')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Planned fingerlings').fill('450')
  await page.getByRole('button', { name: 'Calculate estimate' }).click()

  await expect(
    page.getByRole('heading', { name: 'Your plan is within the demo range' }),
  ).toBeVisible()
  await expect(page.getByText('400–500 fish', { exact: true })).toBeVisible()
  await expect(page.getByText(/about one square metre of pond per bangus/)).toBeVisible()
  await expect(page.getByText('Demo estimate.', { exact: true })).toBeVisible()
  await expect(page.getByText(/Gabayan's recommendations are demo estimates/)).toBeVisible()
})

test('Shrimp in a fish cage is advised against, with a pond suggested instead', async ({
  page,
}) => {
  await startSetup(page, 'Nilo Garcia', 'nilo.species@example.com', '09171234581')

  await page.getByRole('radio', { name: 'Shrimp (Hipon)' }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Fish Cage/ }).click()

  const notice = page.getByRole('status').filter({ hasText: 'Choose another culture environment' })
  await expect(notice).toBeVisible()
  await expect(notice).toContainText('a floating fish cage does not suit them')
  await expect(notice).toContainText('You could consider: Pond.')
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
})
