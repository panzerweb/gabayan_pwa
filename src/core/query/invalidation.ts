import type { QueryClient } from '@tanstack/vue-query'

// Key prefixes of the features whose data a mutation can make stale. Each feature's
// `data/<feature>.keys.ts` builds its keys under these prefixes, so invalidating a prefix
// refreshes every query of that kind whatever its ids or filters.
export const QUERY_KEY_PREFIXES = {
  home: ['home'],
  cultivationList: ['cultivations', 'list'],
  cultivationDetail: ['cultivations', 'detail'],
  cultivationTimeline: ['cultivations', 'timeline'],
  tasks: ['cultivations', 'tasks'],
  growth: ['cultivations', 'growth'],
  mortality: ['cultivations', 'mortality'],
  feedingPlan: ['cultivations', 'feeding-plan'],
  feedingRecords: ['cultivations', 'feeding-records'],
  waterChecks: ['cultivations', 'water-checks'],
  harvestReadiness: ['cultivations', 'harvest-readiness'],
  cart: ['cart'],
  orders: ['orders'],
  notifications: ['notifications'],
  tiers: ['tiers'],
} as const satisfies Record<string, readonly string[]>

export type QueryKeyPrefix = (typeof QUERY_KEY_PREFIXES)[keyof typeof QUERY_KEY_PREFIXES]

const k = QUERY_KEY_PREFIXES

// Contract §14: what each server-recalculating mutation leaves stale on the client.
// Task completion also refreshes the timeline, where the completed task is listed.
// The cart prefix covers the cart badge and the checkout quote, both kept under `cart`.
// Creating or harvesting a cultivation changes the account's active culture-system count.
export const INVALIDATIONS = {
  cultivationCreate: [k.home, k.cultivationList, k.cultivationDetail, k.tiers],
  taskComplete: [k.home, k.tasks, k.cultivationDetail, k.cultivationTimeline, k.notifications],
  growthCreate: [k.cultivationDetail, k.growth, k.feedingPlan, k.harvestReadiness, k.home],
  mortalityCreate: [k.cultivationDetail, k.mortality, k.feedingPlan, k.harvestReadiness, k.home],
  feedingCreate: [k.tasks, k.feedingRecords, k.home],
  waterCheckCreate: [k.tasks, k.waterChecks, k.home],
  cartChange: [k.cart],
  orderCreate: [k.orders, k.cart, k.home, k.notifications],
  harvestCreate: [k.cultivationDetail, k.cultivationList, k.home, k.harvestReadiness, k.tiers],
  upgradeRequest: [k.tiers],
} as const satisfies Record<string, readonly QueryKeyPrefix[]>

export type InvalidatingMutation = keyof typeof INVALIDATIONS

// Marks every query a mutation made stale; active queries refetch before this resolves.
export async function invalidateAfter(queryClient: QueryClient, mutation: InvalidatingMutation) {
  await Promise.all(
    INVALIDATIONS[mutation].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  )
}
