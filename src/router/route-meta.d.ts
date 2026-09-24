import 'vue-router'

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
  }
}
