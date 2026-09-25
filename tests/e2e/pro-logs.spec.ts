import { expect, test, type Page } from '@playwright/test'

// The cultivation screens count days from today, and the seed is written for 2026-09-23
// (Asia/Manila), so the clock is pinned to that day. The mock's own clock is pinned to
// 07:30 that morning, so a reading saved here is logged then.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-23T08:00:00+08:00'))
})

async function signInAsJuan(page: Page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email or mobile number').fill('juan@example.com')
  await page.getByLabel('Password').fill('Gabayan123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app\/home$/)
}

async function openBatch001(page: Page) {
  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page.getByRole('link', { name: /Tilapia Batch #001/ }).click()
}

// Runs the setup wizard for an in-range Tilapia pond and creates the cultivation.
async function createTilapiaPond(page: Page) {
  await page.getByRole('link', { name: 'Start setup' }).click()
  await page.getByRole('radio', { name: /Tilapia/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Pond/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Good water for your stock' })).toBeVisible()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Got it' }).click()
  await page.getByLabel('Length').fill('5')
  await page.getByLabel('Width').fill('4')
  await page.getByLabel('Average water depth').fill('1.5')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Planned fingerlings').fill('500')
  await page.getByRole('button', { name: 'Calculate estimate' }).click()
  await page.getByRole('link', { name: 'Review cultivation' }).click()
  await page.getByRole('button', { name: 'Create cultivation' }).click()
  await expect(page.getByRole('heading', { name: 'Your cultivation is ready' })).toBeVisible()
}

test('a Pro farmer saves a water reading, sees it in the history and trend, and reads the feed conversion', async ({
  page,
}) => {
  // Three screens, a save and the refreshed history.
  test.slow()
  await signInAsJuan(page)
  await openBatch001(page)
  await page.getByRole('link', { name: /Water log · Pro/ }).click()
  await expect(page).toHaveURL(/\/app\/cultivations\/[^/]+\/water-log$/)

  // The seeded history: the trend opens on ammonia, whose 17 September reading was high.
  const history = page.getByRole('region', { name: 'History' }).getByRole('listitem')
  const logs = history.filter({ has: page.getByText(/reading(s)? out of range|within range/) })
  await expect(logs).toHaveCount(3)
  await expect(logs.first()).toContainText('Sep 22, 2026')
  await expect(logs.first()).toContainText('Below range')
  const ammonia = page.getByRole('list', { name: 'Ammonia readings, newest first' })
  await expect(ammonia.getByRole('listitem').nth(1)).toContainText('0.8 mg/L')
  await expect(ammonia.getByRole('listitem').nth(1)).toContainText('Above range')
  await expect(page.getByRole('img', { name: 'Ammonia trend with 3 readings' })).toBeVisible()

  // A new reading with ammonia above its range.
  await page.getByRole('button', { name: 'Log a reading' }).click()
  const sheet = page.getByRole('dialog', { name: 'Log water readings' })
  await expect(sheet.getByText(/fish droppings.*Suggested: Up to 0\.5 mg\/L\./)).toBeVisible()
  await sheet.getByLabel('pH (scale 0–14)').fill('7.4')
  await sheet.getByLabel('Ammonia (mg/L)').fill('0.9')
  await sheet.getByLabel('Dissolved oxygen (mg/L)').fill('4.5')
  await sheet.getByLabel('Notes (optional)').fill('Checked before the morning feeding.')
  await sheet.getByRole('button', { name: 'Save reading' }).click()
  await expect(page.getByText('Water reading saved.')).toBeVisible()
  await expect(sheet).toBeHidden()

  await expect(logs).toHaveCount(4)
  await expect(logs.first()).toContainText('Sep 23, 2026')
  await expect(logs.first()).toContainText('1 reading out of range')
  await expect(logs.first()).toContainText(
    'Not measured: Salinity, Nitrite, Nitrate, Water temperature.',
  )
  await expect(logs.first()).toContainText('Checked before the morning feeding.')
  await expect(page.getByRole('img', { name: 'Ammonia trend with 4 readings' })).toBeVisible()
  await expect(ammonia.getByRole('listitem').first()).toContainText('0.9 mg/L')
  await expect(ammonia.getByRole('listitem').first()).toContainText('Above range')

  // The feed conversion ratio, worked out from the records, with its basis.
  await page.getByRole('link', { name: 'Go back' }).click()
  await page.getByRole('link', { name: /Feed conversion · Pro/ }).click()
  await expect(page.getByText('Feed conversion ratio', { exact: true })).toBeVisible()
  await expect(page.getByText(/^[\d.]+ kg of feed for each kg gained$/)).toBeVisible()
  await expect(page.getByText(/feeding records?$/)).toBeVisible()
  const basis = page.getByRole('region', { name: 'How this is worked out' })
  await expect(basis).toContainText('Fish that died are not counted as weight gained')
  await expect(page.getByText('Demo calculation, not yet reviewed')).toBeVisible()
})

test('a Free farmer opening the water log or feed conversion is sent to the plans', async ({
  page,
}) => {
  // One pass through the setup wizard.
  test.slow()
  await page.goto('/create-account')
  await page.getByLabel('Full name').fill('Rosa Mercado')
  await page.getByLabel('Email address').fill('rosa.prologs@example.com')
  await page.getByLabel('Mobile number').fill('09171234595')
  await page.getByLabel(/^Password/).fill('SafeDemo123!')
  await page.getByLabel('Confirm password').fill('SafeDemo123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Continue with Free' }).click()
  await createTilapiaPond(page)
  await page.getByRole('link', { name: 'Continue to Home' }).click()

  await page.getByRole('link', { name: 'Cultivations' }).click()
  await page
    .getByRole('link', { name: /Tilapia/ })
    .first()
    .click()
  await page.getByRole('link', { name: /Water log · Pro/ }).click()

  await expect(page).toHaveURL(/\/app\/plans\?required=PRO/)
  await expect(page.getByText('That screen is part of the Pro plan.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request Pro' })).toBeEnabled()

  await page.goBack()
  await page.getByRole('link', { name: /Feed conversion · Pro/ }).click()
  await expect(page).toHaveURL(/\/app\/plans\?required=PRO/)
  await expect(page.getByText('That screen is part of the Pro plan.')).toBeVisible()
})
