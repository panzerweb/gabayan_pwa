import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type RouteLocationNormalized } from 'vue-router'

import { sessionGuard } from '@router/guards/session.guard'
import { setupStepGuard } from '@router/guards/setup-step.guard'
import { tierGuard } from '@router/guards/tier.guard'
import { ROUTE_NAMES, type RouteName } from '@router/route-names'
import { appRoutes } from '@router/routes/app.routes'
import { publicRoutes } from '@router/routes/public.routes'
import { setupRoutes } from '@router/routes/setup.routes'
import type { Dimensions, StockingEstimate } from '@pages/setup/domain/setup.model'
import type { UserProfile } from '@pages/auth/domain/auth.model'
import { useSessionStore } from '@stores/session.store'
import { useSetupStore } from '@pages/setup/presentation/stores/setup.store'
import { queryClient } from '@core/query'
import { tiersRepository } from '@pages/tiers/data/tiers.repository'
import type { TierCode } from '@pages/tiers/domain/tiers.model'

import { accountTier, meta, organizationPlan, proPlan } from '../tiers/fixtures'

// Resolves against the real route records so parent meta (`requiresAuth`, `guestOnly`)
// merges exactly as it does in the app, without loading any page component.
const routes = createRouter({
  history: createMemoryHistory(),
  routes: [...publicRoutes, ...setupRoutes, ...appRoutes],
})

function locationOf(name: RouteName, params: Record<string, string> = {}) {
  return routes.resolve({ name, params }) as unknown as RouteLocationNormalized
}

const juan: UserProfile = {
  id: 'usr_001',
  fullName: 'Juan Dela Cruz',
  email: 'juan@example.com',
  mobileNumber: '+639171234567',
  avatar: null,
  emailVerified: true,
  mobileVerified: true,
  locale: 'en-PH',
  timezone: 'Asia/Manila',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  version: 1,
}

function signOut() {
  useSessionStore().$patch({ accessToken: null, user: null, initialized: true })
}

function signIn({ hasCultivation }: { hasCultivation: boolean }) {
  useSessionStore().$patch({ accessToken: 'token', user: juan, hasCultivation, initialized: true })
}

const dimensions: Dimensions = { lengthM: 5, widthM: 4, waterDepthM: 1.5 }
const estimate = { estimateId: 'est_001' } as StockingEstimate

beforeEach(() => {
  window.sessionStorage.clear()
  setActivePinia(createPinia())
})

describe('session guard', () => {
  it('sends a signed-out visitor to sign in, remembering the page they asked for', async () => {
    signOut()

    const result = await sessionGuard(
      locationOf(ROUTE_NAMES.cultivationTasks, { cultivationId: 'cul_001' }),
    )

    expect(result).toEqual({
      name: ROUTE_NAMES.signIn,
      query: { redirect: '/app/cultivations/cul_001/tasks' },
    })
  })

  it('keeps a signed-out visitor out of the setup wizard too', async () => {
    signOut()

    const result = await sessionGuard(locationOf(ROUTE_NAMES.setupIntro))

    expect(result).toEqual({ name: ROUTE_NAMES.signIn, query: { redirect: '/setup' } })
  })

  it('lets a signed-out visitor open the guest pages', async () => {
    signOut()

    expect(await sessionGuard(locationOf(ROUTE_NAMES.welcome))).toBe(true)
    expect(await sessionGuard(locationOf(ROUTE_NAMES.signIn))).toBe(true)
  })

  it('sends a signed-in farmer with a cultivation from a guest page to Home', async () => {
    signIn({ hasCultivation: true })

    expect(await sessionGuard(locationOf(ROUTE_NAMES.signIn))).toEqual({ name: ROUTE_NAMES.home })
  })

  it('sends a signed-in farmer without a cultivation from a guest page to setup', async () => {
    signIn({ hasCultivation: false })

    expect(await sessionGuard(locationOf(ROUTE_NAMES.createAccount))).toEqual({
      name: ROUTE_NAMES.setupIntro,
    })
  })

  it('lets a signed-in farmer open signed-in pages', async () => {
    signIn({ hasCultivation: true })

    expect(await sessionGuard(locationOf(ROUTE_NAMES.home))).toBe(true)
  })

  it('never redirects the splash, which restores the session itself', async () => {
    const restore = vi.spyOn(useSessionStore(), 'restore')

    expect(await sessionGuard(locationOf(ROUTE_NAMES.splash))).toBe(true)
    expect(restore).not.toHaveBeenCalled()
  })
})

describe('setup-step guard', () => {
  it.each([
    [ROUTE_NAMES.setupEnvironment, ROUTE_NAMES.setupSpecies],
    [ROUTE_NAMES.setupDimensions, ROUTE_NAMES.setupEnvironment],
    [ROUTE_NAMES.setupFingerlings, ROUTE_NAMES.setupDimensions],
    [ROUTE_NAMES.setupStockingResult, ROUTE_NAMES.setupFingerlings],
    [ROUTE_NAMES.setupReview, ROUTE_NAMES.setupFingerlings],
  ])('sends a farmer opening %s early back to %s', (step, fallback) => {
    expect(setupStepGuard(locationOf(step))).toEqual({ name: fallback })
  })

  it('opens each step once the draft holds what it needs', () => {
    const setup = useSetupStore()
    setup.$patch({
      draft: { speciesId: 'sp_tilapia', environmentId: 'env_pond', dimensions, estimate },
    })

    for (const step of [
      ROUTE_NAMES.setupEnvironment,
      ROUTE_NAMES.setupDimensions,
      ROUTE_NAMES.setupFingerlings,
      ROUTE_NAMES.setupStockingResult,
      ROUTE_NAMES.setupReview,
    ]) {
      expect(setupStepGuard(locationOf(step))).toBe(true)
    }
  })

  it('opens the water ranges step only once a culture system is chosen', () => {
    const setup = useSetupStore()
    setup.$patch({ draft: { speciesId: 'sp_tilapia' } })
    expect(setupStepGuard(locationOf(ROUTE_NAMES.setupWaterRanges))).toEqual({
      name: ROUTE_NAMES.setupEnvironment,
    })

    setup.$patch({ draft: { environmentId: 'env_pond' } })
    expect(setupStepGuard(locationOf(ROUTE_NAMES.setupWaterRanges))).toBe(true)
  })

  it('always opens the intro and the species step', () => {
    expect(setupStepGuard(locationOf(ROUTE_NAMES.setupIntro))).toBe(true)
    expect(setupStepGuard(locationOf(ROUTE_NAMES.setupSpecies))).toBe(true)
  })
})

describe('tier guard', () => {
  // The daily tasks route given a `meta.tier`, so these cases hold for any plan a screen needs.
  function needing(tier: TierCode) {
    const location = locationOf(ROUTE_NAMES.cultivationTasks, { cultivationId: 'cul_001' })
    return { ...location, meta: { ...location.meta, tier } }
  }

  function onPlan(plan = proPlan) {
    return vi
      .spyOn(tiersRepository, 'getAccountTier')
      .mockResolvedValue({ data: accountTier({ plan }), meta })
  }

  beforeEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  it('sends a farmer below the plan a screen needs to the plans, naming both', async () => {
    signIn({ hasCultivation: true })
    onPlan(accountTier().plan)

    expect(await tierGuard(needing('PRO'))).toEqual({
      name: ROUTE_NAMES.plans,
      query: { required: 'PRO', redirect: '/app/cultivations/cul_001/tasks' },
    })
  })

  it('opens the screen for a farmer on that plan or above', async () => {
    signIn({ hasCultivation: true })
    onPlan(proPlan)
    expect(await tierGuard(needing('PRO'))).toBe(true)

    queryClient.clear()
    onPlan(organizationPlan)
    expect(await tierGuard(needing('PRO'))).toBe(true)
    expect(await tierGuard(needing('ORGANIZATION'))).toBe(true)
  })

  it('reads the tier once and reuses it for the next navigation', async () => {
    signIn({ hasCultivation: true })
    const read = onPlan(proPlan)

    await tierGuard(needing('PRO'))
    await tierGuard(needing('PRO'))

    expect(read).toHaveBeenCalledTimes(1)
    expect(read).toHaveBeenCalledWith('token')
  })

  it('leaves screens without a plan requirement alone', async () => {
    signIn({ hasCultivation: true })
    const read = onPlan(proPlan)

    expect(await tierGuard(locationOf(ROUTE_NAMES.home))).toBe(true)
    expect(read).not.toHaveBeenCalled()
  })

  it('opens the screen when the tier cannot be read, leaving the refusal to the API', async () => {
    signIn({ hasCultivation: true })
    vi.spyOn(tiersRepository, 'getAccountTier').mockRejectedValue(new TypeError('offline'))

    expect(await tierGuard(needing('ORGANIZATION'))).toBe(true)
  })

  it('sends a Free farmer opening the water log or feed conversion to the plans for Pro', async () => {
    signIn({ hasCultivation: true })
    onPlan(accountTier().plan)

    for (const [name, path] of [
      [ROUTE_NAMES.cultivationWaterLog, 'water-log'],
      [ROUTE_NAMES.cultivationFeedConversion, 'feed-conversion'],
    ] as const) {
      expect(await tierGuard(locationOf(name, { cultivationId: 'cul_001' }))).toEqual({
        name: ROUTE_NAMES.plans,
        query: { required: 'PRO', redirect: `/app/cultivations/cul_001/${path}` },
      })
    }
  })

  it('leaves a signed-out visitor to the session guard', async () => {
    signOut()
    const read = onPlan(proPlan)

    expect(await tierGuard(needing('PRO'))).toBe(true)
    expect(read).not.toHaveBeenCalled()
  })
})
