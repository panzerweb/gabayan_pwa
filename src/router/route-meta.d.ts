import 'vue-router'

import type { TierCode } from '@pages/tiers/domain/tiers.model'

import type { RouteName } from './route-names'

export {}

// Meta a route may carry. Parent meta is merged into `to.meta`, so `requiresAuth` and
// `guestOnly` sit once on a layout route and hold for all of its children.
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    setupStep?: number
    setupTotal?: number
    backTo?: RouteName
    requiresAuth?: boolean
    guestOnly?: boolean
    // The least plan a screen needs; the tier guard sends a farmer below it to the plans.
    tier?: TierCode
  }
}
