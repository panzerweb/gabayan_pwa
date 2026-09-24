import { expect, test } from '@playwright/test'

test('the dimensions step suggests a Bangus pond size and the result names the extra area 5,000 fry need', async ({
  page,
}) => {
  // Account, plan and every setup step up to the estimate, each compiled on its first visit.
  test.slow()
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Ramon Villanueva')
  await page.getByLabel('Email address').fill('ramon.sizing@example.com')
  await page.getByLabel('Mobile number').fill('09171234591')
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Continue with Free' }).click()
  await page.getByRole('link', { name: 'Start setup' }).click()

  await page.getByRole('radio', { name: 'Milkfish (Bangus)' }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Pond/ }).click()
  await expect(page.getByText('This setup can be planned')).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Good water for your stock' })).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()

  const dialog = page.getByRole('dialog', { name: 'Suggested pond size for Milkfish (Bangus)' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('For 5,000 fish')
  await expect(dialog).toContainText('About 5,000 m² (0.5 ha)')
  await expect(dialog).toContainText('About 1 m²')
  await expect(dialog).toContainText('At least 1.0–1.2 m')
  await expect(dialog).toContainText('one square metre of pond per bangus')
  const provenance = dialog.getByRole('complementary', { name: 'About these figures' })
  await expect(provenance).toContainText('Demo figures, not yet reviewed')
  await expect(provenance).toContainText('semi-intensive bangus pond sizing sample')
  await dialog.getByRole('button', { name: 'Got it' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'See the suggested size and depth' }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByLabel('Length').fill('25')
  await page.getByLabel('Width').fill('20')
  await page.getByLabel('Average water depth').fill('1.2')
  await expect(page.getByText('500 m²')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Planned fingerlings').fill('5000')
  await page.getByRole('button', { name: 'Calculate estimate' }).click()

  await expect(
    page.getByRole('heading', { name: 'Your plan is above the demo range' }),
  ).toBeVisible()
  await expect(page.getByText('Space your plan needs')).toBeVisible()
  await expect(page.getByText('More space needed.')).toBeVisible()
  await expect(
    page.getByText(
      '5,000 fish need about 5,000 m² (0.5 ha) of water surface (length × width). Your area has 500 m², so it needs about 4,500 m² (0.45 ha) more, or plan fewer fish.',
    ),
  ).toBeVisible()
  await expect(page.getByText('Demo estimate.')).toBeVisible()
})
