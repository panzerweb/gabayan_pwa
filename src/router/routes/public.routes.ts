import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '../route-names'
import { authRoutes } from './auth.routes'

// Pages reachable without an account: the splash, the guest-only public layout (welcome
// and the sign-in pages), the offline fallback and the not-found page.
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.splash,
    component: () => import('@pages/SplashPage.vue'),
    meta: { title: 'Gabayan' },
  },
  {
    path: '/',
    component: () => import('@layouts/PublicLayout.vue'),
    meta: { guestOnly: true },
    children: [
      {
        path: 'welcome',
        name: ROUTE_NAMES.welcome,
        component: () => import('@pages/WelcomePage.vue'),
        meta: { title: 'Welcome' },
      },
      ...authRoutes,
    ],
  },
  {
    path: '/offline',
    name: ROUTE_NAMES.offline,
    component: () => import('@pages/OfflinePage.vue'),
    meta: { title: 'Offline' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.notFound,
    component: () => import('@pages/NotFoundPage.vue'),
    meta: { title: 'Page not found' },
  },
]
