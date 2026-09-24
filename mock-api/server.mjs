import { copyFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const jsonServer = require('json-server')

const defaultDatabasePath = resolve(process.cwd(), 'mock-api', 'db.json')
const seedDatabasePath = resolve(process.cwd(), 'mock-api', 'fixtures', 'seed.json')
const apiVersion = '0.7.0'
const ruleDisclaimer =
  "Gabayan's recommendations are demo estimates and may vary based on water quality, climate, fish health, feed quality, management practices, and local conditions."

function parsePositiveInteger(value, fallback, maximum) {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > maximum) return null
  return parsed
}

function encodeCursor(offset) {
  return Buffer.from(String(offset), 'utf8').toString('base64url')
}

function decodeCursor(cursor) {
  if (!cursor) return 0
  try {
    const value = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
    return Number.isInteger(value) && value >= 0 ? value : null
  } catch {
    return null
  }
}

function requestId(response) {
  return response.locals.requestId
}

function sendData(response, data, status = 200) {
  return response.status(status).json({ data, meta: { requestId: requestId(response) } })
}

function sendError(response, status, code, message, fields = null, details = null) {
  return response.status(status).json({
    error: { code, message, fields, details, requestId: requestId(response) },
  })
}

function collectionResponse(response, data, { cursor, nextCursor, limit, total }) {
  return response.json({
    data,
    page: { cursor, nextCursor, limit, total },
    meta: { requestId: requestId(response) },
  })
}

function listCollection(request, response, collection) {
  const limit = parsePositiveInteger(request.query.limit, 20, 100)
  const offset = decodeCursor(request.query.cursor)
  if (limit === null) {
    return sendError(response, 400, 'BAD_REQUEST', 'Limit must be an integer from 1 to 100.')
  }
  if (offset === null) {
    return sendError(response, 400, 'BAD_REQUEST', 'The pagination cursor is invalid.')
  }
  if (
    request.query.active !== undefined &&
    request.query.active !== 'true' &&
    request.query.active !== 'false'
  ) {
    return sendError(response, 400, 'BAD_REQUEST', 'Active must be true or false.')
  }

  const activeFilter =
    request.query.active === undefined ? undefined : request.query.active === 'true'
  const filtered =
    activeFilter === undefined
      ? collection
      : collection.filter((item) => item.active === activeFilter)
  const data = filtered.slice(offset, offset + limit)
  const nextOffset = offset + data.length
  return collectionResponse(response, data, {
    cursor: request.query.cursor ?? null,
    nextCursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : null,
    limit,
    total: filtered.length,
  })
}

function publicUser(user) {
  return omitKeys(user, ['mockPassword', 'mockHasCultivation'])
}

function omitKeys(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)))
}

function normalizeMobileNumber(value) {
  const compact = String(value ?? '').replace(/[\s()-]/g, '')
  if (/^09\d{9}$/.test(compact)) return `+63${compact.slice(1)}`
  if (/^639\d{9}$/.test(compact)) return `+${compact}`
  if (/^\+639\d{9}$/.test(compact)) return compact
  return null
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie ?? '')
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf('=')
        return [entry.slice(0, separator), decodeURIComponent(entry.slice(separator + 1))]
      }),
  )
}

function compactSpecies(species) {
  return {
    id: species.id,
    commonName: species.commonName,
    localName: species.localName,
    image: species.image,
  }
}

function compactEnvironment(environment) {
  return { id: environment.id, code: environment.code, name: environment.name }
}

function withoutInternalCultivationFields(cultivation) {
  return omitKeys(cultivation, ['ownerUserId'])
}

function cultivationSummary(cultivation) {
  const publicRecord = withoutInternalCultivationFields(cultivation)
  return Object.fromEntries(
    Object.entries(publicRecord).filter(([key]) =>
      [
        'id',
        'name',
        'species',
        'environment',
        'status',
        'dayNumber',
        'estimatedDurationDays',
        'progressPercent',
        'initialFingerlings',
        'estimatedLiveFish',
        'estimatedHarvestDate',
        'nextTaskAt',
        'stockingStatus',
        'createdAt',
        'updatedAt',
        'version',
      ].includes(key),
    ),
  )
}

function publicNotification(notification) {
  return omitKeys(notification, ['ownerUserId'])
}

function dateInManila(isoTimestamp) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoTimestamp))
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysBetween(fromIsoDate, toIsoDate) {
  return Math.round(
    (Date.parse(`${toIsoDate}T00:00:00Z`) - Date.parse(`${fromIsoDate}T00:00:00Z`)) / 86400000,
  )
}

function isCalendarDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)
  )
}

// An RFC 3339 time must carry its zone; a bare local time is refused rather than guessed.
function parseZonedTimestamp(value) {
  if (typeof value !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return null
  }
  const moment = Date.parse(value)
  return Number.isNaN(moment) ? null : new Date(moment).toISOString().replace('.000Z', 'Z')
}

// Reads `If-Match` as the bare version the contract writes, tolerating the quoted ETag
// form. Undefined means an unconditional write; null means the header is malformed.
function parseIfMatch(header) {
  if (header === undefined || !String(header).trim()) return undefined
  const text = String(header).trim().replace(/^W\//, '').replace(/^"|"$/g, '')
  return /^\d+$/.test(text) && Number(text) >= 1 ? Number(text) : null
}

// Day number, progress and harvest date as FastAPI derives them from the stocking date.
function stockingSchedule(stockedOn, durationDays, today) {
  const dayNumber = daysBetween(stockedOn, today) + 1
  const progressPercent = durationDays
    ? Math.min(100, Math.max(0, Math.round((dayNumber / durationDays) * 100)))
    : 0
  return {
    dayNumber,
    progressPercent,
    estimatedHarvestDate: durationDays ? addDays(stockedOn, durationDays) : null,
  }
}

function validateCultivationPatch(body) {
  const editable = ['name', 'stockedOn', 'notes']
  const fields = {}
  const changes = {}
  for (const key of Object.keys(body)) {
    if (!editable.includes(key)) fields[key] = ['Extra inputs are not permitted']
  }
  if (Object.hasOwn(body, 'name')) {
    const name = body.name
    if (name === null || (typeof name === 'string' && !name.trim())) {
      fields.name = ['This field is required.']
    } else if (typeof name !== 'string') fields.name = ['Enter text.']
    else if (name.trim().length > 100) fields.name = ['Use at most 100 characters.']
    else changes.name = name.trim()
  }
  if (Object.hasOwn(body, 'stockedOn')) {
    if (body.stockedOn === null) fields.stockedOn = ['This field is required.']
    else if (!isCalendarDate(body.stockedOn)) fields.stockedOn = ['Use a date as YYYY-MM-DD.']
    else changes.stockedOn = body.stockedOn
  }
  if (Object.hasOwn(body, 'notes')) {
    if (body.notes !== null && typeof body.notes !== 'string') fields.notes = ['Enter text.']
    else if ((body.notes ?? '').trim().length > 1000) {
      fields.notes = ['Use at most 1000 characters.']
    } else changes.notes = (body.notes ?? '').trim() || null
  }
  return { fields, changes }
}

function validateFeedingRecord(body) {
  const fields = {}
  const fedAt = parseZonedTimestamp(body.fedAt)
  if (!fedAt) {
    fields.fedAt = ['Use an RFC 3339 time with a time zone, such as 2026-09-23T08:00:00Z.']
  }
  const amount = body.amount
  const grams =
    amount && Number.isFinite(amount.value) && ['G', 'KG'].includes(amount.unit)
      ? amount.unit === 'KG'
        ? amount.value * 1000
        : amount.value
      : null
  if (grams === null || grams <= 0) {
    fields.amount = ['Enter a feeding amount greater than 0 in g or kg.']
  } else if (grams > 1000000) fields.amount = ['Enter a feeding amount of at most 1,000 kg.']
  if (body.taskId !== undefined && body.taskId !== null && typeof body.taskId !== 'string') {
    fields.taskId = ['Enter text.']
  }
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    fields.notes = ['Enter text.']
  } else if (String(body.notes ?? '').trim().length > 1000) {
    fields.notes = ['Use at most 1000 characters.']
  }
  return {
    fields,
    fedAt,
    taskId: body.taskId ?? null,
    notes: String(body.notes ?? '').trim() || null,
  }
}

function validateRegistration(body) {
  const fields = {}
  const fullName = String(body.fullName ?? '').trim()
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
  const mobileNumber = normalizeMobileNumber(body.mobileNumber)
  const password = String(body.password ?? '')

  if (fullName.length < 2 || fullName.length > 100) {
    fields.fullName = ['Enter a name between 2 and 100 characters.']
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = ['Enter a valid email.']
  if (!mobileNumber) fields.mobileNumber = ['Enter a valid Philippine mobile number.']
  if (password.length < 8 || password.length > 128) {
    fields.password = ['Use a password between 8 and 128 characters.']
  }
  if (body.confirmPassword !== body.password) fields.confirmPassword = ['Passwords must match.']
  if (body.acceptedTerms !== true) fields.acceptedTerms = ['Accept the terms to continue.']
  if (typeof body.acceptedTermsVersion !== 'string' || !body.acceptedTermsVersion.trim()) {
    fields.acceptedTermsVersion = ['The displayed terms version is required.']
  }
  return { fields, fullName, email, mobileNumber, password }
}

export function createMockApi({ databasePath = defaultDatabasePath, delayMs } = {}) {
  // db.json is an untracked working copy of the seed; start from the seed when it is absent.
  if (!existsSync(databasePath)) copyFileSync(seedDatabasePath, databasePath)

  const app = jsonServer.create()
  const router = jsonServer.router(databasePath)
  const resolvedDelay = delayMs ?? Number(process.env.MOCK_API_DELAY_MS ?? 250)
  const accessTokens = new Map()
  const refreshTokens = new Map()
  let requestSequence = 0
  let tokenSequence = 0

  function findUserByAccessToken(request) {
    const authorization = request.get('authorization') ?? ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    const userId = accessTokens.get(token)
    return userId ? router.db.get('users').find({ id: userId }).value() : null
  }

  function requireUser(request, response) {
    const user = findUserByAccessToken(request)
    if (!user) {
      sendError(response, 401, 'AUTH_REQUIRED', 'Sign in to continue.')
      return null
    }
    return user
  }

  function issueAccessToken(userId) {
    tokenSequence += 1
    const accessToken = `mock_access_${userId}_${tokenSequence}`
    accessTokens.set(accessToken, userId)
    return { accessToken, tokenType: 'Bearer', expiresInSeconds: 3600 }
  }

  function issueSession(response, user) {
    const access = issueAccessToken(user.id)
    const refreshToken = `mock_refresh_${user.id}_${tokenSequence}`
    refreshTokens.set(refreshToken, user.id)
    response.cookie('gabayanRefresh', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/v1/auth',
    })
    return {
      ...access,
      user: publicUser(user),
      onboarding: {
        hasCultivation: Boolean(user.mockHasCultivation),
        suggestedRoute: user.mockHasCultivation ? '/app/home' : '/setup',
      },
    }
  }

  function money(amountMinor) {
    return { amountMinor, currency: 'PHP' }
  }

  // An account without a tier row is on FREE; only an operator moves it (BLOCKERS D-7).
  function accountTierCode(userId) {
    return router.db.get('accountTiers').find({ ownerUserId: userId }).value()?.tierCode ?? 'FREE'
  }

  function tierPlan(code) {
    return router.db.get('tierPlans').find({ code }).value()
  }

  // One active culture system is one cultivation not yet COMPLETED or CANCELLED (D-8).
  function activeCultureSystems(userId) {
    return router.db
      .get('cultivations')
      .filter(
        (cultivation) =>
          cultivation.ownerUserId === userId &&
          !['COMPLETED', 'CANCELLED'].includes(cultivation.status),
      )
      .size()
      .value()
  }

  function publicUpgradeRequest(upgradeRequest) {
    return omitKeys(upgradeRequest, ['ownerUserId'])
  }

  function accountTier(userId) {
    const plan = tierPlan(accountTierCode(userId))
    const active = activeCultureSystems(userId)
    const pending = router.db
      .get('upgradeRequests')
      .find({ ownerUserId: userId, status: 'PENDING' })
      .value()
    return {
      plan,
      activeCultureSystems: active,
      remainingCultureSystems: Math.max(0, plan.cultureSystemLimit - active),
      pendingUpgradeRequest: pending ? publicUpgradeRequest(pending) : null,
    }
  }

  function productSummary(product, userId) {
    const category = router.db.get('productCategories').find({ id: product.categoryId }).value()
    const isFavorite = Boolean(
      userId &&
      router.db.get('favorites').find({ ownerUserId: userId, productId: product.id }).value(),
    )
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      shortDescription: product.shortDescription,
      primaryImage: product.primaryImage,
      price: product.price,
      rating: product.rating,
      ratingCount: product.ratingCount,
      soldCount: product.soldCount,
      availability: product.availability,
      stockQuantity: product.stockQuantity,
      category,
      badges: product.badges,
      isFavorite,
    }
  }

  function productDetail(product, userId) {
    return {
      ...productSummary(product, userId),
      images: product.images,
      description: product.description,
      specifications: product.specifications,
      suitableSpeciesIds: product.suitableSpeciesIds,
      suitableEnvironmentIds: product.suitableEnvironmentIds,
      recommendation: product.recommendation,
      maximumOrderQuantity: product.maximumOrderQuantity,
    }
  }

  function getOrCreateCart(user) {
    let cart = router.db.get('carts').find({ ownerUserId: user.id }).value()
    if (!cart) {
      cart = {
        id: `cart_${user.id}`,
        ownerUserId: user.id,
        updatedAt: new Date().toISOString(),
        version: 1,
      }
      router.db.get('carts').push(cart).write()
    }
    return cart
  }

  function composeCart(cart, userId) {
    const items = router.db
      .get('cartItems')
      .filter({ cartId: cart.id })
      .value()
      .map((item) => {
        const product = router.db.get('products').find({ id: item.productId }).value()
        const unitPrice = product.price
        return {
          id: item.id,
          product: productSummary(product, userId),
          quantity: item.quantity,
          unitPrice,
          lineTotal: money(unitPrice.amountMinor * item.quantity),
          addedAt: item.addedAt,
        }
      })
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotalMinor = items.reduce((total, item) => total + item.lineTotal.amountMinor, 0)
    const deliveryFeeMinor = itemCount > 0 ? 15000 : 0
    return {
      id: cart.id,
      items,
      itemCount,
      subtotal: money(subtotalMinor),
      estimatedDeliveryFee: money(deliveryFeeMinor),
      estimatedTotal: money(subtotalMinor + deliveryFeeMinor),
      updatedAt: cart.updatedAt,
      version: cart.version,
    }
  }

  function touchCart(cart) {
    const updated = {
      updatedAt: new Date().toISOString(),
      version: cart.version + 1,
    }
    router.db.get('carts').find({ id: cart.id }).assign(updated).write()
    return { ...cart, ...updated }
  }

  function addressSnapshot(address) {
    return omitKeys(address, ['ownerUserId', 'isDefault', 'createdAt', 'updatedAt', 'version'])
  }

  function publicOrder(order) {
    return omitKeys(order, ['ownerUserId'])
  }

  function orderSummary(order) {
    const value = publicOrder(order)
    return Object.fromEntries(
      Object.entries(value).filter(([key]) =>
        [
          'id',
          'orderNumber',
          'status',
          'itemCount',
          'previewImages',
          'total',
          'placedAt',
          'estimatedDeliveryDate',
        ].includes(key),
      ),
    )
  }

  function publicCultivationDetail(cultivation) {
    const result = withoutInternalCultivationFields(cultivation)
    if (result.stockingEstimateSnapshot === null) {
      result.stockingEstimateSnapshot = router.db
        .get('cultivations')
        .find({ id: 'cul_tilapia_001' })
        .get('stockingEstimateSnapshot')
        .value()
    }
    return result
  }

  function averageWeightInGrams(cultivation) {
    const weight = cultivation.latestGrowthMeasurement?.averageWeight
    if (!weight) return null
    return weight.unit === 'KG' ? weight.value * 1000 : weight.value
  }

  function feedingPlanFor(cultivation, date = '2026-09-23') {
    const averageWeightG = averageWeightInGrams(cultivation) ?? 0
    const feedRatePercent = averageWeightG >= 300 ? 2.5 : 3
    const dailyTotalKg = Number(
      ((cultivation.estimatedLiveFish * averageWeightG * feedRatePercent) / 100 / 1000).toFixed(2),
    )
    const half = Number((dailyTotalKg / 2).toFixed(2))
    return {
      id: `feed_plan_${cultivation.id}_${date}`,
      cultivationId: cultivation.id,
      date,
      dailyTotal: { value: dailyTotalKg, unit: 'KG' },
      feedings: [
        {
          label: 'Morning feeding',
          scheduledAt: `${date}T00:00:00Z`,
          recommendedAmount: { value: half, unit: 'KG' },
        },
        {
          label: 'Afternoon feeding',
          scheduledAt: `${date}T08:00:00Z`,
          recommendedAmount: { value: Number((dailyTotalKg - half).toFixed(2)), unit: 'KG' },
        },
      ],
      estimatedLiveFish: cultivation.estimatedLiveFish,
      estimatedAverageWeight: cultivation.latestGrowthMeasurement?.averageWeight ?? {
        value: 0,
        unit: 'G',
      },
      growthStage: cultivation.growthStage.name,
      feedRatePercent,
      explanation:
        'This demo estimate combines the latest average-weight sample, estimated live fish, and the configured stage feed-rate profile.',
      isDemo: true,
      sourceStatus: 'DEMO',
      ruleVersion: 'demo-2026-09',
      disclaimer:
        'Observe feeding response and local conditions. This estimate is not a prescription and may require qualified local guidance.',
    }
  }

  function harvestReadinessFor(cultivation) {
    const averageWeightG = averageWeightInGrams(cultivation)
    const latestOn = cultivation.latestGrowthMeasurement?.measuredOn ?? null
    let status = 'INSUFFICIENT_DATA'
    let message = 'Record a current growth sample before assessing harvest readiness.'
    if (averageWeightG !== null && averageWeightG >= 350) {
      status = 'POTENTIALLY_READY'
      message =
        'The latest sample is within the demo target range. Confirm market needs, fish condition, and a representative sample before deciding.'
    } else if (averageWeightG !== null && averageWeightG >= 300) {
      status = 'READY_SOON'
      message = 'The latest sample is approaching the demo target range. Continue measuring.'
    } else if (averageWeightG !== null) {
      status = 'MONITOR'
      message = 'The latest sample is below the demo target range. Continue monitoring growth.'
    }
    const estimatedBiomass =
      averageWeightG === null
        ? null
        : {
            value: Number(((averageWeightG * cultivation.estimatedLiveFish) / 1000).toFixed(2)),
            unit: 'KG',
          }
    return {
      cultivationId: cultivation.id,
      status,
      estimatedAverageWeight: cultivation.latestGrowthMeasurement?.averageWeight ?? null,
      targetWeightRange: {
        minimum: { value: 350, unit: 'G' },
        maximum: { value: 450, unit: 'G' },
      },
      estimatedLiveFish: cultivation.estimatedLiveFish,
      estimatedBiomass,
      estimatedHarvestDate: cultivation.estimatedHarvestDate,
      latestMeasurementOn: latestOn,
      basis: [
        'Latest recorded average-weight sample',
        'Estimated live fish after recorded mortality',
        'Demo Tilapia target-weight profile',
      ],
      message,
      isDemo: true,
      sourceStatus: 'DEMO',
      ruleVersion: 'demo-2026-09',
      disclaimer:
        'Harvest readiness is an estimate, not a guarantee. Use a current representative sample and local professional judgment.',
    }
  }

  // Earliest scheduled task still ahead; a missed or cancelled task is not work to come.
  function nextOpenTaskAt(cultivationId) {
    const next = router.db
      .get('tasks')
      .filter(
        (task) => task.cultivationId === cultivationId && ['UPCOMING', 'DUE'].includes(task.status),
      )
      .sortBy('scheduledAt')
      .first()
      .value()
    return next?.scheduledAt ?? null
  }

  // Moves a task to COMPLETED with its linked record, bumps the cultivation's version and
  // marks the task's reminders read, each stamped `changedAt` (now by default). Returns the
  // stored task.
  function markTaskCompleted(task, cultivation, { completedAt, record, changedAt }) {
    const now = new Date().toISOString()
    const completedTask = {
      ...task,
      status: 'COMPLETED',
      completedAt,
      completionRecordType: record?.type ?? null,
      completionRecordId: record?.id ?? null,
      audit: { ...task.audit, updatedAt: changedAt ?? now, version: task.audit.version + 1 },
    }
    router.db.get('tasks').find({ id: task.id }).assign(completedTask).write()
    router.db
      .get('cultivations')
      .find({ id: cultivation.id })
      .assign({
        nextTaskAt: nextOpenTaskAt(cultivation.id),
        updatedAt: changedAt ?? now,
        version: cultivation.version + 1,
      })
      .write()
    router.db
      .get('notifications')
      .filter({ ownerUserId: cultivation.ownerUserId, taskId: task.id })
      .each((notification) => {
        if (notification.readAt === null) notification.readAt = changedAt ?? now
      })
      .write()
    return completedTask
  }

  function feedingKilogramsOn(cultivationId, day) {
    const grams = router.db
      .get('feedingRecords')
      .filter((record) => record.cultivationId === cultivationId)
      .value()
      .filter((record) => dateInManila(record.fedAt) === day)
      .reduce(
        (total, record) =>
          total + (record.amount.unit === 'KG' ? record.amount.value * 1000 : record.amount.value),
        0,
      )
    return Number((grams / 1000).toFixed(3))
  }

  app.disable('x-powered-by')
  app.use((request, response, next) => {
    const origin = request.get('origin')
    if (origin) {
      response.set('access-control-allow-origin', origin)
      response.set('access-control-allow-credentials', 'true')
      response.set('vary', 'Origin')
    }
    response.set(
      'access-control-allow-headers',
      'Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id',
    )
    response.set('access-control-allow-methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
    if (request.method === 'OPTIONS') return response.sendStatus(204)
    next()
  })
  app.use(jsonServer.defaults({ logger: process.env.NODE_ENV !== 'test', noCors: true }))
  app.use(jsonServer.bodyParser)
  app.use((request, response, next) => {
    requestSequence += 1
    const incomingId = request.get('x-request-id')
    response.locals.requestId = incomingId || `req_mock_${String(requestSequence).padStart(6, '0')}`
    response.set('x-request-id', response.locals.requestId)
    if (resolvedDelay > 0) return setTimeout(next, resolvedDelay)
    next()
  })

  app.get('/api/v1/health', (_request, response) => {
    return sendData(response, {
      status: 'ok',
      service: 'gabayan-mock-api',
      version: apiVersion,
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/api/v1/meta', (_request, response) => {
    return sendData(response, {
      apiVersion: 'v1',
      environment: 'development',
      demoData: true,
      serverTime: new Date().toISOString(),
      defaultTimezone: 'Asia/Manila',
    })
  })

  app.post('/api/v1/auth/register', (request, response) => {
    const registration = validateRegistration(request.body ?? {})
    if (Object.keys(registration.fields).length > 0) {
      return sendError(
        response,
        422,
        'VALIDATION_ERROR',
        'Review the highlighted account details.',
        registration.fields,
      )
    }
    const duplicate = router.db
      .get('users')
      .find((user) => user.email.toLowerCase() === registration.email)
      .value()
    if (duplicate) {
      return sendError(response, 409, 'DUPLICATE_EMAIL', 'An account already uses this email.', {
        email: ['Try signing in or use another email.'],
      })
    }

    const now = new Date().toISOString()
    const user = {
      id: `usr_${String(router.db.get('users').size().value() + 1).padStart(4, '0')}`,
      fullName: registration.fullName,
      email: registration.email,
      mobileNumber: registration.mobileNumber,
      avatar: null,
      emailVerified: false,
      mobileVerified: false,
      locale: 'en-PH',
      timezone: 'Asia/Manila',
      createdAt: now,
      updatedAt: now,
      version: 1,
      mockPassword: registration.password,
      mockHasCultivation: false,
    }
    router.db.get('users').push(user).write()
    return sendData(response, issueSession(response, user), 201)
  })

  app.post('/api/v1/auth/login', (request, response) => {
    const identifier = String(request.body?.identifier ?? '')
      .trim()
      .toLowerCase()
    const normalizedMobile = normalizeMobileNumber(identifier)
    const user = router.db
      .get('users')
      .find(
        (candidate) =>
          candidate.email.toLowerCase() === identifier ||
          (normalizedMobile && candidate.mobileNumber === normalizedMobile),
      )
      .value()
    if (!user || user.mockPassword !== request.body?.password) {
      return sendError(
        response,
        401,
        'INVALID_CREDENTIALS',
        'The email, mobile number, or password is incorrect.',
      )
    }
    return sendData(response, issueSession(response, user))
  })

  app.post('/api/v1/auth/google', (request, response) => {
    if (request.body?.idToken !== 'demo-google-token') {
      return sendError(
        response,
        401,
        'INVALID_CREDENTIALS',
        'The demo Google sign-in could not be verified.',
      )
    }
    const user = router.db.get('users').find({ id: 'usr_juan' }).value()
    return sendData(response, issueSession(response, user))
  })

  app.post('/api/v1/auth/password/forgot', (request, response) => {
    // The answer never says whether an account matched; only a missing identifier is refused.
    const identifier = request.body?.identifier
    if (typeof identifier !== 'string' || !identifier.trim()) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the highlighted fields.', {
        identifier: ['Enter your email or mobile number.'],
      })
    }
    return sendData(
      response,
      { message: 'If an account matches, password reset instructions are ready.' },
      202,
    )
  })

  app.post('/api/v1/auth/password/reset', (request, response) => {
    if (request.body?.token !== 'demo-reset-token') {
      return sendError(
        response,
        422,
        'VALIDATION_ERROR',
        'This reset link is invalid or expired.',
        {
          token: ['Request a new password reset link.'],
        },
      )
    }
    const password = String(request.body?.password ?? '')
    if (password.length < 8 || password !== request.body?.confirmPassword) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the new password.', {
        password: password.length < 8 ? ['Use at least 8 characters.'] : [],
        confirmPassword:
          password !== request.body?.confirmPassword ? ['Passwords must match.'] : [],
      })
    }
    router.db.get('users').find({ id: 'usr_juan' }).assign({ mockPassword: password }).write()
    return sendData(response, { message: 'Your password has been updated. You can now sign in.' })
  })

  app.post('/api/v1/auth/refresh', (request, response) => {
    const refreshToken = parseCookies(request).gabayanRefresh
    const userId = refreshTokens.get(refreshToken)
    if (!userId) return sendError(response, 401, 'AUTH_REQUIRED', 'Your session has ended.')
    return sendData(response, issueAccessToken(userId))
  })

  app.post('/api/v1/auth/logout', (request, response) => {
    const refreshToken = parseCookies(request).gabayanRefresh
    if (refreshToken) refreshTokens.delete(refreshToken)
    response.clearCookie('gabayanRefresh', { path: '/api/v1/auth' })
    return response.sendStatus(204)
  })

  app.get('/api/v1/users/me', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    return sendData(response, publicUser(user))
  })

  app.patch('/api/v1/users/me', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const body = request.body ?? {}
    const allowed = ['fullName', 'mobileNumber', 'locale', 'timezone']
    if (!allowed.some((field) => Object.hasOwn(body, field))) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Provide at least one profile change.')
    }
    const fields = {}
    const updates = {}
    if (Object.hasOwn(body, 'fullName')) {
      const fullName = String(body.fullName ?? '').trim()
      if (fullName.length < 2 || fullName.length > 100) {
        fields.fullName = ['Enter a name between 2 and 100 characters.']
      } else updates.fullName = fullName
    }
    if (Object.hasOwn(body, 'mobileNumber')) {
      const mobileNumber = normalizeMobileNumber(body.mobileNumber)
      if (!mobileNumber) fields.mobileNumber = ['Enter a valid Philippine mobile number.']
      else updates.mobileNumber = mobileNumber
    }
    for (const field of ['locale', 'timezone']) {
      if (Object.hasOwn(body, field)) {
        const value = String(body[field] ?? '').trim()
        if (!value) fields[field] = ['This field is required.']
        else updates[field] = value
      }
    }
    if (Object.keys(fields).length) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review your profile details.', fields)
    }
    const updated = {
      ...updates,
      updatedAt: new Date().toISOString(),
      version: user.version + 1,
    }
    router.db.get('users').find({ id: user.id }).assign(updated).write()
    return sendData(response, publicUser({ ...user, ...updated }))
  })

  app.get('/api/v1/users/me/farm', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const farm = router.db.get('farms').find({ ownerUserId: user.id }).value()
    if (!farm) return sendError(response, 404, 'NOT_FOUND', 'No farm profile has been created yet.')
    return sendData(response, farm)
  })

  app.put('/api/v1/users/me/farm', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const body = request.body ?? {}
    const name = String(body.name ?? '').trim()
    const experienceLevels = ['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED']
    const fields = {}
    if (name.length < 2 || name.length > 120)
      fields.name = ['Enter a farm name between 2 and 120 characters.']
    if (!experienceLevels.includes(body.experienceLevel))
      fields.experienceLevel = ['Choose a valid experience level.']
    if (Object.keys(fields).length)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the farm profile.', fields)
    const now = new Date().toISOString()
    const existing = router.db.get('farms').find({ ownerUserId: user.id }).value()
    const writable = {
      name,
      region: String(body.region ?? '').trim() || null,
      province: String(body.province ?? '').trim() || null,
      municipality: String(body.municipality ?? '').trim() || null,
      experienceLevel: body.experienceLevel,
      notes: String(body.notes ?? '').trim() || null,
    }
    if (existing) {
      const updated = { ...writable, updatedAt: now, version: existing.version + 1 }
      router.db.get('farms').find({ id: existing.id }).assign(updated).write()
      return sendData(response, { ...existing, ...updated })
    }
    const farm = {
      id: `farm_${user.id}`,
      ownerUserId: user.id,
      ...writable,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    router.db.get('farms').push(farm).write()
    return sendData(response, farm)
  })

  app.get('/api/v1/users/me/notification-settings', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    let settings = router.db.get('notificationSettings').find({ ownerUserId: user.id }).value()
    if (!settings) {
      settings = {
        id: `notification_settings_${user.id}`,
        ownerUserId: user.id,
        feedingReminders: true,
        waterMaintenance: true,
        growthSampling: true,
        harvestReminders: true,
        orderUpdates: true,
        educationalTips: true,
        morningFeedingTime: '08:00',
        afternoonFeedingTime: '16:30',
        timezone: user.timezone,
        updatedAt: new Date().toISOString(),
        version: 1,
      }
      router.db.get('notificationSettings').push(settings).write()
    }
    return sendData(response, omitKeys(settings, ['id', 'ownerUserId']))
  })

  app.patch('/api/v1/users/me/notification-settings', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const existing = router.db.get('notificationSettings').find({ ownerUserId: user.id }).value()
    if (!existing)
      return sendError(response, 404, 'NOT_FOUND', 'Notification settings were not found.')
    const body = request.body ?? {}
    const booleanFields = [
      'feedingReminders',
      'waterMaintenance',
      'growthSampling',
      'harvestReminders',
      'orderUpdates',
      'educationalTips',
    ]
    const allowed = [...booleanFields, 'morningFeedingTime', 'afternoonFeedingTime', 'timezone']
    if (!allowed.some((field) => Object.hasOwn(body, field)))
      return sendError(
        response,
        422,
        'VALIDATION_ERROR',
        'Provide at least one notification change.',
      )
    const fields = {}
    for (const field of booleanFields) {
      if (Object.hasOwn(body, field) && typeof body[field] !== 'boolean')
        fields[field] = ['Choose on or off.']
    }
    for (const field of ['morningFeedingTime', 'afternoonFeedingTime']) {
      if (
        Object.hasOwn(body, field) &&
        body[field] !== null &&
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body[field]))
      )
        fields[field] = ['Use a valid 24-hour time.']
    }
    if (Object.keys(fields).length)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review notification settings.', fields)
    const updates = Object.fromEntries(
      allowed.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]),
    )
    const updated = {
      ...updates,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    }
    router.db.get('notificationSettings').find({ id: existing.id }).assign(updated).write()
    return sendData(response, omitKeys({ ...existing, ...updated }, ['id', 'ownerUserId']))
  })

  app.get('/api/v1/tiers', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    return listCollection(request, response, router.db.get('tierPlans').value())
  })

  app.get('/api/v1/users/me/tier', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    return sendData(response, accountTier(user.id))
  })

  app.post('/api/v1/users/me/tier/upgrade-requests', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const body = request.body ?? {}
    const plans = router.db.get('tierPlans').value()
    const currentTier = accountTierCode(user.id)
    const rankOf = (code) => plans.findIndex((plan) => plan.code === code)
    const fields = {}
    if (rankOf(body.requestedTier) === -1) {
      fields.requestedTier = ['Choose Pro or Organization.']
    } else if (rankOf(body.requestedTier) <= rankOf(currentTier)) {
      fields.requestedTier = ['Choose a plan above the one you are on.']
    }
    const note = body.note == null ? null : String(body.note).trim() || null
    if (body.note != null && typeof body.note !== 'string') {
      fields.note = ['Write the note as text.']
    } else if (note && note.length > 500) {
      fields.note = ['Keep the note to 500 characters or fewer.']
    }
    if (Object.keys(fields).length) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Choose the plan you would like.', fields)
    }
    const pending = router.db
      .get('upgradeRequests')
      .find({ ownerUserId: user.id, status: 'PENDING' })
      .value()
    if (pending) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'Your plan request is still being reviewed. We will let you know once it is settled.',
        null,
        { pendingRequestId: pending.id, requestedTier: pending.requestedTier },
      )
    }
    const upgradeRequest = {
      id: `upg_${String(router.db.get('upgradeRequests').size().value() + 1).padStart(4, '0')}`,
      ownerUserId: user.id,
      currentTier,
      requestedTier: body.requestedTier,
      status: 'PENDING',
      note,
      createdAt: new Date().toISOString(),
    }
    router.db.get('upgradeRequests').push(upgradeRequest).write()
    return sendData(response, publicUpgradeRequest(upgradeRequest), 201)
  })

  app.get('/api/v1/species', (request, response) => {
    return listCollection(request, response, router.db.get('species').value())
  })

  app.get('/api/v1/species/:speciesId', (request, response) => {
    const species = router.db.get('species').find({ id: request.params.speciesId }).value()
    if (!species)
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that fish profile.')
    return sendData(response, species)
  })

  app.get('/api/v1/culture-environments', (request, response) => {
    return listCollection(request, response, router.db.get('cultureEnvironments').value())
  })

  app.get('/api/v1/culture-environments/:environmentId', (request, response) => {
    const environment = router.db
      .get('cultureEnvironments')
      .find({ id: request.params.environmentId })
      .value()
    if (!environment) {
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that culture environment.')
    }
    return sendData(response, environment)
  })

  app.get('/api/v1/compatibility', (request, response) => {
    const speciesId = String(request.query.speciesId ?? '')
    const environmentId = String(request.query.environmentId ?? '')
    if (!speciesId || !environmentId) {
      return sendError(
        response,
        400,
        'BAD_REQUEST',
        'Choose both a species and culture environment.',
      )
    }
    const rule = router.db.get('compatibilityRules').find({ speciesId, environmentId }).value()
    if (!rule)
      return sendError(response, 404, 'NOT_FOUND', 'No compatibility profile is available.')
    const alternatives = router.db
      .get('compatibilityRules')
      .filter((candidate) => candidate.speciesId === speciesId && candidate.status === 'COMPATIBLE')
      .map((candidate) => {
        const environment = router.db
          .get('cultureEnvironments')
          .find({ id: candidate.environmentId })
          .value()
        return { environmentId: environment.id, name: environment.name }
      })
      .value()
      .filter((alternative) => alternative.environmentId !== environmentId)
    const result = omitKeys(rule, ['id'])
    return sendData(response, { ...result, alternatives })
  })

  app.post('/api/v1/stocking-estimates', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const { speciesId, environmentId, dimensions, plannedFingerlings } = request.body ?? {}
    const fields = {}
    for (const key of ['lengthM', 'widthM', 'waterDepthM']) {
      if (!Number.isFinite(dimensions?.[key]) || dimensions[key] <= 0 || dimensions[key] > 10000) {
        fields[`dimensions.${key}`] = ['Enter a value greater than 0 within the planning limit.']
      }
    }
    if (!Number.isInteger(plannedFingerlings) || plannedFingerlings <= 0) {
      fields.plannedFingerlings = ['Enter a whole number greater than 0.']
    }
    if (Object.keys(fields).length > 0) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the cultivation details.', fields)
    }

    const species = router.db.get('species').find({ id: speciesId, active: true }).value()
    const environment = router.db
      .get('cultureEnvironments')
      .find({ id: environmentId, active: true })
      .value()
    if (!species || !environment) {
      return sendError(
        response,
        422,
        'VALIDATION_ERROR',
        'Choose an available species and environment.',
      )
    }
    const compatibilityRule = router.db
      .get('compatibilityRules')
      .find({ speciesId, environmentId })
      .value()
    if (!compatibilityRule || compatibilityRule.status === 'NOT_RECOMMENDED') {
      return sendError(
        response,
        400,
        'INCOMPATIBLE_SELECTION',
        compatibilityRule?.message ?? 'This combination cannot be estimated.',
      )
    }
    const rule = router.db.get('stockingRules').find({ speciesId, environmentId }).value()
    if (!rule) {
      return sendError(
        response,
        400,
        'RULE_INPUT_INCOMPLETE',
        'No demo stocking rule is available.',
      )
    }

    const surfaceAreaM2 = Number((dimensions.lengthM * dimensions.widthM).toFixed(2))
    const estimatedWaterVolumeM3 = Number((surfaceAreaM2 * dimensions.waterDepthM).toFixed(2))
    const basisValue = rule.basis === 'SURFACE_AREA' ? surfaceAreaM2 : estimatedWaterVolumeM3
    const recommendedMinimum = Math.max(1, Math.round(basisValue * rule.minimumDensity))
    const recommendedMaximum = Math.max(
      recommendedMinimum,
      Math.round(basisValue * rule.maximumDensity),
    )
    const status =
      plannedFingerlings < recommendedMinimum
        ? 'BELOW_RANGE'
        : plannedFingerlings > recommendedMaximum
          ? 'ABOVE_RANGE'
          : 'RECOMMENDED'
    const differenceToRange =
      status === 'BELOW_RANGE'
        ? plannedFingerlings - recommendedMinimum
        : status === 'ABOVE_RANGE'
          ? plannedFingerlings - recommendedMaximum
          : 0
    const estimateId = `est_${String(router.db.get('stockingEstimates').size().value() + 1).padStart(5, '0')}`
    const compatibility = omitKeys(compatibilityRule, ['id'])
    compatibility.alternatives = []
    const estimate = {
      estimateId,
      ownerUserId: user.id,
      species,
      environment,
      dimensions,
      surfaceAreaM2,
      estimatedWaterVolumeM3,
      plannedFingerlings,
      recommendedMinimum,
      recommendedMaximum,
      status,
      differenceToRange,
      suggestedFingerlings: Math.round((recommendedMinimum + recommendedMaximum) / 2),
      basis: {
        type: rule.basis,
        densityMinimum: rule.minimumDensity,
        densityMaximum: rule.maximumDensity,
        densityUnit: rule.densityUnit,
        inputAreaM2: surfaceAreaM2,
        inputVolumeM3: estimatedWaterVolumeM3,
        explanation: 'Demo density range for this prototype profile.',
      },
      compatibility,
      isDemo: true,
      sourceStatus: rule.sourceStatus,
      ruleVersion: rule.ruleVersion,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      disclaimer: ruleDisclaimer,
    }
    router.db.get('stockingEstimates').push(estimate).write()
    const publicEstimate = omitKeys(estimate, ['ownerUserId'])
    return sendData(response, publicEstimate)
  })

  app.get('/api/v1/cultivations', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    let records = router.db
      .get('cultivations')
      .filter({ ownerUserId: user.id })
      .value()
      .map(cultivationSummary)
    if (request.query.status) {
      const statuses = Array.isArray(request.query.status)
        ? request.query.status
        : String(request.query.status).split(',')
      records = records.filter((record) => statuses.includes(record.status))
    }
    return listCollection(request, response, records)
  })

  app.post('/api/v1/cultivations', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey) {
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    }
    const recordKey = `${user.id}:POST:/cultivations:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)

    const tier = accountTier(user.id)
    if (tier.remainingCultureSystems === 0) {
      const { plan, activeCultureSystems: active } = tier
      const systems = plan.cultureSystemLimit === 1 ? 'culture system' : 'culture systems'
      return sendError(
        response,
        403,
        'TIER_LIMIT_REACHED',
        `Your ${plan.name} plan covers ${plan.cultureSystemLimit} active ${systems}. Harvest or close one, or ask for a bigger plan.`,
        null,
        {
          tier: plan.code,
          cultureSystemLimit: plan.cultureSystemLimit,
          activeCultureSystems: active,
        },
      )
    }

    const body = request.body ?? {}
    const estimate = router.db
      .get('stockingEstimates')
      .find({ estimateId: body.estimateId })
      .value()
    if (
      !estimate ||
      estimate.ownerUserId !== user.id ||
      Date.parse(estimate.expiresAt) < Date.now()
    ) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'The stocking estimate expired. Request a new estimate.',
      )
    }
    const dimensionsMatch = ['lengthM', 'widthM', 'waterDepthM'].every(
      (key) => estimate.dimensions[key] === body.dimensions?.[key],
    )
    if (
      estimate.species.id !== body.speciesId ||
      estimate.environment.id !== body.environmentId ||
      estimate.plannedFingerlings !== body.initialFingerlings ||
      !dimensionsMatch
    ) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'The cultivation details no longer match the estimate.',
      )
    }
    if (estimate.status === 'ABOVE_RANGE' && body.acceptedAboveRangeWarning !== true) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Confirm the above-range warning.', {
        acceptedAboveRangeWarning: ['Explicit confirmation is required.'],
      })
    }

    const existingCount = router.db
      .get('cultivations')
      .filter({ ownerUserId: user.id })
      .size()
      .value()
    const now = new Date().toISOString()
    const estimatedDurationDays = Math.round(
      (estimate.species.estimatedCultureDays.minimum +
        estimate.species.estimatedCultureDays.maximum) /
        2,
    )
    const cultivation = {
      id: `cul_${String(router.db.get('cultivations').size().value() + 1).padStart(5, '0')}`,
      ownerUserId: user.id,
      name:
        String(body.name ?? '').trim() ||
        `${estimate.species.commonName} - Batch #${String(existingCount + 1).padStart(3, '0')}`,
      species: compactSpecies(estimate.species),
      environment: compactEnvironment(estimate.environment),
      status: body.stockedOn ? 'ACTIVE' : 'PLANNING',
      dayNumber: body.stockedOn ? 1 : null,
      estimatedDurationDays,
      progressPercent: body.stockedOn ? 1 : 0,
      initialFingerlings: body.initialFingerlings,
      estimatedLiveFish: body.initialFingerlings,
      estimatedHarvestDate: null,
      nextTaskAt: null,
      stockingStatus: estimate.status,
      createdAt: now,
      updatedAt: now,
      version: 1,
      dimensions: estimate.dimensions,
      surfaceAreaM2: estimate.surfaceAreaM2,
      estimatedWaterVolumeM3: estimate.estimatedWaterVolumeM3,
      stockedOn: body.stockedOn ?? null,
      recordedMortality: 0,
      latestGrowthMeasurement: null,
      growthStage: { code: 'PLANNING', name: 'Planning', isEstimated: true },
      feedingSummary: null,
      harvestSummary: {
        targetWeight: null,
        readinessStatus: 'INSUFFICIENT_DATA',
        estimatedHarvestDate: null,
      },
      stockingEstimateSnapshot: withoutInternalCultivationFields(estimate),
      recommendationDisclaimer: ruleDisclaimer,
      notes: null,
    }
    router.db.get('cultivations').push(cultivation).write()
    router.db.get('users').find({ id: user.id }).assign({ mockHasCultivation: true }).write()
    const result = withoutInternalCultivationFields(cultivation)
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/cultivations/:cultivationId/equipment-recommendations', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation)
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that cultivation.')
    const category = router.db.get('productCategories').find({ id: 'cat_aeration' }).value()
    const product = router.db.get('products').find({ id: 'prd_pond_aerator' }).value()
    const recommendedProduct = {
      ...product,
      category,
      recommendationBadge: 'Suggested for setup',
      whyRelevant: 'Aeration may help support dissolved oxygen when appropriate for your setup.',
      suggestedQuantity: 1,
      mandatory: false,
    }
    delete recommendedProduct.categoryId
    return sendData(response, {
      cultivationId: cultivation.id,
      context: {
        species: cultivation.species,
        environment: cultivation.environment,
        initialFingerlings: cultivation.initialFingerlings,
        estimatedWaterVolumeM3: cultivation.estimatedWaterVolumeM3,
      },
      sections: [
        {
          category,
          reason: 'Optional equipment to review before stocking.',
          products: [recommendedProduct],
        },
      ],
      isDemo: true,
      ruleVersion: 'demo-2026-09',
      disclaimer: ruleDisclaimer,
    })
  })

  app.get('/api/v1/dashboard/home', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const date = String(request.query.date ?? dateInManila(new Date().toISOString()))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return sendError(response, 400, 'BAD_REQUEST', 'Date must use YYYY-MM-DD.')
    }
    const cultivations = router.db.get('cultivations').filter({ ownerUserId: user.id }).value()
    const primaryCultivation =
      cultivations.find((item) => !['COMPLETED', 'CANCELLED'].includes(item.status)) ?? null
    const cultivationIds = new Set(cultivations.map((item) => item.id))
    const tasks = router.db
      .get('tasks')
      .value()
      .filter(
        (task) => cultivationIds.has(task.cultivationId) && dateInManila(task.scheduledAt) === date,
      )
      .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))
    const notifications = router.db.get('notifications').filter({ ownerUserId: user.id }).value()
    const tip = router.db.get('educationalTips').first().value()
    const latestWeight = primaryCultivation?.latestGrowthMeasurement?.averageWeight ?? null
    const daysUntilHarvest = primaryCultivation?.estimatedDurationDays
      ? Math.max(primaryCultivation.estimatedDurationDays - (primaryCultivation.dayNumber ?? 0), 0)
      : null
    return sendData(response, {
      date,
      greetingName: user.fullName.split(' ')[0],
      primaryCultivation: primaryCultivation ? cultivationSummary(primaryCultivation) : null,
      taskSummary: {
        completed: tasks.filter((task) => task.status === 'COMPLETED').length,
        total: tasks.length,
      },
      tasks,
      farmOverview: primaryCultivation
        ? {
            fishAgeDays: primaryCultivation.dayNumber,
            estimatedAverageWeight: latestWeight,
            dailyFeed: primaryCultivation.feedingSummary?.dailyFeed ?? null,
            daysUntilHarvest,
          }
        : null,
      tip,
      unreadNotificationCount: notifications.filter((item) => item.readAt === null).length,
    })
  })

  app.get('/api/v1/cultivations/:cultivationId/timeline', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) {
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that cultivation.')
    }
    const events = router.db
      .get('timelineEvents')
      .filter({ cultivationId: cultivation.id })
      .value()
      .map((event) => omitKeys(event, ['cultivationId']))
    return sendData(response, {
      cultivationId: cultivation.id,
      currentStage: cultivation.growthStage,
      events,
    })
  })

  app.get('/api/v1/cultivations/:cultivationId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) {
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that cultivation.')
    }
    return sendData(response, publicCultivationDetail(cultivation))
  })

  // Edits the name, stocking date or notes. Setting the stocking date on a planning
  // cultivation makes it ACTIVE; a closed cultivation accepts no edits (BLOCKERS D-30).
  app.patch('/api/v1/cultivations/:cultivationId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const expectedVersion = parseIfMatch(request.get('if-match'))
    if (expectedVersion === null) {
      return sendError(
        response,
        400,
        'BAD_REQUEST',
        'If-Match must be the version number you last read.',
      )
    }
    const { fields, changes } = validateCultivationPatch(request.body ?? {})
    if (Object.keys(fields).length) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the highlighted fields.', fields)
    }
    if (!Object.keys(changes).length) {
      return sendError(
        response,
        422,
        'VALIDATION_ERROR',
        'Provide at least one cultivation change.',
      )
    }
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) {
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that cultivation.')
    }
    if (expectedVersion !== undefined && expectedVersion !== cultivation.version) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'Your cultivation was changed somewhere else. Reload it and try again.',
        null,
        { currentVersion: cultivation.version },
      )
    }
    if (['COMPLETED', 'CANCELLED'].includes(cultivation.status)) {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation is closed and can no longer be edited.',
        null,
        { status: cultivation.status },
      )
    }
    const today = dateInManila(new Date().toISOString())
    if (changes.stockedOn && changes.stockedOn > today) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the stocking date.', {
        stockedOn: ['The stocking date cannot be in the future.'],
      })
    }
    const updates = { ...changes }
    if (changes.stockedOn) {
      const schedule = stockingSchedule(changes.stockedOn, cultivation.estimatedDurationDays, today)
      Object.assign(updates, schedule, {
        harvestSummary: {
          ...cultivation.harvestSummary,
          estimatedHarvestDate: schedule.estimatedHarvestDate,
        },
      })
      if (cultivation.status === 'PLANNING') updates.status = 'ACTIVE'
    }
    updates.updatedAt = new Date().toISOString()
    updates.version = cultivation.version + 1
    router.db.get('cultivations').find({ id: cultivation.id }).assign(updates).write()
    return sendData(response, publicCultivationDetail({ ...cultivation, ...updates }))
  })

  app.get('/api/v1/cultivations/:cultivationId/growth-measurements', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    const direction = request.query.order === 'desc' ? -1 : 1
    const records = router.db
      .get('growthMeasurements')
      .filter({ cultivationId: cultivation.id })
      .value()
      .sort((left, right) => left.measuredOn.localeCompare(right.measuredOn) * direction)
    return listCollection(request, response, records)
  })

  app.post('/api/v1/cultivations/:cultivationId/growth-measurements', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey)
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    const recordKey = `${user.id}:POST:/cultivations/${request.params.cultivationId}/growth-measurements:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    if (['COMPLETED', 'CANCELLED'].includes(cultivation.status)) {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation no longer accepts growth records.',
      )
    }
    const body = request.body ?? {}
    const fields = {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.measuredOn ?? '')))
      fields.measuredOn = ['Enter a valid measurement date.']
    if (!Number.isInteger(body.numberOfFishSampled) || body.numberOfFishSampled <= 0)
      fields.numberOfFishSampled = ['Enter a sample size greater than 0.']
    if (
      !Number.isFinite(body.averageWeight?.value) ||
      body.averageWeight.value <= 0 ||
      !['G', 'KG'].includes(body.averageWeight?.unit)
    )
      fields.averageWeight = ['Enter a weight greater than 0 in g or kg.']
    if (Object.keys(fields).length)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the growth record.', fields)

    const previousAverageWeight = cultivation.latestGrowthMeasurement?.averageWeight ?? null
    const previousGrams = averageWeightInGrams(cultivation)
    const weightGrams =
      body.averageWeight.unit === 'KG' ? body.averageWeight.value * 1000 : body.averageWeight.value
    const now = new Date().toISOString()
    const record = {
      id: `grw_${String(router.db.get('growthMeasurements').size().value() + 1).padStart(5, '0')}`,
      cultivationId: cultivation.id,
      measuredOn: body.measuredOn,
      numberOfFishSampled: body.numberOfFishSampled,
      averageWeight: body.averageWeight,
      notes: String(body.notes ?? '').trim() || null,
      recordedBy: { id: user.id, fullName: user.fullName },
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    router.db.get('growthMeasurements').push(record).write()
    const growthStage =
      weightGrams >= 300
        ? { code: 'PRE_HARVEST', name: 'Pre-harvest', isEstimated: true }
        : { code: 'GROWING', name: 'Growing', isEstimated: true }
    const provisional = {
      ...cultivation,
      latestGrowthMeasurement: record,
      growthStage,
      status: weightGrams >= 300 ? 'PRE_HARVEST' : 'GROWING',
    }
    const feedingPlan = feedingPlanFor(provisional, body.measuredOn)
    const harvestReadiness = harvestReadinessFor(provisional)
    const updates = {
      latestGrowthMeasurement: record,
      growthStage,
      status: provisional.status,
      feedingSummary: {
        dailyFeed: feedingPlan.dailyTotal,
        feedingsPerDay: feedingPlan.feedings.length,
        nextFeedingAt: feedingPlan.feedings[1].scheduledAt,
        planId: feedingPlan.id,
      },
      harvestSummary: {
        ...cultivation.harvestSummary,
        readinessStatus: harvestReadiness.status,
      },
      updatedAt: now,
      version: cultivation.version + 1,
    }
    router.db.get('cultivations').find({ id: cultivation.id }).assign(updates).write()
    const result = {
      record,
      previousAverageWeight,
      change:
        previousGrams === null
          ? null
          : { value: Number((weightGrams - previousGrams).toFixed(2)), unit: 'G' },
      feedingPlan,
      harvestReadiness,
    }
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/cultivations/:cultivationId/mortality-records', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    const records = router.db
      .get('mortalityRecords')
      .filter({ cultivationId: cultivation.id })
      .value()
      .sort((left, right) => right.occurredOn.localeCompare(left.occurredOn))
    return listCollection(request, response, records)
  })

  app.post('/api/v1/cultivations/:cultivationId/mortality-records', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey)
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    const recordKey = `${user.id}:POST:/cultivations/${request.params.cultivationId}/mortality-records:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    if (['COMPLETED', 'CANCELLED'].includes(cultivation.status))
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation no longer accepts mortality records.',
      )
    const body = request.body ?? {}
    const reasons = ['UNKNOWN', 'WATER_QUALITY', 'DISEASE', 'HANDLING', 'PREDATION', 'OTHER']
    const fields = {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.occurredOn ?? '')))
      fields.occurredOn = ['Enter a valid date.']
    if (!Number.isInteger(body.fishCount) || body.fishCount <= 0)
      fields.fishCount = ['Enter a whole number greater than 0.']
    if (!reasons.includes(body.reason)) fields.reason = ['Choose a valid reason.']
    if (body.fishCount > cultivation.estimatedLiveFish)
      fields.fishCount = ['Mortality cannot exceed the estimated live fish.']
    if (Object.keys(fields).length)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the mortality record.', fields)
    const now = new Date().toISOString()
    const record = {
      id: `mort_${String(router.db.get('mortalityRecords').size().value() + 1).padStart(5, '0')}`,
      cultivationId: cultivation.id,
      occurredOn: body.occurredOn,
      fishCount: body.fishCount,
      reason: body.reason,
      notes: String(body.notes ?? '').trim() || null,
      recordedBy: { id: user.id, fullName: user.fullName },
      createdAt: now,
    }
    router.db.get('mortalityRecords').push(record).write()
    const recordedMortality = cultivation.recordedMortality + body.fishCount
    const estimatedLiveFish = cultivation.initialFingerlings - recordedMortality
    const provisional = { ...cultivation, recordedMortality, estimatedLiveFish }
    const feedingPlan = feedingPlanFor(provisional, body.occurredOn)
    const updates = {
      recordedMortality,
      estimatedLiveFish,
      feedingSummary: cultivation.feedingSummary
        ? {
            ...cultivation.feedingSummary,
            dailyFeed: feedingPlan.dailyTotal,
            planId: feedingPlan.id,
          }
        : null,
      updatedAt: now,
      version: cultivation.version + 1,
    }
    router.db.get('cultivations').find({ id: cultivation.id }).assign(updates).write()
    const result = {
      record,
      stock: {
        initialFingerlings: cultivation.initialFingerlings,
        recordedMortality,
        estimatedLiveFish,
      },
      feedingPlan,
    }
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/cultivations/:cultivationId/feeding-plan', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    return sendData(
      response,
      feedingPlanFor(cultivation, String(request.query.date ?? '2026-09-23')),
    )
  })

  app.get('/api/v1/cultivations/:cultivationId/feeding-records', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    const records = router.db
      .get('feedingRecords')
      .filter({ cultivationId: cultivation.id })
      .value()
      .sort((left, right) => right.fedAt.localeCompare(left.fedAt))
    return listCollection(request, response, records)
  })

  // Records a feeding. A `taskId` names a feeding task of the same cultivation, which the
  // record completes; without one the record's `taskId` is null (BLOCKERS D-36).
  app.post('/api/v1/cultivations/:cultivationId/feeding-records', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey)
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    const recordKey = `${user.id}:POST:/cultivations/${request.params.cultivationId}/feeding-records:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)
    const { fields, fedAt, taskId, notes } = validateFeedingRecord(request.body ?? {})
    if (Object.keys(fields).length) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the highlighted fields.', fields)
    }
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) {
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that cultivation.')
    }
    let task = null
    if (taskId !== null) {
      task = router.db.get('tasks').find({ id: taskId, cultivationId: cultivation.id }).value()
      if (!task) {
        return sendError(response, 422, 'VALIDATION_ERROR', 'Review the feeding record.', {
          taskId: ['Choose a task of this cultivation.'],
        })
      }
      if (task.type !== 'FEEDING') {
        return sendError(response, 422, 'VALIDATION_ERROR', 'Review the feeding record.', {
          taskId: ['Only a feeding task can be completed by a feeding record.'],
        })
      }
      if (task.status === 'COMPLETED') {
        return sendError(response, 409, 'CONFLICT', 'This task is already complete.', null, {
          status: task.status,
          completionRecordType: task.completionRecordType,
        })
      }
      if (task.status === 'CANCELLED') {
        return sendError(
          response,
          409,
          'INVALID_STATE_TRANSITION',
          'This task was cancelled and can no longer be completed.',
          null,
          { status: task.status },
        )
      }
    }
    if (['COMPLETED', 'CANCELLED'].includes(cultivation.status)) {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation no longer accepts feeding records.',
        null,
        { status: cultivation.status },
      )
    }
    if (!cultivation.stockedOn) {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'Set the stocking date before adding feeding records.',
        null,
        { status: cultivation.status },
      )
    }
    const fedOn = dateInManila(fedAt)
    const today = dateInManila(new Date().toISOString())
    const dateProblem =
      fedOn > today
        ? 'The date cannot be in the future.'
        : fedOn < cultivation.stockedOn
          ? 'The date cannot be before the stocking date.'
          : null
    if (dateProblem) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the feeding record.', {
        fedAt: [dateProblem],
      })
    }
    const now = new Date().toISOString()
    const record = {
      id: `feed_${String(router.db.get('feedingRecords').size().value() + 1).padStart(5, '0')}`,
      cultivationId: cultivation.id,
      taskId: task?.id ?? null,
      fedAt,
      amount: request.body.amount,
      notes,
      recordedBy: { id: user.id, fullName: user.fullName },
      createdAt: now,
    }
    router.db.get('feedingRecords').push(record).write()
    const completedTask = task
      ? markTaskCompleted(task, cultivation, {
          completedAt: fedAt,
          record: { type: 'FEEDING_RECORD', id: record.id },
          changedAt: now,
        })
      : null
    const result = {
      record,
      completedTask,
      dailyProgress: {
        recorded: { value: feedingKilogramsOn(cultivation.id, fedOn), unit: 'KG' },
        planned: feedingPlanFor(cultivation, fedOn).dailyTotal,
      },
    }
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/cultivations/:cultivationId/water-checks', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    const records = router.db
      .get('waterChecks')
      .filter({ cultivationId: cultivation.id })
      .value()
      .sort((left, right) => right.checkedAt.localeCompare(left.checkedAt))
    return listCollection(request, response, records)
  })

  app.post('/api/v1/cultivations/:cultivationId/water-checks', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey)
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    const recordKey = `${user.id}:POST:/cultivations/${request.params.cultivationId}/water-checks:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    if (['COMPLETED', 'CANCELLED'].includes(cultivation.status))
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation no longer accepts water checks.',
      )
    const body = request.body ?? {}
    if (
      !body.checkedAt ||
      Number.isNaN(Date.parse(body.checkedAt)) ||
      typeof body.observation !== 'object'
    ) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the water observation.')
    }
    const concerning =
      Boolean(body.observation.unusualChanges) ||
      /unusual|strong|bad/i.test(String(body.observation.odor ?? ''))
    const guidance = [
      concerning
        ? {
            severity: 'CAUTION',
            title: 'Review the change promptly',
            message:
              'An unusual change was recorded. Check available water-quality measurements and seek local technical guidance before taking major action.',
            sourceStatus: 'DEMO',
            ruleVersion: 'demo-2026-09',
            disclaimer:
              'This conditional demo guidance does not prescribe full water replacement or diagnose a cause.',
          }
        : {
            severity: 'INFO',
            title: 'Continue regular observation',
            message:
              'No unusual change was recorded. Continue observing fish behavior and water condition.',
            sourceStatus: 'DEMO',
            ruleVersion: 'demo-2026-09',
            disclaimer:
              'This is conditional demo guidance and is not a site-specific water-quality assessment.',
          },
    ]
    const now = new Date().toISOString()
    const record = {
      id: `water_${String(router.db.get('waterChecks').size().value() + 1).padStart(5, '0')}`,
      cultivationId: cultivation.id,
      checkedAt: body.checkedAt,
      observation: body.observation,
      actionTaken: String(body.actionTaken ?? '').trim() || null,
      notes: String(body.notes ?? '').trim() || null,
      guidance,
      recordedBy: { id: user.id, fullName: user.fullName },
      createdAt: now,
    }
    router.db.get('waterChecks').push(record).write()
    const generatedTasks = []
    if (concerning) {
      const task = {
        id: `task_followup_${String(router.db.get('tasks').size().value() + 1).padStart(5, '0')}`,
        cultivationId: cultivation.id,
        type: 'WATER_MAINTENANCE',
        title: 'Follow up on water observation',
        instruction:
          'Recheck fish behavior and available water-quality measurements. Seek local guidance if the change continues.',
        scheduledAt: now,
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'UPCOMING',
        recommendedAmount: null,
        completedAt: null,
        completionRecordType: null,
        completionRecordId: null,
        deepLink: `/app/cultivations/${cultivation.id}/records?tab=water`,
        audit: { createdAt: now, updatedAt: now, version: 1 },
      }
      router.db.get('tasks').push(task).write()
      generatedTasks.push(task)
    }
    const result = { record, generatedTasks, guidance }
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/cultivations/:cultivationId/harvest-readiness', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    return sendData(response, harvestReadinessFor(cultivation))
  })

  app.post('/api/v1/cultivations/:cultivationId/harvest', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey)
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    const recordKey = `${user.id}:POST:/cultivations/${request.params.cultivationId}/harvest:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)
    const cultivation = router.db
      .get('cultivations')
      .find({ id: request.params.cultivationId, ownerUserId: user.id })
      .value()
    if (!cultivation) return sendError(response, 404, 'NOT_FOUND', 'Cultivation not found.')
    if (cultivation.status === 'COMPLETED')
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation is already complete.',
      )
    const body = request.body ?? {}
    const fields = {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.harvestDate ?? '')))
      fields.harvestDate = ['Enter a valid harvest date.']
    if (
      !Number.isInteger(body.numberHarvested) ||
      body.numberHarvested <= 0 ||
      body.numberHarvested > cultivation.estimatedLiveFish
    )
      fields.numberHarvested = ['Enter a harvested count within the estimated live fish.']
    if (
      !Number.isFinite(body.totalHarvestWeight?.value) ||
      body.totalHarvestWeight.value <= 0 ||
      body.totalHarvestWeight.unit !== 'KG'
    )
      fields.totalHarvestWeight = ['Enter total harvest weight in kg.']
    if (
      !Number.isFinite(body.averageFishWeight?.value) ||
      body.averageFishWeight.value <= 0 ||
      !['G', 'KG'].includes(body.averageFishWeight.unit)
    )
      fields.averageFishWeight = ['Enter an average fish weight in g or kg.']
    if (
      !Number.isInteger(body.sellingPricePerKg?.amountMinor) ||
      body.sellingPricePerKg.amountMinor < 0 ||
      body.sellingPricePerKg.currency !== 'PHP'
    )
      fields.sellingPricePerKg = ['Enter a valid Philippine Peso price per kg.']
    if (Object.keys(fields).length)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the harvest record.', fields)
    const now = new Date().toISOString()
    const estimatedRevenue = money(
      Math.round(body.totalHarvestWeight.value * body.sellingPricePerKg.amountMinor),
    )
    const harvest = {
      id: `harvest_${String(router.db.get('harvestRecords').size().value() + 1).padStart(5, '0')}`,
      cultivationId: cultivation.id,
      harvestDate: body.harvestDate,
      numberHarvested: body.numberHarvested,
      totalHarvestWeight: body.totalHarvestWeight,
      averageFishWeight: body.averageFishWeight,
      sellingPricePerKg: body.sellingPricePerKg,
      notes: String(body.notes ?? '').trim() || null,
      estimatedRevenue,
      createdAt: now,
      recordedBy: { id: user.id, fullName: user.fullName },
    }
    router.db.get('harvestRecords').push(harvest).write()
    const duration = cultivation.stockedOn
      ? Math.max(
          1,
          Math.floor(
            (Date.parse(body.harvestDate) - Date.parse(cultivation.stockedOn)) / 86400000,
          ) + 1,
        )
      : cultivation.dayNumber
    const feedingRecords = router.db
      .get('feedingRecords')
      .filter({ cultivationId: cultivation.id })
      .value()
    const feedUsedKg = feedingRecords.reduce(
      (total, record) =>
        total + (record.amount.unit === 'G' ? record.amount.value / 1000 : record.amount.value),
      0,
    )
    const updates = {
      status: 'COMPLETED',
      progressPercent: 100,
      nextTaskAt: null,
      updatedAt: now,
      version: cultivation.version + 1,
      harvestSummary: {
        ...cultivation.harvestSummary,
        readinessStatus: 'POTENTIALLY_READY',
        estimatedHarvestDate: body.harvestDate,
      },
    }
    router.db.get('cultivations').find({ id: cultivation.id }).assign(updates).write()
    router.db
      .get('timelineEvents')
      .push({
        id: `timeline_harvest_${cultivation.id}`,
        cultivationId: cultivation.id,
        type: 'HARVEST',
        label: 'Harvest completed',
        status: 'COMPLETED',
        occurredOn: body.harvestDate,
        estimatedOn: null,
        detail: `${body.numberHarvested} fish and ${body.totalHarvestWeight.value} kg recorded.`,
      })
      .write()
    const refreshed = router.db.get('cultivations').find({ id: cultivation.id }).value()
    const summary = {
      cultureDurationDays: duration,
      fingerlingsStocked: cultivation.initialFingerlings,
      fishHarvested: body.numberHarvested,
      recordedMortality: cultivation.recordedMortality,
      survivalRatePercent: Number(
        ((body.numberHarvested / cultivation.initialFingerlings) * 100).toFixed(1),
      ),
      totalHarvestWeight: body.totalHarvestWeight,
      estimatedFeedUsed: { value: Number(feedUsedKg.toFixed(2)), unit: 'KG' },
      estimatedExpenses: null,
      estimatedRevenue,
      isDemo: true,
    }
    const result = { cultivation: publicCultivationDetail(refreshed), harvest, summary }
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/tasks', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cultivationIds = new Set(
      router.db.get('cultivations').filter({ ownerUserId: user.id }).map('id').value(),
    )
    let tasks = router.db
      .get('tasks')
      .value()
      .filter((task) => cultivationIds.has(task.cultivationId))
    if (request.query.date) {
      tasks = tasks.filter((task) => dateInManila(task.scheduledAt) === request.query.date)
    }
    if (request.query.cultivationId) {
      tasks = tasks.filter((task) => task.cultivationId === request.query.cultivationId)
    }
    if (request.query.status) {
      const statuses = Array.isArray(request.query.status)
        ? request.query.status
        : String(request.query.status).split(',')
      tasks = tasks.filter((task) => statuses.includes(task.status))
    }
    tasks.sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt))
    return listCollection(request, response, tasks)
  })

  app.get('/api/v1/tasks/:taskId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const task = router.db.get('tasks').find({ id: request.params.taskId }).value()
    const cultivation = task
      ? router.db.get('cultivations').find({ id: task.cultivationId, ownerUserId: user.id }).value()
      : null
    if (!task || !cultivation) return sendError(response, 404, 'NOT_FOUND', 'Task not found.')
    return sendData(response, task)
  })

  app.post('/api/v1/tasks/:taskId/complete', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey) {
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    }
    const recordKey = `${user.id}:POST:/tasks/${request.params.taskId}/complete:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response)

    const task = router.db.get('tasks').find({ id: request.params.taskId }).value()
    const cultivation = task
      ? router.db.get('cultivations').find({ id: task.cultivationId, ownerUserId: user.id }).value()
      : null
    if (!task || !cultivation) return sendError(response, 404, 'NOT_FOUND', 'Task not found.')
    if (task.status === 'COMPLETED') {
      return sendError(response, 409, 'CONFLICT', 'This task is already complete.')
    }

    const completedAt = String(request.body?.completedAt ?? '')
    const amount = request.body?.actualAmount
    const fields = {}
    if (!completedAt || Number.isNaN(Date.parse(completedAt))) {
      fields.completedAt = ['Enter a valid completion time.']
    }
    if (
      task.type === 'FEEDING' &&
      (!amount ||
        !Number.isFinite(amount.value) ||
        amount.value <= 0 ||
        !['G', 'KG'].includes(amount.unit))
    ) {
      fields.actualAmount = ['Enter a feeding amount greater than 0 in g or kg.']
    }
    if (Object.keys(fields).length > 0) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the completion details.', fields)
    }

    let linkedRecord = null
    if (task.type === 'FEEDING') {
      linkedRecord = {
        id: `feed_${String(router.db.get('feedingRecords').size().value() + 1).padStart(5, '0')}`,
        cultivationId: cultivation.id,
        taskId: task.id,
        fedAt: completedAt,
        amount,
        notes: String(request.body?.notes ?? '').trim() || null,
        recordedBy: { id: user.id, fullName: user.fullName },
        createdAt: completedAt,
      }
      router.db.get('feedingRecords').push(linkedRecord).write()
    }
    const completedTask = markTaskCompleted(task, cultivation, {
      completedAt,
      record: linkedRecord ? { type: 'FEEDING_RECORD', id: linkedRecord.id } : null,
      changedAt: completedAt,
    })
    const refreshedCultivation = router.db.get('cultivations').find({ id: cultivation.id }).value()
    const result = {
      task: completedTask,
      linkedRecord,
      cultivationSnapshot: cultivationSummary(refreshedCultivation),
    }
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result)
  })

  // Returns a completed task to DUE and keeps the reason as an audit entry. No record type is
  // reversible yet, so a completion that created a farm record is refused (BLOCKERS D-21).
  app.post('/api/v1/tasks/:taskId/reopen', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const reason = request.body?.reason
    if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the highlighted fields.', {
        reason: [
          typeof reason === 'string' && reason.trim().length > 500
            ? 'Use at most 500 characters.'
            : 'Say why the task is being reopened.',
        ],
      })
    }
    const task = router.db.get('tasks').find({ id: request.params.taskId }).value()
    const cultivation = task
      ? router.db.get('cultivations').find({ id: task.cultivationId, ownerUserId: user.id }).value()
      : null
    if (!task || !cultivation) {
      return sendError(response, 404, 'NOT_FOUND', 'We could not find that task.')
    }
    if (['COMPLETED', 'CANCELLED'].includes(cultivation.status)) {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This cultivation is closed and its tasks can no longer change.',
        null,
        { status: cultivation.status },
      )
    }
    if (task.status !== 'COMPLETED') {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'Only a completed task can be reopened.',
        null,
        { status: task.status },
      )
    }
    if (task.completionRecordType !== null) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'This task created a farm record that cannot be reversed, so it cannot be reopened.',
        null,
        { status: task.status, completionRecordType: task.completionRecordType },
      )
    }
    const now = new Date().toISOString()
    router.db
      .get('taskReopenings')
      .push({
        id: `reopen_${String(router.db.get('taskReopenings').size().value() + 1).padStart(5, '0')}`,
        taskId: task.id,
        reopenedBy: { id: user.id, fullName: user.fullName },
        reason: reason.trim(),
        previousCompletedAt: task.completedAt,
        createdAt: now,
      })
      .write()
    const reopened = {
      ...task,
      status: 'DUE',
      completedAt: null,
      completionRecordType: null,
      completionRecordId: null,
      audit: { ...task.audit, updatedAt: now, version: task.audit.version + 1 },
    }
    router.db.get('tasks').find({ id: task.id }).assign(reopened).write()
    router.db
      .get('cultivations')
      .find({ id: cultivation.id })
      .assign({
        nextTaskAt: nextOpenTaskAt(cultivation.id),
        updatedAt: now,
        version: cultivation.version + 1,
      })
      .write()
    return sendData(response, reopened)
  })

  app.get('/api/v1/notifications/unread-count', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const count = router.db
      .get('notifications')
      .filter((item) => item.ownerUserId === user.id && item.readAt === null)
      .size()
      .value()
    return sendData(response, { count })
  })

  app.get('/api/v1/notifications', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    let notifications = router.db.get('notifications').filter({ ownerUserId: user.id }).value()
    if (request.query.category) {
      const categories = Array.isArray(request.query.category)
        ? request.query.category
        : String(request.query.category).split(',')
      notifications = notifications.filter((item) => categories.includes(item.category))
    }
    if (request.query.read === 'true') {
      notifications = notifications.filter((item) => item.readAt !== null)
    } else if (request.query.read === 'false') {
      notifications = notifications.filter((item) => item.readAt === null)
    }
    notifications = notifications
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .map(publicNotification)
    return listCollection(request, response, notifications)
  })

  app.post('/api/v1/notifications/read-all', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const readAt = new Date().toISOString()
    const category = request.body?.category ?? null
    const through = request.body?.through ?? null
    router.db
      .get('notifications')
      .filter(
        (notification) =>
          notification.ownerUserId === user.id &&
          (!category || notification.category === category) &&
          (!through || notification.occurredAt <= through),
      )
      .each((notification) => {
        if (notification.readAt === null) {
          notification.readAt = readAt
        }
      })
      .write()
    const count = router.db
      .get('notifications')
      .filter((item) => item.ownerUserId === user.id && item.readAt === null)
      .size()
      .value()
    return sendData(response, { count })
  })

  app.post('/api/v1/notifications/:notificationId/read', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const notification = router.db
      .get('notifications')
      .find({ id: request.params.notificationId, ownerUserId: user.id })
      .value()
    if (!notification) {
      return sendError(response, 404, 'NOT_FOUND', 'Notification not found.')
    }
    const readAt = notification.readAt ?? new Date().toISOString()
    router.db.get('notifications').find({ id: notification.id }).assign({ readAt }).write()
    return sendData(response, publicNotification({ ...notification, readAt }))
  })

  app.get('/api/v1/users/me/addresses', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const addresses = router.db
      .get('addresses')
      .filter({ ownerUserId: user.id })
      .value()
      .map((address) => omitKeys(address, ['ownerUserId']))
    return listCollection(request, response, addresses)
  })

  app.post('/api/v1/users/me/addresses', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const body = request.body ?? {}
    const required = [
      'label',
      'recipientName',
      'mobileNumber',
      'line1',
      'barangay',
      'cityMunicipality',
      'province',
      'region',
      'postalCode',
    ]
    const fields = {}
    for (const field of required) {
      if (!String(body[field] ?? '').trim()) fields[field] = ['This field is required.']
    }
    const mobileNumber = normalizeMobileNumber(body.mobileNumber)
    if (!mobileNumber) fields.mobileNumber = ['Enter a valid Philippine mobile number.']
    if (body.countryCode !== 'PH') fields.countryCode = ['Country must be PH for this version.']
    if (Object.keys(fields).length)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the address.', fields)
    const now = new Date().toISOString()
    const makeDefault =
      Boolean(body.isDefault) ||
      router.db.get('addresses').filter({ ownerUserId: user.id }).size().value() === 0
    if (makeDefault)
      router.db
        .get('addresses')
        .filter({ ownerUserId: user.id })
        .each((address) => {
          address.isDefault = false
        })
        .write()
    const address = {
      id: `addr_${String(router.db.get('addresses').size().value() + 1).padStart(5, '0')}`,
      ownerUserId: user.id,
      label: String(body.label).trim(),
      recipientName: String(body.recipientName).trim(),
      mobileNumber,
      line1: String(body.line1).trim(),
      line2: String(body.line2 ?? '').trim() || null,
      barangay: String(body.barangay).trim(),
      cityMunicipality: String(body.cityMunicipality).trim(),
      province: String(body.province).trim(),
      region: String(body.region).trim(),
      postalCode: String(body.postalCode).trim(),
      countryCode: 'PH',
      deliveryInstructions: String(body.deliveryInstructions ?? '').trim() || null,
      isDefault: makeDefault,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    router.db.get('addresses').push(address).write()
    return sendData(response, omitKeys(address, ['ownerUserId']), 201)
  })

  app.patch('/api/v1/users/me/addresses/:addressId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const address = router.db
      .get('addresses')
      .find({ id: request.params.addressId, ownerUserId: user.id })
      .value()
    if (!address) return sendError(response, 404, 'NOT_FOUND', 'Address not found.')
    const body = request.body ?? {}
    const writable = [
      'label',
      'recipientName',
      'mobileNumber',
      'line1',
      'line2',
      'barangay',
      'cityMunicipality',
      'province',
      'region',
      'postalCode',
      'deliveryInstructions',
      'isDefault',
    ]
    if (!writable.some((field) => Object.hasOwn(body, field)))
      return sendError(response, 422, 'VALIDATION_ERROR', 'Provide at least one address change.')
    const updates = {}
    for (const field of writable) {
      if (!Object.hasOwn(body, field)) continue
      if (field === 'isDefault') updates.isDefault = Boolean(body.isDefault)
      else if (field === 'mobileNumber')
        updates.mobileNumber = normalizeMobileNumber(body.mobileNumber)
      else updates[field] = String(body[field] ?? '').trim() || null
    }
    if (Object.hasOwn(body, 'mobileNumber') && !updates.mobileNumber)
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the address.', {
        mobileNumber: ['Enter a valid Philippine mobile number.'],
      })
    if (updates.isDefault)
      router.db
        .get('addresses')
        .filter({ ownerUserId: user.id })
        .each((item) => {
          item.isDefault = item.id === address.id
        })
        .write()
    const updated = {
      ...updates,
      updatedAt: new Date().toISOString(),
      version: address.version + 1,
    }
    router.db.get('addresses').find({ id: address.id }).assign(updated).write()
    return sendData(response, omitKeys({ ...address, ...updated }, ['ownerUserId']))
  })

  app.delete('/api/v1/users/me/addresses/:addressId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const address = router.db
      .get('addresses')
      .find({ id: request.params.addressId, ownerUserId: user.id })
      .value()
    if (!address) return sendError(response, 404, 'NOT_FOUND', 'Address not found.')
    if (address.isDefault)
      return sendError(
        response,
        409,
        'CONFLICT',
        'Choose another default address before deleting this one.',
      )
    router.db.get('addresses').remove({ id: address.id }).write()
    return response.sendStatus(204)
  })

  app.get('/api/v1/product-categories', (request, response) => {
    const categories = router.db.get('productCategories').sortBy('sortOrder').value()
    return listCollection(request, response, categories)
  })

  app.get('/api/v1/products', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    let products = router.db.get('products').value()
    const search = String(request.query.search ?? '')
      .trim()
      .toLowerCase()
    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.shortDescription} ${product.sku}`.toLowerCase().includes(search),
      )
    }
    if (request.query.categoryId) {
      products = products.filter((product) => product.categoryId === request.query.categoryId)
    }
    if (request.query.suitableSpeciesId) {
      products = products.filter((product) =>
        product.suitableSpeciesIds.includes(request.query.suitableSpeciesId),
      )
    }
    if (request.query.suitableEnvironmentId) {
      products = products.filter((product) =>
        product.suitableEnvironmentIds.includes(request.query.suitableEnvironmentId),
      )
    }
    if (request.query.availability) {
      products = products.filter((product) => product.availability === request.query.availability)
    }
    const direction = request.query.order === 'desc' ? -1 : 1
    const sort = String(request.query.sort ?? 'name')
    products.sort((left, right) => {
      if (sort === 'price') return (left.price.amountMinor - right.price.amountMinor) * direction
      if (sort === 'rating') return ((left.rating ?? 0) - (right.rating ?? 0)) * direction
      return left.name.localeCompare(right.name) * direction
    })
    return listCollection(
      request,
      response,
      products.map((product) => productSummary(product, user.id)),
    )
  })

  app.get('/api/v1/products/:productId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const product = router.db.get('products').find({ id: request.params.productId }).value()
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.')
    return sendData(response, productDetail(product, user.id))
  })

  app.put('/api/v1/products/:productId/favorite', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const product = router.db.get('products').find({ id: request.params.productId }).value()
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.')
    const existing = router.db
      .get('favorites')
      .find({ ownerUserId: user.id, productId: product.id })
      .value()
    if (!existing) {
      router.db
        .get('favorites')
        .push({ id: `fav_${user.id}_${product.id}`, ownerUserId: user.id, productId: product.id })
        .write()
    }
    return sendData(response, { productId: product.id, isFavorite: true })
  })

  app.delete('/api/v1/products/:productId/favorite', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const product = router.db.get('products').find({ id: request.params.productId }).value()
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.')
    router.db.get('favorites').remove({ ownerUserId: user.id, productId: product.id }).write()
    return sendData(response, { productId: product.id, isFavorite: false })
  })

  app.get('/api/v1/cart', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cart = getOrCreateCart(user)
    return sendData(response, composeCart(cart, user.id))
  })

  app.post('/api/v1/cart/items', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const product = router.db.get('products').find({ id: request.body?.productId }).value()
    const quantity = Number(request.body?.quantity)
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.')
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the cart quantity.', {
        quantity: ['Enter a whole number greater than 0.'],
      })
    }
    if (product.availability === 'OUT_OF_STOCK') {
      return sendError(response, 409, 'CONFLICT', 'This product is currently out of stock.')
    }
    const cart = getOrCreateCart(user)
    const existing = router.db
      .get('cartItems')
      .find({ cartId: cart.id, productId: product.id })
      .value()
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    const maximum = Math.min(
      product.stockQuantity ?? Number.MAX_SAFE_INTEGER,
      product.maximumOrderQuantity,
    )
    if (nextQuantity > maximum) {
      return sendError(response, 409, 'CONFLICT', `You can add up to ${maximum} of this item.`)
    }
    if (existing) {
      router.db
        .get('cartItems')
        .find({ id: existing.id })
        .assign({ quantity: nextQuantity })
        .write()
    } else {
      router.db
        .get('cartItems')
        .push({
          id: `cart_item_${String(router.db.get('cartItems').size().value() + 1).padStart(5, '0')}`,
          cartId: cart.id,
          productId: product.id,
          quantity,
          addedAt: new Date().toISOString(),
        })
        .write()
    }
    const updatedCart = touchCart(cart)
    return sendData(response, composeCart(updatedCart, user.id), 201)
  })

  app.patch('/api/v1/cart/items/:itemId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cart = getOrCreateCart(user)
    const item = router.db
      .get('cartItems')
      .find({ id: request.params.itemId, cartId: cart.id })
      .value()
    if (!item) return sendError(response, 404, 'NOT_FOUND', 'Cart item not found.')
    const quantity = Number(request.body?.quantity)
    const product = router.db.get('products').find({ id: item.productId }).value()
    const maximum = Math.min(
      product.stockQuantity ?? Number.MAX_SAFE_INTEGER,
      product.maximumOrderQuantity,
    )
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Review the cart quantity.', {
        quantity: ['Enter a whole number greater than 0.'],
      })
    }
    if (quantity > maximum) {
      return sendError(response, 409, 'CONFLICT', `You can add up to ${maximum} of this item.`)
    }
    router.db.get('cartItems').find({ id: item.id }).assign({ quantity }).write()
    const updatedCart = touchCart(cart)
    return sendData(response, composeCart(updatedCart, user.id))
  })

  app.delete('/api/v1/cart/items/:itemId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cart = getOrCreateCart(user)
    const item = router.db
      .get('cartItems')
      .find({ id: request.params.itemId, cartId: cart.id })
      .value()
    if (!item) return sendError(response, 404, 'NOT_FOUND', 'Cart item not found.')
    router.db.get('cartItems').remove({ id: item.id }).write()
    const updatedCart = touchCart(cart)
    return sendData(response, composeCart(updatedCart, user.id))
  })

  app.delete('/api/v1/cart/items', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cart = getOrCreateCart(user)
    router.db.get('cartItems').remove({ cartId: cart.id }).write()
    const updatedCart = touchCart(cart)
    return sendData(response, composeCart(updatedCart, user.id))
  })

  app.get('/api/v1/checkout/payment-options', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    return listCollection(request, response, router.db.get('paymentOptions').value())
  })

  app.post('/api/v1/checkout/quote', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const cart = getOrCreateCart(user)
    const composed = composeCart(cart, user.id)
    if (composed.items.length === 0) {
      return sendError(response, 409, 'CONFLICT', 'Your cart is empty.')
    }
    if (request.body?.cartVersion !== cart.version) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'Your cart changed. Review it before checkout.',
        null,
        {
          currentVersion: cart.version,
        },
      )
    }
    const address = router.db
      .get('addresses')
      .find({ id: request.body?.addressId, ownerUserId: user.id })
      .value()
    if (!address) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Choose a delivery address.', {
        addressId: ['Choose an address saved to your account.'],
      })
    }
    const paymentOption = router.db
      .get('paymentOptions')
      .find({ type: request.body?.paymentMethod })
      .value()
    if (!paymentOption?.enabled) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Choose an available payment method.', {
        paymentMethod: [paymentOption?.disabledReason ?? 'This option is unavailable.'],
      })
    }
    const contact = request.body?.contact ?? {}
    if (!contact.fullName || !contact.mobileNumber || !contact.email) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Complete the checkout contact details.')
    }
    const quote = {
      quoteId: `quote_${String(router.db.get('checkoutQuotes').size().value() + 1).padStart(5, '0')}`,
      ownerUserId: user.id,
      cartVersion: cart.version,
      items: composed.items.map((item) => ({
        id: `quote_${item.id}`,
        productId: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        image: item.product.primaryImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      deliveryAddress: addressSnapshot(address),
      contact,
      paymentMethod: paymentOption.type,
      subtotal: composed.subtotal,
      deliveryFee: composed.estimatedDeliveryFee,
      total: composed.estimatedTotal,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      warnings: [],
    }
    router.db.get('checkoutQuotes').push(quote).write()
    return sendData(response, omitKeys(quote, ['ownerUserId']))
  })

  app.post('/api/v1/orders', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const idempotencyKey = request.get('idempotency-key')
    if (!idempotencyKey) {
      return sendError(response, 400, 'BAD_REQUEST', 'An idempotency key is required.')
    }
    const recordKey = `${user.id}:POST:/orders:${idempotencyKey}`
    const prior = router.db.get('idempotencyRecords').find({ key: recordKey }).value()
    if (prior) return sendData(response, prior.response, 201)
    const quote = router.db
      .get('checkoutQuotes')
      .find({ quoteId: request.body?.quoteId, ownerUserId: user.id })
      .value()
    if (!quote || Date.parse(quote.expiresAt) < Date.now()) {
      return sendError(
        response,
        409,
        'CONFLICT',
        'This checkout quote expired. Request a new quote.',
      )
    }
    const acceptedTotal = request.body?.acceptedTotal
    if (
      acceptedTotal?.currency !== 'PHP' ||
      acceptedTotal?.amountMinor !== quote.total.amountMinor
    ) {
      return sendError(response, 409, 'CONFLICT', 'The accepted total does not match the quote.')
    }
    const cart = getOrCreateCart(user)
    if (cart.version !== quote.cartVersion) {
      return sendError(response, 409, 'CONFLICT', 'Your cart changed. Request a new quote.')
    }
    const now = new Date().toISOString()
    const sequence = 10245 + router.db.get('orders').size().value()
    const orderId = `ord_${sequence}`
    const order = {
      id: orderId,
      ownerUserId: user.id,
      orderNumber: `GBY-${sequence}`,
      status: 'PROCESSING',
      itemCount: quote.items.reduce((total, item) => total + item.quantity, 0),
      previewImages: quote.items.slice(0, 3).map((item) => item.image),
      total: quote.total,
      placedAt: now,
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      items: quote.items.map((item, index) => ({
        ...item,
        id: `ord_item_${sequence}_${index + 1}`,
      })),
      subtotal: quote.subtotal,
      deliveryFee: quote.deliveryFee,
      paymentMethod: quote.paymentMethod,
      paymentStatus: 'PENDING',
      deliveryAddress: quote.deliveryAddress,
      contact: quote.contact,
      courier: null,
      cancellation: null,
      updatedAt: now,
      version: 1,
    }
    router.db.get('orders').push(order).write()
    const eventLabels = [
      ['PROCESSING', 'Order placed', 'We received your order.'],
      ['PROCESSING', 'Payment confirmed', 'Your payment method was confirmed.'],
      ['PROCESSING', 'Preparing order', 'Your farm supplies will be packed.'],
      ['SHIPPED', 'Shipped', 'The courier has your package.'],
      ['OUT_FOR_DELIVERY', 'Out for delivery', 'The courier is heading to your address.'],
      ['DELIVERED', 'Delivered', 'Order delivered.'],
    ]
    eventLabels.forEach(([status, label, description], index) => {
      router.db
        .get('trackingEvents')
        .push({
          id: `trk_${sequence}_${index + 1}`,
          orderId,
          status,
          label,
          description,
          occurredAt: index === 0 ? now : null,
          completed: index === 0,
          current: index === 0,
        })
        .write()
    })
    router.db.get('cartItems').remove({ cartId: cart.id }).write()
    touchCart(cart)
    router.db
      .get('notifications')
      .push({
        id: `ntf_order_${sequence}`,
        ownerUserId: user.id,
        category: 'ORDER',
        type: 'ORDER_UPDATE',
        title: `Order ${order.orderNumber} was placed`,
        message: 'We received your order and will show progress here.',
        recommendedAmount: null,
        occurredAt: now,
        readAt: null,
        action: { label: 'View order', deepLink: `/app/orders/${order.id}` },
        cultivationId: null,
        orderId: order.id,
        taskId: null,
      })
      .write()
    const result = publicOrder(order)
    router.db.get('idempotencyRecords').push({ key: recordKey, response: result }).write()
    return sendData(response, result, 201)
  })

  app.get('/api/v1/orders', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    let orders = router.db.get('orders').filter({ ownerUserId: user.id }).value()
    if (request.query.status) {
      const statuses = Array.isArray(request.query.status)
        ? request.query.status
        : String(request.query.status).split(',')
      orders = orders.filter((order) => statuses.includes(order.status))
    }
    orders.sort((left, right) => right.placedAt.localeCompare(left.placedAt))
    return listCollection(request, response, orders.map(orderSummary))
  })

  app.get('/api/v1/orders/:orderId/tracking', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const order = router.db
      .get('orders')
      .find({ id: request.params.orderId, ownerUserId: user.id })
      .value()
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.')
    const events = router.db.get('trackingEvents').filter({ orderId: order.id }).value()
    return sendData(response, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      courier: order.courier,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      deliveryAddress: order.deliveryAddress,
      events: events.map((event) => omitKeys(event, ['orderId'])),
      items: order.items,
      total: order.total,
    })
  })

  app.get('/api/v1/orders/:orderId', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const order = router.db
      .get('orders')
      .find({ id: request.params.orderId, ownerUserId: user.id })
      .value()
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.')
    return sendData(response, publicOrder(order))
  })

  app.post('/api/v1/orders/:orderId/cancel', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const order = router.db
      .get('orders')
      .find({ id: request.params.orderId, ownerUserId: user.id })
      .value()
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.')
    if (!['TO_PAY', 'PROCESSING'].includes(order.status)) {
      return sendError(
        response,
        409,
        'INVALID_STATE_TRANSITION',
        'This order can no longer be cancelled.',
      )
    }
    const reason = String(request.body?.reason ?? '').trim()
    if (!reason) {
      return sendError(response, 422, 'VALIDATION_ERROR', 'Add a cancellation reason.', {
        reason: ['A reason is required.'],
      })
    }
    const updatedAt = new Date().toISOString()
    const updated = {
      status: 'CANCELLED',
      cancellation: { reason, cancelledAt: updatedAt },
      updatedAt,
      version: order.version + 1,
    }
    router.db.get('orders').find({ id: order.id }).assign(updated).write()
    return sendData(response, publicOrder({ ...order, ...updated }))
  })

  app.use('/api/v1', (_request, response) => {
    return sendError(response, 404, 'NOT_FOUND', 'The requested API resource does not exist.')
  })

  return app
}

const isEntrypoint = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isEntrypoint) {
  const port = Number(process.env.MOCK_API_PORT ?? 3001)
  const app = createMockApi()
  app.listen(port, () => {
    console.info(`Gabayan mock API listening at http://localhost:${port}/api/v1`)
  })
}
