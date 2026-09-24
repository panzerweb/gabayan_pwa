import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '../route-names'

const SETUP_STEPS = 4

// The cultivation setup wizard. The setup-step guard keeps a step closed until the draft
// holds what it needs.
export const setupRoutes: RouteRecordRaw[] = [
  {
    path: '/setup',
    component: () => import('@layouts/SetupLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: ROUTE_NAMES.setupIntro,
        component: () => import('@pages/setup/SetupIntroPage.vue'),
        meta: { title: 'Cultivation setup' },
      },
      {
        path: 'species',
        name: ROUTE_NAMES.setupSpecies,
        component: () => import('@pages/setup/SpeciesStepPage.vue'),
        meta: { title: 'New cultivation', setupStep: 1, setupTotal: SETUP_STEPS, backTo: '/setup' },
      },
      {
        path: 'environment',
        name: ROUTE_NAMES.setupEnvironment,
        component: () => import('@pages/setup/EnvironmentStepPage.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 2,
          setupTotal: SETUP_STEPS,
          backTo: '/setup/species',
        },
      },
      {
        path: 'dimensions',
        name: ROUTE_NAMES.setupDimensions,
        component: () => import('@pages/setup/DimensionsStepPage.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 3,
          setupTotal: SETUP_STEPS,
          backTo: '/setup/environment',
        },
      },
      {
        path: 'fingerlings',
        name: ROUTE_NAMES.setupFingerlings,
        component: () => import('@pages/setup/FingerlingsStepPage.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 4,
          setupTotal: SETUP_STEPS,
          backTo: '/setup/dimensions',
        },
      },
      {
        path: 'stocking-result',
        name: ROUTE_NAMES.setupStockingResult,
        component: () => import('@pages/setup/StockingResultPage.vue'),
        meta: {
          title: 'Stocking estimate',
          setupStep: 4,
          setupTotal: SETUP_STEPS,
          backTo: '/setup/fingerlings',
        },
      },
      {
        path: 'review',
        name: ROUTE_NAMES.setupReview,
        component: () => import('@pages/setup/ReviewSetupPage.vue'),
        meta: {
          title: 'Review cultivation',
          setupStep: 4,
          setupTotal: SETUP_STEPS,
          backTo: '/setup/stocking-result',
        },
      },
      {
        path: 'success/:cultivationId',
        name: ROUTE_NAMES.setupSuccess,
        component: () => import('@pages/setup/SetupSuccessPage.vue'),
        meta: { title: 'Cultivation created' },
      },
    ],
  },
]
