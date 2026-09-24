import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '../route-names'

// Everything behind sign-in, inside the layout with the bottom navigation.
export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/app',
    component: () => import('@layouts/AuthenticatedLayout.vue'),
    redirect: { name: ROUTE_NAMES.home },
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: ROUTE_NAMES.home,
        component: () => import('@pages/home/presentation/views/HomeView.vue'),
        meta: { title: 'Home' },
      },
      {
        path: 'cultivations',
        name: ROUTE_NAMES.cultivations,
        component: () => import('@pages/cultivations/presentation/views/CultivationsView.vue'),
        meta: { title: 'Cultivations' },
      },
      {
        path: 'cultivations/:cultivationId',
        name: ROUTE_NAMES.cultivationDetail,
        component: () => import('@pages/cultivations/presentation/views/CultivationDetailView.vue'),
        meta: { title: 'Cultivation' },
      },
      {
        path: 'cultivations/:cultivationId/tasks',
        name: ROUTE_NAMES.cultivationTasks,
        component: () => import('@pages/cultivations/presentation/views/CultivationTasksView.vue'),
        meta: { title: 'Daily tasks' },
      },
      {
        path: 'cultivations/:cultivationId/growth',
        name: ROUTE_NAMES.cultivationGrowth,
        component: () => import('@pages/cultivations/presentation/views/CultivationGrowthView.vue'),
        meta: { title: 'Growth records' },
      },
      {
        path: 'cultivations/:cultivationId/records',
        name: ROUTE_NAMES.cultivationRecords,
        component: () =>
          import('@pages/cultivations/presentation/views/CultivationRecordsView.vue'),
        meta: { title: 'Farm records' },
      },
      {
        path: 'cultivations/:cultivationId/harvest',
        name: ROUTE_NAMES.cultivationHarvest,
        component: () =>
          import('@pages/cultivations/presentation/views/CultivationHarvestView.vue'),
        meta: { title: 'Harvest readiness' },
      },
      {
        path: 'orders',
        name: ROUTE_NAMES.orders,
        component: () => import('@pages/orders/presentation/views/OrdersView.vue'),
        meta: { title: 'Orders' },
      },
      {
        path: 'marketplace',
        name: ROUTE_NAMES.marketplace,
        component: () => import('@pages/marketplace/presentation/views/MarketplaceView.vue'),
        meta: { title: 'Marketplace' },
      },
      {
        path: 'products/:productId',
        name: ROUTE_NAMES.productDetail,
        component: () => import('@pages/marketplace/presentation/views/ProductDetailView.vue'),
        meta: { title: 'Product details' },
      },
      {
        path: 'cart',
        name: ROUTE_NAMES.cart,
        component: () => import('@pages/cart/presentation/views/CartView.vue'),
        meta: { title: 'Cart' },
      },
      {
        path: 'checkout',
        name: ROUTE_NAMES.checkout,
        component: () => import('@pages/cart/presentation/views/CheckoutView.vue'),
        meta: { title: 'Checkout' },
      },
      {
        path: 'orders/:orderId',
        name: ROUTE_NAMES.orderDetail,
        component: () => import('@pages/orders/presentation/views/OrderDetailView.vue'),
        meta: { title: 'Order details' },
      },
      {
        path: 'orders/:orderId/tracking',
        name: ROUTE_NAMES.orderTracking,
        component: () => import('@pages/orders/presentation/views/OrderTrackingView.vue'),
        meta: { title: 'Track order' },
      },
      {
        path: 'profile',
        name: ROUTE_NAMES.profile,
        component: () => import('@pages/profile/presentation/views/ProfileView.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'plans',
        name: ROUTE_NAMES.plans,
        component: () => import('@pages/tiers/presentation/views/PlansView.vue'),
        meta: { title: 'Plans' },
      },
      {
        path: 'notifications',
        name: ROUTE_NAMES.notifications,
        component: () => import('@pages/notifications/presentation/views/NotificationsView.vue'),
        meta: { title: 'Notifications' },
      },
    ],
  },
]
