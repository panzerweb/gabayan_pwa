import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('farmer maintains farm, delivery, and reminder preferences', async ({ page }) => {
  await signIn(page)
  await page.getByRole('link', { name: 'Profile' }).click()

  await expect(page.getByRole('heading', { name: 'Dela Cruz Family Fish Farm' })).toBeVisible()
  const farmSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Farm profile' }),
  })
  await farmSection.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Farm name').fill('Dela Cruz Aquaculture Farm')
  await page.getByLabel('Experience level').selectOption('INTERMEDIATE')
  await page.getByRole('button', { name: 'Save farm profile' }).click()
  await expect(page.getByText('Farm profile updated.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dela Cruz Aquaculture Farm' })).toBeVisible()

  const addressSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Addresses' }),
  })
  await addressSection.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Address label').fill('Second pond')
  await page.getByLabel('Street and building').fill('22 Rizal Avenue')
  await page.getByLabel('Barangay').fill('Santo Angel')
  await page.getByLabel('City or municipality').fill('San Pablo City')
  await page.getByLabel('Province').fill('Laguna')
  await page.getByLabel('Region').fill('CALABARZON')
  await page.getByLabel('Postal code').fill('4000')
  await page.getByRole('button', { name: 'Add address' }).click()
  await expect(page.getByText('Address added.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Second pond' })).toBeVisible()

  await page.getByLabel('Feeding reminders').uncheck()
  await expect(page.getByLabel('Morning feeding time')).toBeDisabled()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Notification preferences saved.')).toBeVisible()
})

test('offline mode is explicit, unsafe profile writes are disabled, and skip navigation works', async ({
  page,
  context,
}) => {
  await signIn(page)
  await page.getByRole('link', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Notification preferences' })).toBeVisible()

  await context.setOffline(true)
  await expect(page.getByText(/You're offline/)).toBeVisible()
  const accountSection = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Personal details' }),
  })
  await accountSection.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('button', { name: 'Save details' })).toBeDisabled()
  await context.setOffline(false)
  await page
    .getByRole('dialog', { name: 'Edit personal details' })
    .getByRole('button', { name: 'Close' })
    .click()

  await page.goto('/app/home')
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await skipLink.focus()
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#app-content')).toBeFocused()
})

test('release surfaces reflow at supported phone widths and expose install metadata', async ({
  page,
}) => {
  for (const width of [320, 360, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/welcome')
    await expect(
      page.getByRole('heading', { name: /Start your fish farming journey/ }),
    ).toBeVisible()
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow, `unexpected horizontal overflow at ${width}px`).toBe(false)
  }

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest/)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#075985')

  await page.goto('/offline')
  await expect(page.getByText('You’re offline')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try reconnecting' })).toBeVisible()
})
