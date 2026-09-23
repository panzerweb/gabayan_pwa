import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createMockApi } from '../../mock-api/server.mjs'

describe('mock API contract smoke tests', () => {
  const app = createMockApi({ delayMs: 0 })

  it('returns the versioned health envelope', async () => {
    const response = await request(app).get('/api/v1/health').expect(200)

    expect(response.body).toMatchObject({
      data: {
        status: 'ok',
        service: 'gabayan-mock-api',
      },
      meta: {
        requestId: expect.any(String),
      },
    })
    expect(response.body.data.timestamp).toEqual(expect.any(String))
  })

  it('returns a paged species collection with provenance', async () => {
    const response = await request(app).get('/api/v1/species?active=true&limit=2').expect(200)

    expect(response.body.data).toHaveLength(2)
    expect(response.body.data[0]).toMatchObject({
      id: 'sp_tilapia',
      sourceStatus: 'DEMO',
    })
    expect(response.body.page).toMatchObject({
      cursor: null,
      limit: 2,
      total: 4,
      nextCursor: expect.any(String),
    })
  })

  it('normalizes not-found errors', async () => {
    const response = await request(app).get('/api/v1/species/sp_missing').expect(404)

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
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Maria Santos',
        email: 'maria.contract@example.com',
        mobileNumber: '09171234568',
        password: 'SafeDemo123!',
        confirmPassword: 'SafeDemo123!',
        acceptedTerms: true,
        acceptedTermsVersion: '2026-09',
      })
      .expect(201)

    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      user: {
        fullName: 'Maria Santos',
        email: 'maria.contract@example.com',
        mobileNumber: '+639171234568',
      },
      onboarding: { hasCultivation: false, suggestedRoute: '/setup' },
    })
    expect(response.body.data.user).not.toHaveProperty('mockPassword')
  })

  it('requires explicit acceptance before creating an above-range cultivation', async () => {
    const registration = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Above Range Tester',
        email: 'above.range@example.com',
        mobileNumber: '09171234569',
        password: 'SafeDemo123!',
        confirmPassword: 'SafeDemo123!',
        acceptedTerms: true,
        acceptedTermsVersion: '2026-09',
      })
      .expect(201)
    const token = registration.body.data.accessToken

    const estimateResponse = await request(app)
      .post('/api/v1/stocking-estimates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        speciesId: 'sp_tilapia',
        environmentId: 'env_pond',
        dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
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
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
      initialFingerlings: 800,
      stockedOn: null,
    }

    const rejected = await request(app)
      .post('/api/v1/cultivations')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-above-rejected')
      .send(body)
      .expect(422)
    expect(rejected.body.error.fields).toHaveProperty('acceptedAboveRangeWarning')

    const created = await request(app)
      .post('/api/v1/cultivations')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-above-accepted')
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
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'juan@example.com', password: 'Gabayan123!' })
      .expect(200)
    const token = login.body.data.accessToken

    const dashboardBefore = await request(app)
      .get('/api/v1/dashboard/home?date=2026-09-23')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(dashboardBefore.body.data).toMatchObject({
      primaryCultivation: { id: 'cul_tilapia_001', name: 'Tilapia Batch #001' },
      taskSummary: { completed: 1, total: 3 },
      unreadNotificationCount: 3,
    })

    const completion = await request(app)
      .post('/api/v1/tasks/task_feed_pm/complete')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-feeding-completion')
      .send({
        completedAt: '2026-09-23T08:05:00Z',
        actualAmount: { value: 1.1, unit: 'KG' },
        notes: 'Normal feeding response.',
      })
      .expect(200)
    expect(completion.body.data).toMatchObject({
      task: { id: 'task_feed_pm', status: 'COMPLETED' },
      linkedRecord: {
        cultivationId: 'cul_tilapia_001',
        amount: { value: 1.1, unit: 'KG' },
      },
    })

    const repeated = await request(app)
      .post('/api/v1/tasks/task_feed_pm/complete')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-feeding-completion')
      .send({
        completedAt: '2026-09-23T08:05:00Z',
        actualAmount: { value: 1.1, unit: 'KG' },
      })
      .expect(200)
    expect(repeated.body.data.linkedRecord.id).toBe(completion.body.data.linkedRecord.id)

    const dashboardAfter = await request(app)
      .get('/api/v1/dashboard/home?date=2026-09-23')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(dashboardAfter.body.data.taskSummary).toEqual({ completed: 2, total: 3 })
    expect(dashboardAfter.body.data.unreadNotificationCount).toBe(2)
  })

  it('filters notifications and marks all unread items as read', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'juan@example.com', password: 'Gabayan123!' })
      .expect(200)
    const token = login.body.data.accessToken
    const education = await request(app)
      .get('/api/v1/notifications?category=EDUCATION')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(education.body.data).toHaveLength(1)
    expect(education.body.data[0]).not.toHaveProperty('ownerUserId')

    const readAll = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(readAll.body).toMatchObject({
      data: { count: 0 },
      meta: { requestId: expect.any(String) },
    })

    const unread = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(unread.body.data.count).toBe(0)
  })

  it('keeps catalog, cart, checkout, and order totals server-owned', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'juan@example.com', password: 'Gabayan123!' })
      .expect(200)
    const token = login.body.data.accessToken

    const catalog = await request(app)
      .get('/api/v1/products?categoryId=cat_aeration&sort=price&order=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(catalog.body.data).toHaveLength(1)
    expect(catalog.body.data[0]).toMatchObject({
      id: 'prd_pond_aerator',
      category: { id: 'cat_aeration', name: 'Aeration' },
      price: { amountMinor: 129900, currency: 'PHP' },
    })

    const cart = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'prd_pond_aerator', quantity: 1 })
      .expect(201)
    expect(cart.body.data).toMatchObject({
      itemCount: 1,
      subtotal: { amountMinor: 129900, currency: 'PHP' },
      estimatedDeliveryFee: { amountMinor: 15000, currency: 'PHP' },
      estimatedTotal: { amountMinor: 144900, currency: 'PHP' },
    })

    const quote = await request(app)
      .post('/api/v1/checkout/quote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        addressId: 'addr_juan_home',
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
    const created = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-order-create')
      .send(orderRequest)
      .expect(201)
    expect(created.body.data).toMatchObject({
      orderNumber: 'GBY-10246',
      status: 'PROCESSING',
      itemCount: 1,
      total: { amountMinor: 144900, currency: 'PHP' },
    })

    const repeated = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-order-create')
      .send(orderRequest)
      .expect(201)
    expect(repeated.body.data.id).toBe(created.body.data.id)

    const emptyCart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(emptyCart.body.data).toMatchObject({ itemCount: 0, items: [] })

    const tracking = await request(app)
      .get(`/api/v1/orders/${created.body.data.id}/tracking`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(tracking.body.data.events).toHaveLength(6)
    expect(tracking.body.data.events[0]).toMatchObject({
      label: 'Order placed',
      completed: true,
      current: true,
    })
  })

  it('recalculates operational estimates and completes a measured harvest', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'juan@example.com', password: 'Gabayan123!' })
      .expect(200)
    const token = login.body.data.accessToken

    const growth = await request(app)
      .post('/api/v1/cultivations/cul_tilapia_001/growth-measurements')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-growth-create')
      .send({
        measuredOn: '2026-09-23',
        numberOfFishSampled: 12,
        averageWeight: { value: 200, unit: 'G' },
        notes: 'Representative net sample.',
      })
      .expect(201)
    expect(growth.body.data).toMatchObject({
      previousAverageWeight: { value: 180, unit: 'G' },
      change: { value: 20, unit: 'G' },
      feedingPlan: { estimatedLiveFish: 485, isDemo: true },
      harvestReadiness: { status: 'MONITOR', latestMeasurementOn: '2026-09-23' },
    })

    const mortality = await request(app)
      .post('/api/v1/cultivations/cul_tilapia_001/mortality-records')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-mortality-create')
      .send({
        occurredOn: '2026-09-23',
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

    const water = await request(app)
      .post('/api/v1/cultivations/cul_tilapia_001/water-checks')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-water-create')
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

    const readiness = await request(app)
      .get('/api/v1/cultivations/cul_tilapia_harvest/harvest-readiness')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(readiness.body.data).toMatchObject({
      status: 'POTENTIALLY_READY',
      estimatedAverageWeight: { value: 360, unit: 'G' },
      latestMeasurementOn: '2026-09-22',
      isDemo: true,
    })

    const harvestRequest = {
      harvestDate: '2026-09-23',
      numberHarvested: 470,
      totalHarvestWeight: { value: 169.2, unit: 'KG' },
      averageFishWeight: { value: 360, unit: 'G' },
      sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' },
      notes: 'Harvest completed and weighed.',
    }
    const harvest = await request(app)
      .post('/api/v1/cultivations/cul_tilapia_harvest/harvest')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-harvest-create')
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

    const replay = await request(app)
      .post('/api/v1/cultivations/cul_tilapia_harvest/harvest')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'contract-harvest-create')
      .send(harvestRequest)
      .expect(201)
    expect(replay.body.data.harvest.id).toBe(harvest.body.data.harvest.id)

    const completed = await request(app)
      .get('/api/v1/cultivations?status=COMPLETED')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(completed.body.data.map((record) => record.id)).toContain('cul_tilapia_harvest')
  })

  it('keeps profile, farm, address, and reminder settings behind the public contract', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'juan@example.com', password: 'Gabayan123!' })
      .expect(200)
    const token = login.body.data.accessToken

    const profile = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Juan Dela Cruz', mobileNumber: '09171234567' })
      .expect(200)
    expect(profile.body.data).toMatchObject({
      fullName: 'Juan Dela Cruz',
      mobileNumber: '+639171234567',
      version: 2,
    })
    expect(profile.body.data).not.toHaveProperty('mockPassword')

    const farm = await request(app)
      .put('/api/v1/users/me/farm')
      .set('Authorization', `Bearer ${token}`)
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
      ownerUserId: 'usr_juan',
      name: 'Dela Cruz Aquaculture Farm',
      experienceLevel: 'INTERMEDIATE',
      version: 2,
    })

    await request(app)
      .delete('/api/v1/users/me/addresses/addr_juan_home')
      .set('Authorization', `Bearer ${token}`)
      .expect(409)

    const added = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
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

    const promoted = await request(app)
      .patch(`/api/v1/users/me/addresses/${added.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isDefault: true })
      .expect(200)
    expect(promoted.body.data.isDefault).toBe(true)

    await request(app)
      .delete('/api/v1/users/me/addresses/addr_juan_home')
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const settings = await request(app)
      .patch('/api/v1/users/me/notification-settings')
      .set('Authorization', `Bearer ${token}`)
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
