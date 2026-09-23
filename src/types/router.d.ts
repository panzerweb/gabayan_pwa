import 'vue-router'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    setupStep?: number
    setupTotal?: number
    backTo?: string
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}
