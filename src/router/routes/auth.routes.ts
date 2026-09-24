import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '../route-names'

// Sign-in pages; children of the guest-only public layout.
export const authRoutes: RouteRecordRaw[] = [
  {
    path: 'sign-in',
    name: ROUTE_NAMES.signIn,
    component: () => import('@pages/auth/SignInPage.vue'),
    meta: { title: 'Sign in' },
  },
  {
    path: 'create-account',
    name: ROUTE_NAMES.createAccount,
    component: () => import('@pages/auth/CreateAccountPage.vue'),
    meta: { title: 'Create account' },
  },
  {
    path: 'forgot-password',
    name: ROUTE_NAMES.forgotPassword,
    component: () => import('@pages/auth/ForgotPasswordPage.vue'),
    meta: { title: 'Forgot password' },
  },
  {
    path: 'reset-password',
    name: ROUTE_NAMES.resetPassword,
    component: () => import('@pages/auth/ResetPasswordPage.vue'),
    meta: { title: 'Reset password' },
  },
]
