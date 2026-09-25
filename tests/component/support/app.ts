import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, type Component } from 'vue'
import { createMemoryHistory, createRouter, type RouteLocationRaw } from 'vue-router'

import { ApiError } from '@core/http'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { user } from '../../unit/profile/fixtures'

const blank = { template: '<div />' }

// The routes a signed-in screen links to, each rendering nothing.
const appRoutes = [
  ['/setup/plan', ROUTE_NAMES.setupPlan],
  ['/setup', ROUTE_NAMES.setupIntro],
  ['/setup/species', ROUTE_NAMES.setupSpecies],
  ['/setup/environment', ROUTE_NAMES.setupEnvironment],
  ['/setup/water-ranges', ROUTE_NAMES.setupWaterRanges],
  ['/setup/dimensions', ROUTE_NAMES.setupDimensions],
  ['/setup/fingerlings', ROUTE_NAMES.setupFingerlings],
  ['/setup/stocking-result', ROUTE_NAMES.setupStockingResult],
  ['/setup/review', ROUTE_NAMES.setupReview],
  ['/setup/success/:cultivationId', ROUTE_NAMES.setupSuccess],
  ['/app/home', ROUTE_NAMES.home],
  ['/app/cultivations', ROUTE_NAMES.cultivations],
  ['/app/cultivations/:cultivationId', ROUTE_NAMES.cultivationDetail],
  ['/app/cultivations/:cultivationId/tasks', ROUTE_NAMES.cultivationTasks],
  ['/app/cultivations/:cultivationId/growth', ROUTE_NAMES.cultivationGrowth],
  ['/app/cultivations/:cultivationId/records', ROUTE_NAMES.cultivationRecords],
  ['/app/cultivations/:cultivationId/harvest', ROUTE_NAMES.cultivationHarvest],
  ['/app/cultivations/:cultivationId/water-safety', ROUTE_NAMES.cultivationWaterSafety],
  ['/app/cultivations/:cultivationId/water-log', ROUTE_NAMES.cultivationWaterLog],
  ['/app/cultivations/:cultivationId/feed-conversion', ROUTE_NAMES.cultivationFeedConversion],
  ['/app/species/:speciesId/feed-guide', ROUTE_NAMES.feedGuide],
  ['/app/marketplace', ROUTE_NAMES.marketplace],
  ['/app/products/:productId', ROUTE_NAMES.productDetail],
  ['/app/cart', ROUTE_NAMES.cart],
  ['/app/checkout', ROUTE_NAMES.checkout],
  ['/app/orders', ROUTE_NAMES.orders],
  ['/app/orders/:orderId', ROUTE_NAMES.orderDetail],
  ['/app/orders/:orderId/tracking', ROUTE_NAMES.orderTracking],
  ['/app/profile', ROUTE_NAMES.profile],
  ['/app/plans', ROUTE_NAMES.plans],
  ['/app/notifications', ROUTE_NAMES.notifications],
] as const

export function apiError(
  status: number,
  code: string,
  message: string,
  fields: Record<string, string[]> | null = null,
) {
  return new ApiError(status, { code, message, fields, details: null, requestId: 'req_1' })
}

export function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
}

// A repository whose listed methods fail loudly unless a test gives them an answer.
export function refusingRepository<K extends string>(methods: readonly K[]) {
  return Object.fromEntries(
    methods.map((method) => [method, vi.fn().mockRejectedValue(new Error('not stubbed'))]),
  ) as Record<K, ReturnType<typeof vi.fn>>
}

// Mounts a component signed in as Juan, on a memory router already at `at`, with a real
// QueryClient that does not retry and the modal teleport rendered in place.
export async function mountInApp(component: Component, at: RouteLocationRaw) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore()
  session.accessToken = 'access_1'
  session.user = { ...user }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: appRoutes.map(([path, name]) => ({ path, name, component: blank })),
  })
  await router.push(at)
  await router.isReady()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = mount(component, {
    global: {
      plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      stubs: { teleport: true },
    },
  })
  return { wrapper, router, queryClient, session, toast: useToastStore() }
}

// Mounts a host component around a composable and hands back what it returned.
export async function mountComposable<T>(use: () => T, at: RouteLocationRaw) {
  let result!: T
  const Host = defineComponent({
    setup() {
      result = use()
      return () => null
    },
  })
  const mounted = await mountInApp(Host, at)
  return { ...mounted, result }
}
