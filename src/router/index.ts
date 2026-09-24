import { createRouter, createWebHistory } from 'vue-router'

import { applyDocumentTitle } from './guards/document-title'
import { sessionGuard } from './guards/session.guard'
import { setupStepGuard } from './guards/setup-step.guard'
import { tierGuard } from './guards/tier.guard'
import { appRoutes } from './routes/app.routes'
import { publicRoutes } from './routes/public.routes'
import { setupRoutes } from './routes/setup.routes'

export { ROUTE_NAMES, type RouteName } from './route-names'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, ...setupRoutes, ...appRoutes],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(sessionGuard)
router.beforeEach(setupStepGuard)
router.beforeEach(tierGuard)
router.afterEach(applyDocumentTitle)
