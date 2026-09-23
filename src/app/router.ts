import { createRouter, createWebHistory } from 'vue-router'

import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue'
import PublicLayout from '@/layouts/PublicLayout.vue'
import SetupLayout from '@/layouts/SetupLayout.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import OfflinePage from '@/pages/OfflinePage.vue'
import SplashPage from '@/pages/SplashPage.vue'
import WelcomePage from '@/pages/WelcomePage.vue'
import CultivationsPage from '@/pages/app/CultivationsPage.vue'
import CultivationDetailPage from '@/pages/app/CultivationDetailPage.vue'
import CultivationGrowthPage from '@/pages/app/CultivationGrowthPage.vue'
import CultivationHarvestPage from '@/pages/app/CultivationHarvestPage.vue'
import CultivationRecordsPage from '@/pages/app/CultivationRecordsPage.vue'
import CultivationTasksPage from '@/pages/app/CultivationTasksPage.vue'
import CartPage from '@/pages/app/CartPage.vue'
import CheckoutPage from '@/pages/app/CheckoutPage.vue'
import HomePage from '@/pages/app/HomePage.vue'
import MarketplacePage from '@/pages/app/MarketplacePage.vue'
import NotificationsPage from '@/pages/app/NotificationsPage.vue'
import OrderDetailPage from '@/pages/app/OrderDetailPage.vue'
import OrderTrackingPage from '@/pages/app/OrderTrackingPage.vue'
import OrdersPage from '@/pages/app/OrdersPage.vue'
import ProductDetailPage from '@/pages/app/ProductDetailPage.vue'
import ProfilePage from '@/pages/app/ProfilePage.vue'
import CreateAccountPage from '@/pages/auth/CreateAccountPage.vue'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage.vue'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage.vue'
import SignInPage from '@/pages/auth/SignInPage.vue'
import DimensionsStepPage from '@/pages/setup/DimensionsStepPage.vue'
import EnvironmentStepPage from '@/pages/setup/EnvironmentStepPage.vue'
import FingerlingsStepPage from '@/pages/setup/FingerlingsStepPage.vue'
import ReviewSetupPage from '@/pages/setup/ReviewSetupPage.vue'
import SetupIntroPage from '@/pages/setup/SetupIntroPage.vue'
import SetupSuccessPage from '@/pages/setup/SetupSuccessPage.vue'
import SpeciesStepPage from '@/pages/setup/SpeciesStepPage.vue'
import StockingResultPage from '@/pages/setup/StockingResultPage.vue'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'splash', component: SplashPage, meta: { title: 'Gabayan' } },
    {
      path: '/',
      component: PublicLayout,
      children: [
        {
          path: 'welcome',
          name: 'welcome',
          component: WelcomePage,
          meta: { title: 'Welcome', guestOnly: true },
        },
        {
          path: 'sign-in',
          name: 'sign-in',
          component: SignInPage,
          meta: { title: 'Sign in', guestOnly: true },
        },
        {
          path: 'create-account',
          name: 'create-account',
          component: CreateAccountPage,
          meta: { title: 'Create account', guestOnly: true },
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: ForgotPasswordPage,
          meta: { title: 'Forgot password', guestOnly: true },
        },
        {
          path: 'reset-password',
          name: 'reset-password',
          component: ResetPasswordPage,
          meta: { title: 'Reset password', guestOnly: true },
        },
      ],
    },
    {
      path: '/setup',
      component: SetupLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'setup-intro',
          component: SetupIntroPage,
          meta: { title: 'Cultivation setup', requiresAuth: true },
        },
        {
          path: 'species',
          name: 'setup-species',
          component: SpeciesStepPage,
          meta: {
            title: 'New cultivation',
            setupStep: 1,
            setupTotal: 4,
            backTo: '/setup',
            requiresAuth: true,
          },
        },
        {
          path: 'environment',
          name: 'setup-environment',
          component: EnvironmentStepPage,
          meta: {
            title: 'New cultivation',
            setupStep: 2,
            setupTotal: 4,
            backTo: '/setup/species',
            requiresAuth: true,
          },
        },
        {
          path: 'dimensions',
          name: 'setup-dimensions',
          component: DimensionsStepPage,
          meta: {
            title: 'New cultivation',
            setupStep: 3,
            setupTotal: 4,
            backTo: '/setup/environment',
            requiresAuth: true,
          },
        },
        {
          path: 'fingerlings',
          name: 'setup-fingerlings',
          component: FingerlingsStepPage,
          meta: {
            title: 'New cultivation',
            setupStep: 4,
            setupTotal: 4,
            backTo: '/setup/dimensions',
            requiresAuth: true,
          },
        },
        {
          path: 'stocking-result',
          name: 'setup-stocking-result',
          component: StockingResultPage,
          meta: {
            title: 'Stocking estimate',
            setupStep: 4,
            setupTotal: 4,
            backTo: '/setup/fingerlings',
            requiresAuth: true,
          },
        },
        {
          path: 'review',
          name: 'setup-review',
          component: ReviewSetupPage,
          meta: {
            title: 'Review cultivation',
            setupStep: 4,
            setupTotal: 4,
            backTo: '/setup/stocking-result',
            requiresAuth: true,
          },
        },
        {
          path: 'success/:cultivationId',
          name: 'setup-success',
          component: SetupSuccessPage,
          meta: { title: 'Cultivation created', requiresAuth: true },
        },
      ],
    },
    {
      path: '/app',
      component: AuthenticatedLayout,
      redirect: '/app/home',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'home',
          component: HomePage,
          meta: { title: 'Home', requiresAuth: true },
        },
        {
          path: 'cultivations',
          name: 'cultivations',
          component: CultivationsPage,
          meta: { title: 'Cultivations', requiresAuth: true },
        },
        {
          path: 'cultivations/:cultivationId',
          name: 'cultivation-detail',
          component: CultivationDetailPage,
          meta: { title: 'Cultivation', requiresAuth: true },
        },
        {
          path: 'cultivations/:cultivationId/tasks',
          name: 'cultivation-tasks',
          component: CultivationTasksPage,
          meta: { title: 'Daily tasks', requiresAuth: true },
        },
        {
          path: 'cultivations/:cultivationId/growth',
          name: 'cultivation-growth',
          component: CultivationGrowthPage,
          meta: { title: 'Growth records', requiresAuth: true },
        },
        {
          path: 'cultivations/:cultivationId/records',
          name: 'cultivation-records',
          component: CultivationRecordsPage,
          meta: { title: 'Farm records', requiresAuth: true },
        },
        {
          path: 'cultivations/:cultivationId/harvest',
          name: 'cultivation-harvest',
          component: CultivationHarvestPage,
          meta: { title: 'Harvest readiness', requiresAuth: true },
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrdersPage,
          meta: { title: 'Orders', requiresAuth: true },
        },
        {
          path: 'marketplace',
          name: 'marketplace',
          component: MarketplacePage,
          meta: { title: 'Marketplace', requiresAuth: true },
        },
        {
          path: 'products/:productId',
          name: 'product-detail',
          component: ProductDetailPage,
          meta: { title: 'Product details', requiresAuth: true },
        },
        {
          path: 'cart',
          name: 'cart',
          component: CartPage,
          meta: { title: 'Cart', requiresAuth: true },
        },
        {
          path: 'checkout',
          name: 'checkout',
          component: CheckoutPage,
          meta: { title: 'Checkout', requiresAuth: true },
        },
        {
          path: 'orders/:orderId',
          name: 'order-detail',
          component: OrderDetailPage,
          meta: { title: 'Order details', requiresAuth: true },
        },
        {
          path: 'orders/:orderId/tracking',
          name: 'order-tracking',
          component: OrderTrackingPage,
          meta: { title: 'Track order', requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfilePage,
          meta: { title: 'Profile', requiresAuth: true },
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: NotificationsPage,
          meta: { title: 'Notifications', requiresAuth: true },
        },
      ],
    },
    { path: '/offline', name: 'offline', component: OfflinePage, meta: { title: 'Offline' } },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
      meta: { title: 'Page not found' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (to.name === 'splash') return true
  const session = useSessionStore()
  await session.restore()

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: 'sign-in', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && session.isAuthenticated) return session.suggestedRoute

  if (to.path.startsWith('/setup/')) {
    const setup = useSetupStore()
    if (to.name === 'setup-environment' && !setup.draft.speciesId) return '/setup/species'
    if (to.name === 'setup-dimensions' && !setup.draft.environmentId) return '/setup/environment'
    if (to.name === 'setup-fingerlings' && !setup.draft.dimensions) return '/setup/dimensions'
    if (
      (to.name === 'setup-stocking-result' || to.name === 'setup-review') &&
      !setup.draft.estimate
    ) {
      return '/setup/fingerlings'
    }
  }
  return true
})

router.afterEach((route) => {
  const title = typeof route.meta.title === 'string' ? route.meta.title : 'Gabayan'
  document.title = title === 'Gabayan' ? title : `${title} | Gabayan`
})
