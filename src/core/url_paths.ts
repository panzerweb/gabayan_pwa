// Every API path, relative to `VITE_API_BASE_URL` (which already ends in `/api/v1`).
// Groups follow the resources of contract §5; paths carrying an id are functions.
// Query strings are built by the calling api function, never here.

type Id = string | number

const segment = (id: Id) => encodeURIComponent(String(id))

export const ENDPOINTS = {
  system: {
    health: '/health',
    meta: '/meta',
  },
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    google: '/auth/google',
    forgotPassword: '/auth/password/forgot',
    resetPassword: '/auth/password/reset',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  currentUser: {
    root: '/users/me',
    farm: '/users/me/farm',
    notificationSettings: '/users/me/notification-settings',
  },
  tiers: {
    root: '/tiers',
    account: '/users/me/tier',
    upgradeRequests: '/users/me/tier/upgrade-requests',
  },
  addresses: {
    root: '/users/me/addresses',
    detail: (addressId: Id) => `/users/me/addresses/${segment(addressId)}` as const,
  },
  species: {
    root: '/species',
    detail: (speciesId: Id) => `/species/${segment(speciesId)}` as const,
  },
  cultureEnvironments: {
    root: '/culture-environments',
    detail: (environmentId: Id) => `/culture-environments/${segment(environmentId)}` as const,
  },
  compatibility: {
    root: '/compatibility',
  },
  sizingGuidance: {
    root: '/sizing-guidance',
  },
  stockingEstimates: {
    root: '/stocking-estimates',
  },
  waterThresholds: {
    root: '/water-thresholds',
  },
  waterSafetyChecks: {
    root: '/water-safety-checks',
  },
  dashboard: {
    home: '/dashboard/home',
  },
  cultivations: {
    root: '/cultivations',
    detail: (cultivationId: Id) => `/cultivations/${segment(cultivationId)}` as const,
    timeline: (cultivationId: Id) => `/cultivations/${segment(cultivationId)}/timeline` as const,
    equipmentRecommendations: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/equipment-recommendations` as const,
    growth: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/growth-measurements` as const,
    mortality: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/mortality-records` as const,
    feedingPlan: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/feeding-plan` as const,
    feedingRecords: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/feeding-records` as const,
    waterChecks: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/water-checks` as const,
    harvestReadiness: (cultivationId: Id) =>
      `/cultivations/${segment(cultivationId)}/harvest-readiness` as const,
    harvest: (cultivationId: Id) => `/cultivations/${segment(cultivationId)}/harvest` as const,
  },
  tasks: {
    root: '/tasks',
    detail: (taskId: Id) => `/tasks/${segment(taskId)}` as const,
    complete: (taskId: Id) => `/tasks/${segment(taskId)}/complete` as const,
    reopen: (taskId: Id) => `/tasks/${segment(taskId)}/reopen` as const,
  },
  productCategories: {
    root: '/product-categories',
  },
  products: {
    root: '/products',
    detail: (productId: Id) => `/products/${segment(productId)}` as const,
    favorite: (productId: Id) => `/products/${segment(productId)}/favorite` as const,
  },
  cart: {
    root: '/cart',
  },
  cartItems: {
    root: '/cart/items',
    detail: (itemId: Id) => `/cart/items/${segment(itemId)}` as const,
  },
  checkout: {
    paymentOptions: '/checkout/payment-options',
    quote: '/checkout/quote',
  },
  orders: {
    root: '/orders',
    detail: (orderId: Id) => `/orders/${segment(orderId)}` as const,
    tracking: (orderId: Id) => `/orders/${segment(orderId)}/tracking` as const,
    cancel: (orderId: Id) => `/orders/${segment(orderId)}/cancel` as const,
  },
  notifications: {
    root: '/notifications',
    unreadCount: '/notifications/unread-count',
    read: (notificationId: Id) => `/notifications/${segment(notificationId)}/read` as const,
    readAll: '/notifications/read-all',
  },
} as const
