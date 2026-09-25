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
  feedConversion: ['cultivations', 'feed-conversion'],
  waterLogs: ['water-quality', 'logs'],
  cart: ['cart'],
  orders: ['orders'],
  notifications: ['notifications'],
  tiers: ['tiers'],
  weatherAlerts: ['weather-alerts'],
} as const satisfies Record<string, readonly string[]>

export type QueryKeyPrefix = (typeof QUERY_KEY_PREFIXES)[keyof typeof QUERY_KEY_PREFIXES]

const k = QUERY_KEY_PREFIXES

// Contract §14: what each server-recalculating mutation leaves stale on the client.
// Task completion also refreshes the timeline, where the completed task is listed.
// The cart prefix covers the cart badge and the checkout quote, both kept under `cart`.
// Creating or harvesting a cultivation changes the account's active culture-system count.
// The feed conversion ratio is derived from the feeding, growth and mortality records, so
// every write of one of those leaves it stale. Weather alerts are read for the farm's saved
// location, and reading them may raise a notification, so a farm update refreshes both.
export const INVALIDATIONS = {
  cultivationCreate: [k.home, k.cultivationList, k.cultivationDetail, k.tiers],
  taskComplete: [
    k.home,
    k.tasks,
    k.cultivationDetail,
    k.cultivationTimeline,
    k.notifications,
    k.feedConversion,
  ],
  growthCreate: [
    k.cultivationDetail,
    k.growth,
    k.feedingPlan,
    k.harvestReadiness,
    k.home,
    k.feedConversion,
  ],
  mortalityCreate: [
    k.cultivationDetail,
    k.mortality,
    k.feedingPlan,
    k.harvestReadiness,
    k.home,
    k.feedConversion,
  ],
  feedingCreate: [k.tasks, k.feedingRecords, k.home, k.feedConversion],
  waterCheckCreate: [k.tasks, k.waterChecks, k.home],
  waterLogCreate: [k.waterLogs],
  cartChange: [k.cart],
  orderCreate: [k.orders, k.cart, k.home, k.notifications],
  harvestCreate: [k.cultivationDetail, k.cultivationList, k.home, k.harvestReadiness, k.tiers],
  upgradeRequest: [k.tiers],
  farmUpdate: [k.weatherAlerts, k.notifications, k.home],
} as const satisfies Record<string, readonly QueryKeyPrefix[]>

export type InvalidatingMutation = keyof typeof INVALIDATIONS

// Marks every query a mutation made stale; active queries refetch before this resolves.
export async function invalidateAfter(queryClient: QueryClient, mutation: InvalidatingMutation) {
  await Promise.all(
    INVALIDATIONS[mutation].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  )
}
