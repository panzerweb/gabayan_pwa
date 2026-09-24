import { expect, test } from '@playwright/test'

// The cultivation screens count days from today, and the seed is written for 2026-09-23
// (Asia/Manila), so the clock is pinned to that day.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-23T08:00:00+08:00'))
})

test('during setup the farmer sees the suggested water ranges for the chosen fish, marked as demo', async ({
  page,
}) => {
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Lorna Ramos')
  await page.getByLabel('Email address').fill('lorna.water@example.com')
  await page.getByLabel('Mobile number').fill('09171234590')
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

  await expect(page).toHaveURL(/\/setup\/water-ranges$/)
  await expect(page.getByRole('heading', { name: 'Good water for your stock' })).toBeVisible()
  await expect(page.getByText(/with Tilapia \(Tilapia\) in a pond\./)).toBeVisible()
  const ranges = page.getByRole('list', { name: 'Suggested water ranges' }).getByRole('listitem')
  await expect(ranges).toHaveCount(7)
  await expect(ranges.filter({ hasText: /^Ammonia/ })).toContainText('Up to 0.5 mg/L')
  await expect(ranges.filter({ hasText: /^Ammonia/ })).toContainText('fish droppings')
  await expect(ranges.filter({ hasText: /^Dissolved oxygen/ })).toContainText('At least 3 mg/L')
  await expect(ranges.filter({ hasText: /^Salinity/ })).toContainText('Up to 15 ppt')

  const provenance = page.getByRole('complementary', { name: 'About these figures' })
  await expect(provenance).toContainText('Demo figures, not yet reviewed')
  await expect(provenance).toContainText("Gabayan's recommendations are demo estimates")

  await page.getByRole('link', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Measure your culture area' })).toBeVisible()
})

test('the safety check from a cultivation flags high ammonia with conditional guidance', async ({
  page,
}) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Batch #001/ }).click()

  await page.getByRole('link', { name: /Water safety check/ }).click()
  await expect(page.getByRole('heading', { name: 'Water safety check' })).toBeVisible()

  await page.getByLabel('pH (scale 0–14)').fill('15')
  await page.getByRole('button', { name: 'Check readings' }).click()
  await expect(page.getByText('Enter a number from 0 to 14.')).toBeVisible()

  await page.getByLabel('pH (scale 0–14)').fill('7.2')
  await page.getByLabel('Ammonia (mg/L)').fill('1.2')
  await page.getByRole('button', { name: 'Check readings' }).click()

  const readings = page.getByRole('list', { name: 'Your readings' }).getByRole('listitem')
  await expect(readings).toHaveCount(2)
  const ammonia = readings.filter({ hasText: /^Ammonia/ })
  await expect(ammonia).toContainText('1.2 mg/L')
  await expect(ammonia).toContainText('Above range')
  await expect(ammonia).toContainText('Suggested: Up to 0.5 mg/L')
  await expect(ammonia).toContainText('fish droppings and uneaten feed')
  await expect(ammonia).toContainText('Ammonia is higher than suggested')
  await expect(ammonia).toContainText('consider changing part of the water')
  await expect(ammonia).not.toContainText(/(replace|change|drain) (all|the whole)/i)
  await expect(readings.filter({ hasText: /^pH/ })).toContainText('Within range')
  await expect(page.getByText(/Not checked: Salinity, Nitrite, Nitrate/)).toBeVisible()
  await expect(page.getByText('Demo figures, not yet reviewed')).toBeVisible()
  await expect(
    page.getByText('This check is not saved. Pro plans keep a history of your readings.'),
  ).toBeVisible()
})
