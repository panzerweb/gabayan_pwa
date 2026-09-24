// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { DEMO_EMAIL, DEMO_PASSWORD } from './support/accounts.mjs'
import { listenOnFreshMock } from './support/client.mjs'
import {
  AERATOR_SKU,
  DEMO_CULTIVATION,
  DEMO_ORDER_NUMBER,
  POND_DIMENSIONS,
  SEED_DAY,
} from './support/demo.mjs'

// The PWA's own data layer - the functions its screens call, with their query strings and
// Zod schemas - reading the demo farmer's resources from the server the suite targets. A
// schema stricter than the contract, or a query key the server refuses, fails here with the
// Zod issue or the error envelope, before any screen does. Reads only, so it can run beside
// the main suite on one live server.
let mock
let api
let accessToken

async function loadDataLayer() {
  const modules = await Promise.all([
    import('@pages/public/data/public.api'),
    import('@pages/auth/data/auth.api'),
    import('@pages/profile/data/profile.api'),
    import('@pages/setup/data/setup.api'),
    import('@pages/cultivations/data/cultivations.api'),
    import('@pages/home/data/home.api'),
    import('@pages/marketplace/data/marketplace.api'),
    import('@pages/cart/data/cart.api'),
    import('@pages/notifications/data/notifications.api'),
    import('@pages/orders/data/orders.api'),
    import('@pages/tiers/data/tiers.api'),
    import('@pages/water-quality/data/water-quality.api'),
  ])
  return Object.assign({}, ...modules)
}

function byName(items, key, value) {
  const match = items.find((item) => item[key] === value)
  expect(match, `no ${key} ${value} in ${items.map((item) => item[key]).join(', ')}`).toBeDefined()
  return match
}

describe('the PWA data layer against the contract server', () => {
  beforeAll(async () => {
    let baseUrl = process.env.CONTRACT_API_BASE_URL
    if (!baseUrl) {
      mock = await listenOnFreshMock()
      baseUrl = mock.baseUrl
    }
    // The client reads its base URL once, when @core/http/config is first imported.
    vi.stubEnv('VITE_API_BASE_URL', baseUrl)
    api = await loadDataLayer()
    const session = await api.loginApi({ identifier: DEMO_EMAIL, password: DEMO_PASSWORD })
    accessToken = session.data.accessToken
  })

  afterAll(async () => {
    vi.unstubAllEnvs()
    await mock?.close()
  })

  it('reads the health check and the signed-in account', async () => {
    expect((await api.getHealthApi()).data.status).toBe('ok')
    expect((await api.getCurrentUserApi(accessToken)).data.email).toBe(DEMO_EMAIL)
    expect((await api.getFarmProfileApi(accessToken)).data.name).toEqual(expect.any(String))
    expect((await api.listAddressesApi(accessToken)).data.length).toBeGreaterThan(0)
    expect((await api.getNotificationSettingsApi(accessToken)).data).toBeDefined()
  })

  it('reads the setup reference data and a stocking estimate', async () => {
    const species = byName((await api.listSpeciesApi()).data, 'commonName', 'Tilapia')
    const environments = (await api.listCultureEnvironmentsApi()).data
    const pond = byName(environments, 'code', 'POND')
    const compatibility = await api.getCompatibilityApi(species.id, pond.id)
    expect(compatibility.data.status).toEqual(expect.any(String))

    const estimate = await api.createStockingEstimateApi(
      {
        speciesId: species.id,
        environmentId: pond.id,
        dimensions: POND_DIMENSIONS,
        plannedFingerlings: 500,
      },
      accessToken,
    )
    expect(estimate.data.isDemo).toEqual(expect.any(Boolean))
  })

  it("reads the demo cultivation, the seed day's tasks, its records and its guidance", async () => {
    const list = (await api.listCultivationsApi(accessToken)).data
    const { id } = byName(list, 'name', DEMO_CULTIVATION)

    expect((await api.getCultivationApi(id, accessToken)).data.name).toBe(DEMO_CULTIVATION)
    expect((await api.getCultivationTimelineApi(id, accessToken)).data).toBeDefined()
    const tasks = await api.listTasksApi({ cultivationId: id, date: SEED_DAY }, accessToken)
    expect(tasks.data.length).toBeGreaterThan(0)
    await api.listGrowthMeasurementsApi(id, accessToken)
    await api.listMortalityRecordsApi(id, accessToken)
    await api.listFeedingRecordsApi(id, accessToken)
    await api.listWaterChecksApi(id, accessToken)
    expect((await api.getFeedingPlanApi(id, accessToken, SEED_DAY)).data.isDemo).toBe(true)
    expect((await api.getHarvestReadinessApi(id, accessToken)).data.isDemo).toBe(true)
    await api.getEquipmentRecommendationsApi(id, accessToken)
    expect((await api.getHomeDashboardApi(SEED_DAY, accessToken)).data).toBeDefined()
  })

  it('reads the catalog, cart, checkout options, notifications and orders', async () => {
    const categories = (await api.listProductCategoriesApi()).data
    expect(categories.length).toBeGreaterThan(0)
    const products = (await api.listProductsApi({}, accessToken)).data
    const aerator = byName(products, 'sku', AERATOR_SKU)
    expect((await api.getProductApi(aerator.id, accessToken)).data.sku).toBe(AERATOR_SKU)

    await api.getCartApi(accessToken)
    await api.listDeliveryAddressesApi(accessToken)
    expect((await api.listPaymentOptionsApi(accessToken)).data.length).toBeGreaterThan(0)
    await api.listNotificationsApi(accessToken)
    await api.listNotificationsApi(accessToken, 'CULTIVATION')
    expect((await api.getUnreadCountApi(accessToken)).data).toBeDefined()

    const orders = (await api.listOrdersApi(accessToken)).data
    const order = byName(orders, 'orderNumber', DEMO_ORDER_NUMBER)
    expect((await api.getOrderApi(order.id, accessToken)).data.orderNumber).toBe(DEMO_ORDER_NUMBER)
    expect((await api.getOrderTrackingApi(order.id, accessToken)).data).toBeDefined()
  })

  it("reads the plans and the demo farmer's own tier", async () => {
    const plans = (await api.listPlansApi(accessToken)).data
    expect(plans.map((plan) => plan.code)).toEqual(['FREE', 'PRO', 'ORGANIZATION'])
    const tier = (await api.getAccountTierApi(accessToken)).data
    expect(tier.plan.code).toBe('PRO')
    expect(tier.activeCultureSystems).toBeLessThanOrEqual(tier.plan.cultureSystemLimit)
  })

  it("reads the demo cultivation's water ranges and checks readings against them", async () => {
    const cultivations = (await api.listCultivationsApi(accessToken)).data
    const { species, environment } = byName(cultivations, 'name', DEMO_CULTIVATION)

    const ranges = (await api.getWaterThresholdsApi(species.id, environment.id, accessToken)).data
    expect(ranges.thresholds.map((threshold) => threshold.parameter)).toEqual([
      'SALINITY',
      'PH',
      'AMMONIA',
      'NITRITE',
      'NITRATE',
      'DISSOLVED_OXYGEN',
      'WATER_TEMPERATURE',
    ])
    const check = await api.createWaterSafetyCheckApi(
      { speciesId: species.id, environmentId: environment.id, readings: { ammoniaMgL: 1.2 } },
      accessToken,
    )
    expect(check.data.results.map((result) => result.status)).toEqual(['ABOVE_RANGE'])
  })
})
