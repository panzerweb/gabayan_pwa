// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { registerCommerceContract } from './scenarios/commerce.scenarios.mjs'
import { registerCultivationContract } from './scenarios/cultivations.scenarios.mjs'
import { registerFeedsContract } from './scenarios/feeds.scenarios.mjs'
import { registerNotificationContract } from './scenarios/notifications.scenarios.mjs'
import { registerProLogsContract } from './scenarios/pro-logs.scenarios.mjs'
import { registerProfileContract } from './scenarios/profile.scenarios.mjs'
import { registerReferenceContract } from './scenarios/reference.scenarios.mjs'
import { registerReminderContract } from './scenarios/reminders.scenarios.mjs'
import { registerSizingContract } from './scenarios/sizing.scenarios.mjs'
import { registerSpeciesContract } from './scenarios/species.scenarios.mjs'
import { registerSystemAndAuthContract } from './scenarios/system-auth.scenarios.mjs'
import { registerTaskAndRecordContract } from './scenarios/tasks-records.scenarios.mjs'
import { registerTierContract } from './scenarios/tiers.scenarios.mjs'
import { registerToolsContract } from './scenarios/tools.scenarios.mjs'
import { registerWaterQualityContract } from './scenarios/water-quality.scenarios.mjs'
import { registerWeatherAlertContract } from './scenarios/weather-alerts.scenarios.mjs'
import {
  bearer,
  idempotencyKey,
  registerAccount,
  registrationBody,
  signInAsDemo,
} from './support/accounts.mjs'
import { findUnexercisedRows, readCatalogRows } from './support/catalog.mjs'
import { createContractClient } from './support/client.mjs'
import {
  AERATOR_SKU,
  DEMO_CULTIVATION,
  DEMO_ORDER_NUMBER,
  HARVEST_DEMO_CULTIVATION,
  POND_DIMENSIONS,
  SEED_DAY,
  findCategory,
  findCultivation,
  findEnvironment,
  findProduct,
  findSpecies,
  listSeedDayTasks,
} from './support/demo.mjs'

// One client for the whole file: the scenarios run in order against one server, and the
// coverage check at the end reads every call they made. The server is the in-process mock
// unless CONTRACT_API_BASE_URL names another; see docs/guides/development_guide.md "Contract suite".
const client = createContractClient()

describe(`contract smoke tests against ${client.baseUrl}`, () => {
  it('returns the versioned health envelope', async () => {
    const response = await client.get('/health').expect(200)

    expect(response.body).toMatchObject({
      data: {
        status: 'ok',
        service: expect.any(String),
      },
      meta: {
        requestId: expect.any(String),
      },
    })
    expect(response.body.data.timestamp).toEqual(expect.any(String))
    if (await client.servesMockFixtures()) {
      expect(response.body.data.service).toBe('gabayan-mock-api')
    }
  })

  it('returns a paged species collection with provenance', async () => {
    const response = await client.get('/species?active=true&limit=2').expect(200)

    expect(response.body.data).toHaveLength(2)
    expect(response.body.data[0]).toMatchObject({
      commonName: 'Tilapia',
      sourceStatus: 'DEMO',
    })
    expect(response.body.page).toMatchObject({
      cursor: null,
      limit: 2,
      total: 6,
      nextCursor: expect.any(String),
    })
  })

  it('normalizes not-found errors', async () => {
    const response = await client.get('/species/sp_missing').expect(404)

    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'We could not find that fish profile.',
        fields: null,
        details: null,
        requestId: expect.any(String),
      },
    })
  })

  it('registers a new user without exposing mock credential fields', async () => {
    const body = registrationBody('Maria Santos')
    const response = await client.post('/auth/register').send(body).expect(201)

    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      user: {
        fullName: 'Maria Santos',
        email: body.email,
        mobileNumber: `+63${body.mobileNumber.slice(1)}`,
      },
      onboarding: { hasCultivation: false, suggestedRoute: '/setup' },
    })
    expect(response.body.data.user).not.toHaveProperty('mockPassword')
  })

  it('requires explicit acceptance before creating an above-range cultivation', async () => {
    const { accessToken: token } = await registerAccount(client, 'Above Range Tester')
    const [species, environment] = await Promise.all([
      findSpecies(client, 'Tilapia'),
      findEnvironment(client, 'POND'),
    ])

    const estimateResponse = await client
      .post('/stocking-estimates')
      .set('Authorization', bearer(token))
      .send({
        speciesId: species.id,
        environmentId: environment.id,
        dimensions: POND_DIMENSIONS,
        plannedFingerlings: 800,
      })
      .expect(200)
    const estimate = estimateResponse.body.data
    expect(estimate).toMatchObject({
      status: 'ABOVE_RANGE',
      recommendedMinimum: 450,
      recommendedMaximum: 550,
      isDemo: true,
      sourceStatus: 'DEMO',
    })

    const body = {
      estimateId: estimate.estimateId,
      speciesId: species.id,
      environmentId: environment.id,
      dimensions: POND_DIMENSIONS,
      initialFingerlings: 800,
      stockedOn: null,
    }

    const rejected = await client
      .post('/cultivations')
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', idempotencyKey('above-rejected'))
      .send(body)
      .expect(422)
    expect(rejected.body.error.fields).toHaveProperty('acceptedAboveRangeWarning')

    const created = await client
      .post('/cultivations')
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', idempotencyKey('above-accepted'))
      .send({ ...body, acceptedAboveRangeWarning: true })
      .expect(201)
    expect(created.body.data).toMatchObject({
      id: expect.any(String),
      status: 'PLANNING',
      stockingStatus: 'ABOVE_RANGE',
      initialFingerlings: 800,
    })
  })

  it('keeps dashboard, tasks, and notifications coherent after feeding completion', async () => {
    const { accessToken: token } = await signInAsDemo(client)
    const cultivation = await findCultivation(client, token, DEMO_CULTIVATION)
    const tasks = await listSeedDayTasks(client, token, cultivation.id)
    const feeding = tasks.find((task) => task.type === 'FEEDING' && task.status === 'DUE')

    const dashboardBefore = await client
      .get(`/dashboard/home?date=${SEED_DAY}`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(dashboardBefore.body.data).toMatchObject({
      primaryCultivation: { id: cultivation.id, name: DEMO_CULTIVATION },
      taskSummary: { completed: 1, total: 3 },
      unreadNotificationCount: 3,
    })

    const key = idempotencyKey('feeding-completion')
    const completion = await client
      .post(`/tasks/${feeding.id}/complete`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', key)
      .send({
        completedAt: '2026-09-23T08:05:00Z',
        actualAmount: { value: 1.1, unit: 'KG' },
        notes: 'Normal feeding response.',
      })
      .expect(200)
    expect(completion.body.data).toMatchObject({
      task: { id: feeding.id, status: 'COMPLETED' },
      linkedRecord: {
        cultivationId: cultivation.id,
        amount: { value: 1.1, unit: 'KG' },
      },
    })

    const repeated = await client
      .post(`/tasks/${feeding.id}/complete`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', key)
      .send({
        completedAt: '2026-09-23T08:05:00Z',
        actualAmount: { value: 1.1, unit: 'KG' },
        notes: 'Normal feeding response.',
      })
      .expect(200)
    expect(repeated.body.data.linkedRecord.id).toBe(completion.body.data.linkedRecord.id)

    const dashboardAfter = await client
      .get(`/dashboard/home?date=${SEED_DAY}`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(dashboardAfter.body.data.taskSummary).toEqual({ completed: 2, total: 3 })
    expect(dashboardAfter.body.data.unreadNotificationCount).toBe(2)
  })

  it('filters notifications and marks all unread items as read', async () => {
    const { accessToken: token } = await signInAsDemo(client)
    const education = await client
      .get('/notifications?category=EDUCATION')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(education.body.data).toHaveLength(1)
    expect(education.body.data[0]).not.toHaveProperty('ownerUserId')

    const readAll = await client
      .post('/notifications/read-all')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(readAll.body).toMatchObject({
      data: { count: 0 },
      meta: { requestId: expect.any(String) },
    })

    const unread = await client
      .get('/notifications/unread-count')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(unread.body.data.count).toBe(0)
  })

  it('keeps catalog, cart, checkout, and order totals server-owned', async () => {
    const { accessToken: token } = await signInAsDemo(client)
    const aeration = await findCategory(client, 'Aeration')
    const aerator = await findProduct(client, token, AERATOR_SKU)
    const addresses = await client
      .get('/users/me/addresses')
      .set('Authorization', bearer(token))
      .expect(200)
    const homeAddress = addresses.body.data.find((address) => address.isDefault)

    const catalog = await client
      .get(`/products?categoryId=${aeration.id}&sort=price&order=asc`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(catalog.body.data).toHaveLength(1)
    expect(catalog.body.data[0]).toMatchObject({
      id: aerator.id,
      category: { id: aeration.id, name: 'Aeration' },
      price: { amountMinor: 129900, currency: 'PHP' },
    })

    const cart = await client
      .post('/cart/items')
      .set('Authorization', bearer(token))
      .send({ productId: aerator.id, quantity: 1 })
      .expect(201)
    expect(cart.body.data).toMatchObject({
      itemCount: 1,
      subtotal: { amountMinor: 129900, currency: 'PHP' },
      estimatedDeliveryFee: { amountMinor: 15000, currency: 'PHP' },
      estimatedTotal: { amountMinor: 144900, currency: 'PHP' },
    })

    const quote = await client
      .post('/checkout/quote')
      .set('Authorization', bearer(token))
      .send({
        addressId: homeAddress.id,
        contact: {
          fullName: 'Juan Dela Cruz',
          mobileNumber: '+639171234567',
          email: 'juan@example.com',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
        cartVersion: cart.body.data.version,
      })
      .expect(200)
    expect(quote.body.data.total).toEqual({ amountMinor: 144900, currency: 'PHP' })

    const orderRequest = {
      quoteId: quote.body.data.quoteId,
      acceptedTotal: quote.body.data.total,
    }
    const key = idempotencyKey('order-create')
    const created = await client
      .post('/orders')
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', key)
      .send(orderRequest)
      .expect(201)
    expect(created.body.data).toMatchObject({
      orderNumber: expect.stringMatching(/^GBY-\d+$/),
      status: 'PROCESSING',
      itemCount: 1,
      total: { amountMinor: 144900, currency: 'PHP' },
    })
    expect(created.body.data.orderNumber).not.toBe(DEMO_ORDER_NUMBER)

    const repeated = await client
      .post('/orders')
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', key)
      .send(orderRequest)
      .expect(201)
    expect(repeated.body.data.id).toBe(created.body.data.id)

    const emptyCart = await client.get('/cart').set('Authorization', bearer(token)).expect(200)
    expect(emptyCart.body.data).toMatchObject({ itemCount: 0, items: [] })

    // A new order's first step is the placement; how many later steps are listed ahead of
    // time is the server's choice (the mock lists six, FastAPI three - BLOCKERS D-44).
    const tracking = await client
      .get(`/orders/${created.body.data.id}/tracking`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(tracking.body.data.events.length).toBeGreaterThanOrEqual(1)
    expect(tracking.body.data.events[0]).toMatchObject({
      label: 'Order placed',
      completed: true,
      current: true,
    })
  })

  it('recalculates operational estimates and completes a measured harvest', async () => {
    const { accessToken: token } = await signInAsDemo(client)
    const cultivation = await findCultivation(client, token, DEMO_CULTIVATION)
    const harvestDemo = await findCultivation(client, token, HARVEST_DEMO_CULTIVATION)

    const growth = await client
      .post(`/cultivations/${cultivation.id}/growth-measurements`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', idempotencyKey('growth-create'))
      .send({
        measuredOn: SEED_DAY,
        numberOfFishSampled: 12,
        averageWeight: { value: 200, unit: 'G' },
        notes: 'Representative net sample.',
      })
      .expect(201)
    expect(growth.body.data).toMatchObject({
      previousAverageWeight: { value: 180, unit: 'G' },
      change: { value: 20, unit: 'G' },
      feedingPlan: { estimatedLiveFish: 485, isDemo: true },
      harvestReadiness: { status: 'MONITOR', latestMeasurementOn: SEED_DAY },
    })

    const mortality = await client
      .post(`/cultivations/${cultivation.id}/mortality-records`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', idempotencyKey('mortality-create'))
      .send({
        occurredOn: SEED_DAY,
        fishCount: 5,
        reason: 'UNKNOWN',
        notes: 'Recorded during the morning round.',
      })
      .expect(201)
    expect(mortality.body.data.stock).toEqual({
      initialFingerlings: 500,
      recordedMortality: 20,
      estimatedLiveFish: 480,
    })
    expect(mortality.body.data.feedingPlan.estimatedLiveFish).toBe(480)

    const water = await client
      .post(`/cultivations/${cultivation.id}/water-checks`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', idempotencyKey('water-create'))
      .send({
        checkedAt: '2026-09-23T08:00:00+08:00',
        observation: {
          clarity: 'Cloudier than usual',
          odor: 'Normal',
          fishBehavior: 'Slower near one corner',
          unusualChanges: true,
        },
      })
      .expect(201)
    expect(water.body.data.guidance[0]).toMatchObject({ severity: 'CAUTION', sourceStatus: 'DEMO' })
    expect(water.body.data.guidance[0].message.toLowerCase()).not.toContain(
      'full water replacement',
    )
    expect(water.body.data.generatedTasks).toHaveLength(1)

    const readiness = await client
      .get(`/cultivations/${harvestDemo.id}/harvest-readiness`)
      .set('Authorization', bearer(token))
      .expect(200)
    expect(readiness.body.data).toMatchObject({
      status: 'POTENTIALLY_READY',
      estimatedAverageWeight: { value: 360, unit: 'G' },
      latestMeasurementOn: '2026-09-22',
      isDemo: true,
    })

    const harvestRequest = {
      harvestDate: SEED_DAY,
      numberHarvested: 470,
      totalHarvestWeight: { value: 169.2, unit: 'KG' },
      averageFishWeight: { value: 360, unit: 'G' },
      sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' },
      notes: 'Harvest completed and weighed.',
    }
    const key = idempotencyKey('harvest-create')
    const harvest = await client
      .post(`/cultivations/${harvestDemo.id}/harvest`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', key)
      .send(harvestRequest)
      .expect(201)
    expect(harvest.body.data).toMatchObject({
      cultivation: { status: 'COMPLETED', progressPercent: 100 },
      harvest: { estimatedRevenue: { amountMinor: 2030400, currency: 'PHP' } },
      summary: {
        fishHarvested: 470,
        recordedMortality: 20,
        totalHarvestWeight: { value: 169.2, unit: 'KG' },
        isDemo: true,
      },
    })

    const replay = await client
      .post(`/cultivations/${harvestDemo.id}/harvest`)
      .set('Authorization', bearer(token))
      .set('Idempotency-Key', key)
      .send(harvestRequest)
      .expect(201)
    expect(replay.body.data.harvest.id).toBe(harvest.body.data.harvest.id)

    const completed = await client
      .get('/cultivations?status=COMPLETED')
      .set('Authorization', bearer(token))
      .expect(200)
    expect(completed.body.data.map((record) => record.id)).toContain(harvestDemo.id)
  })

  it('keeps profile, farm, address, and reminder settings behind the public contract', async () => {
    const { accessToken: token, user } = await signInAsDemo(client)
    const addresses = await client
      .get('/users/me/addresses')
      .set('Authorization', bearer(token))
      .expect(200)
    const homeAddress = addresses.body.data.find((address) => address.isDefault)

    const profile = await client
      .patch('/users/me')
      .set('Authorization', bearer(token))
      .send({ fullName: 'Juan Dela Cruz', mobileNumber: '09171234567' })
      .expect(200)
    expect(profile.body.data).toMatchObject({
      fullName: 'Juan Dela Cruz',
      mobileNumber: '+639171234567',
      version: 2,
    })
    expect(profile.body.data).not.toHaveProperty('mockPassword')

    const farm = await client
      .put('/users/me/farm')
      .set('Authorization', bearer(token))
      .send({
        name: 'Dela Cruz Aquaculture Farm',
        region: 'CALABARZON',
        province: 'Laguna',
        municipality: 'San Pablo City',
        experienceLevel: 'INTERMEDIATE',
        notes: 'Updated through the public contract.',
      })
      .expect(200)
    expect(farm.body.data).toMatchObject({
      ownerUserId: user.id,
      name: 'Dela Cruz Aquaculture Farm',
      experienceLevel: 'INTERMEDIATE',
      version: 2,
    })

    await client
      .delete(`/users/me/addresses/${homeAddress.id}`)
      .set('Authorization', bearer(token))
      .expect(409)

    const added = await client
      .post('/users/me/addresses')
      .set('Authorization', bearer(token))
      .send({
        label: 'Second pond',
        recipientName: 'Juan Dela Cruz',
        mobileNumber: '09171234567',
        line1: '22 Rizal Avenue',
        line2: null,
        barangay: 'Santo Angel',
        cityMunicipality: 'San Pablo City',
        province: 'Laguna',
        region: 'CALABARZON',
        postalCode: '4000',
        countryCode: 'PH',
        deliveryInstructions: null,
        isDefault: false,
      })
      .expect(201)
    expect(added.body.data).toMatchObject({ label: 'Second pond', isDefault: false, version: 1 })
    expect(added.body.data).not.toHaveProperty('ownerUserId')

    const promoted = await client
      .patch(`/users/me/addresses/${added.body.data.id}`)
      .set('Authorization', bearer(token))
      .send({ isDefault: true })
      .expect(200)
    expect(promoted.body.data.isDefault).toBe(true)

    await client
      .delete(`/users/me/addresses/${homeAddress.id}`)
      .set('Authorization', bearer(token))
      .expect(204)

    const settings = await client
      .patch('/users/me/notification-settings')
      .set('Authorization', bearer(token))
      .send({ feedingReminders: false, morningFeedingTime: '07:30' })
      .expect(200)
    expect(settings.body.data).toMatchObject({
      feedingReminders: false,
      morningFeedingTime: '07:30',
      timezone: 'Asia/Manila',
      version: 2,
    })
    expect(settings.body.data).not.toHaveProperty('ownerUserId')
  })
})

registerSystemAndAuthContract(client)
registerProfileContract(client)
registerReferenceContract(client)
registerSpeciesContract(client)
registerSizingContract(client)
registerFeedsContract(client)
registerCultivationContract(client)
registerTaskAndRecordContract(client)
registerCommerceContract(client)
registerNotificationContract(client)
registerTierContract(client)
registerWaterQualityContract(client)
registerToolsContract(client)
registerReminderContract(client)
registerProLogsContract(client)
registerWeatherAlertContract(client)

describe('endpoint catalog coverage', () => {
  it('reads every method-and-path row of the contract endpoint catalog', () => {
    const rows = readCatalogRows()
    const keys = rows.map((row) => `${row.method} ${row.path}`)

    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual(
      expect.arrayContaining([
        'GET /health',
        'PATCH /cultivations/{cultivationId}',
        'POST /tasks/{taskId}/reopen',
        'POST /cultivations/{id}/feeding-records',
        'GET /products',
        'POST /notifications/read-all',
      ]),
    )
    expect(
      rows.find((row) => row.path === '/tasks/{taskId}/reopen').pattern.test('/tasks/t1/reopen'),
    ).toBe(true)
  })

  it('reports a row that no call reached, or reached only as an unknown route', () => {
    const rows = readCatalogRows().filter((row) => row.path.startsWith('/tasks'))
    const calls = [
      { method: 'GET', path: '/tasks', status: 200 },
      { method: 'GET', path: '/tasks/t1', status: 404 },
      { method: 'POST', path: '/tasks/t1/complete', status: 409 },
    ]

    expect(findUnexercisedRows(rows, calls).map((row) => `${row.method} ${row.path}`)).toEqual([
      'GET /tasks/{taskId}',
      'POST /tasks/{taskId}/reopen',
    ])
  })

  it('exercises every method-and-path row of the endpoint catalog', () => {
    const rows = readCatalogRows()
    const missing = findUnexercisedRows(rows, client.calls)

    console.info(
      `Endpoint catalog coverage: ${rows.length - missing.length} of ${rows.length} rows exercised against ${client.baseUrl}.`,
    )
    expect(missing.map((row) => `${row.method} ${row.path}`)).toEqual([])
  })
})
