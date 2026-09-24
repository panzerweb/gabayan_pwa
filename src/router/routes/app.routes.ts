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
        component: () => import('@pages/app/HomePage.vue'),
        meta: { title: 'Home' },
      },
      {
        path: 'cultivations',
        name: ROUTE_NAMES.cultivations,
        component: () => import('@pages/app/CultivationsPage.vue'),
        meta: { title: 'Cultivations' },
      },
      {
        path: 'cultivations/:cultivationId',
        name: ROUTE_NAMES.cultivationDetail,
        component: () => import('@pages/app/CultivationDetailPage.vue'),
        meta: { title: 'Cultivation' },
      },
      {
        path: 'cultivations/:cultivationId/tasks',
        name: ROUTE_NAMES.cultivationTasks,
        component: () => import('@pages/app/CultivationTasksPage.vue'),
        meta: { title: 'Daily tasks' },
      },
      {
        path: 'cultivations/:cultivationId/growth',
        name: ROUTE_NAMES.cultivationGrowth,
        component: () => import('@pages/app/CultivationGrowthPage.vue'),
        meta: { title: 'Growth records' },
      },
      {
        path: 'cultivations/:cultivationId/records',
        name: ROUTE_NAMES.cultivationRecords,
        component: () => import('@pages/app/CultivationRecordsPage.vue'),
        meta: { title: 'Farm records' },
      },
      {
        path: 'cultivations/:cultivationId/harvest',
        name: ROUTE_NAMES.cultivationHarvest,
        component: () => import('@pages/app/CultivationHarvestPage.vue'),
        meta: { title: 'Harvest readiness' },
      },
      {
        path: 'orders',
        name: ROUTE_NAMES.orders,
        component: () => import('@pages/app/OrdersPage.vue'),
        meta: { title: 'Orders' },
      },
      {
        path: 'marketplace',
        name: ROUTE_NAMES.marketplace,
        component: () => import('@pages/app/MarketplacePage.vue'),
        meta: { title: 'Marketplace' },
      },
      {
        path: 'products/:productId',
        name: ROUTE_NAMES.productDetail,
        component: () => import('@pages/app/ProductDetailPage.vue'),
        meta: { title: 'Product details' },
      },
      {
        path: 'cart',
        name: ROUTE_NAMES.cart,
        component: () => import('@pages/app/CartPage.vue'),
        meta: { title: 'Cart' },
      },
      {
        path: 'checkout',
        name: ROUTE_NAMES.checkout,
        component: () => import('@pages/app/CheckoutPage.vue'),
        meta: { title: 'Checkout' },
      },
      {
        path: 'orders/:orderId',
        name: ROUTE_NAMES.orderDetail,
        component: () => import('@pages/app/OrderDetailPage.vue'),
        meta: { title: 'Order details' },
      },
      {
        path: 'orders/:orderId/tracking',
        name: ROUTE_NAMES.orderTracking,
        component: () => import('@pages/app/OrderTrackingPage.vue'),
        meta: { title: 'Track order' },
      },
      {
        path: 'profile',
        name: ROUTE_NAMES.profile,
        component: () => import('@pages/app/ProfilePage.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'notifications',
        name: ROUTE_NAMES.notifications,
        component: () => import('@pages/app/NotificationsPage.vue'),
        meta: { title: 'Notifications' },
      },
    ],
  },
]
