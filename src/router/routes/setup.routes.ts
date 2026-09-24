import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '../route-names'

const SETUP_STEPS = 4

// The plan step a new account passes through, then the cultivation setup wizard. The
// setup-step guard keeps a wizard step closed until the draft holds what it needs.
export const setupRoutes: RouteRecordRaw[] = [
  {
    path: '/setup',
    component: () => import('@layouts/SetupLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'plan',
        name: ROUTE_NAMES.setupPlan,
        component: () => import('@pages/tiers/presentation/views/ChoosePlanView.vue'),
        meta: { title: 'Account plan' },
      },
      {
        path: '',
        name: ROUTE_NAMES.setupIntro,
        component: () => import('@pages/setup/presentation/views/SetupIntroView.vue'),
        meta: { title: 'Cultivation setup' },
      },
      {
        path: 'species',
        name: ROUTE_NAMES.setupSpecies,
        component: () => import('@pages/setup/presentation/views/SpeciesStepView.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 1,
          setupTotal: SETUP_STEPS,
          backTo: ROUTE_NAMES.setupIntro,
        },
      },
      {
        path: 'environment',
        name: ROUTE_NAMES.setupEnvironment,
        component: () => import('@pages/setup/presentation/views/EnvironmentStepView.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 2,
          setupTotal: SETUP_STEPS,
          backTo: ROUTE_NAMES.setupSpecies,
        },
      },
      {
        path: 'dimensions',
        name: ROUTE_NAMES.setupDimensions,
        component: () => import('@pages/setup/presentation/views/DimensionsStepView.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 3,
          setupTotal: SETUP_STEPS,
          backTo: ROUTE_NAMES.setupEnvironment,
        },
      },
      {
        path: 'fingerlings',
        name: ROUTE_NAMES.setupFingerlings,
        component: () => import('@pages/setup/presentation/views/FingerlingsStepView.vue'),
        meta: {
          title: 'New cultivation',
          setupStep: 4,
          setupTotal: SETUP_STEPS,
          backTo: ROUTE_NAMES.setupDimensions,
        },
      },
      {
        path: 'stocking-result',
        name: ROUTE_NAMES.setupStockingResult,
        component: () => import('@pages/setup/presentation/views/StockingResultView.vue'),
        meta: {
          title: 'Stocking estimate',
          setupStep: 4,
          setupTotal: SETUP_STEPS,
          backTo: ROUTE_NAMES.setupFingerlings,
        },
      },
      {
        path: 'review',
        name: ROUTE_NAMES.setupReview,
        component: () => import('@pages/setup/presentation/views/ReviewSetupView.vue'),
        meta: {
          title: 'Review cultivation',
          setupStep: 4,
          setupTotal: SETUP_STEPS,
          backTo: ROUTE_NAMES.setupStockingResult,
        },
      },
      {
        path: 'success/:cultivationId',
        name: ROUTE_NAMES.setupSuccess,
        component: () => import('@pages/setup/presentation/views/SetupSuccessView.vue'),
        meta: { title: 'Cultivation created' },
      },
    ],
  },
]
