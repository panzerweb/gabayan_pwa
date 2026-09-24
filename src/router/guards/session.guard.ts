import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import { useSessionStore } from '@stores/session.store'

import { ROUTE_NAMES } from '../route-names'

// Restores the session once, then keeps signed-out visitors out of `requiresAuth` routes
// (remembering where they were going) and signed-in farmers out of `guestOnly` ones.
export async function sessionGuard(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  if (to.name === ROUTE_NAMES.splash) return true

  const session = useSessionStore()
  await session.restore()

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: ROUTE_NAMES.signIn, query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && session.isAuthenticated) return { name: session.suggestedRouteName }
  return true
}
