import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '@core/http'
import type { AuthSession } from '@pages/auth/domain/auth.model'
import type { AuthRepository } from '@pages/auth/domain/auth.repository.interface'
import { useSignIn } from '@pages/auth/presentation/composables/useSignIn'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

const stub = { template: '<div />' }

const session = {
  accessToken: 'access_1',
  tokenType: 'Bearer',
  expiresInSeconds: 900,
  user: { id: 'usr_juan', fullName: 'Juan Dela Cruz' },
  onboarding: { hasCultivation: true, suggestedRoute: '/app/home' },
} as AuthSession

function invalidCredentials() {
  return new ApiError(401, {
    code: 'INVALID_CREDENTIALS',
    message: 'The email, mobile number, or password is incorrect.',
    fields: null,
    details: null,
    requestId: 'req_1',
  })
}

function stubRepository(overrides: Partial<AuthRepository> = {}) {
  return {
    login: vi.fn().mockResolvedValue({ data: session, meta: { requestId: 'req_1' } }),
    loginWithGoogle: vi.fn().mockResolvedValue({ data: session, meta: { requestId: 'req_1' } }),
    ...overrides,
  } as unknown as AuthRepository
}

// Mounts a host component around `useSignIn` with a real QueryClient and a stubbed repository.
async function mountSignIn(repository: AuthRepository, redirect?: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/sign-in', name: ROUTE_NAMES.signIn, component: stub },
      { path: '/app/home', name: ROUTE_NAMES.home, component: stub },
      { path: '/setup', name: ROUTE_NAMES.setupIntro, component: stub },
      { path: '/app/orders/:orderId', name: ROUTE_NAMES.orderDetail, component: stub },
      { path: '/:pathMatch(.*)*', name: ROUTE_NAMES.notFound, component: stub },
    ],
  })
  await router.push({ name: ROUTE_NAMES.signIn, query: redirect ? { redirect } : {} })
  await router.isReady()

  let signIn!: ReturnType<typeof useSignIn>
  const Host = defineComponent({
    setup() {
      signIn = useSignIn(repository)
      return () => null
    },
  })
  const pinia = createPinia()
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  mount(Host, { global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] } })
  return { signIn, router }
}

describe('useSignIn', () => {
  it('shows the server sentence for refused credentials and stays on sign in', async () => {
    const repository = stubRepository({ login: vi.fn().mockRejectedValue(invalidCredentials()) })
    const { signIn, router } = await mountSignIn(repository)
    signIn.identifier.value = 'juan@example.com'
    signIn.password.value = 'wrong-password'

    await signIn.submit()
    await flushPromises()

    expect(repository.login).toHaveBeenCalledWith({
      identifier: 'juan@example.com',
      password: 'wrong-password',
    })
    expect(signIn.formError.value).toBe('The email, mobile number, or password is incorrect.')
    expect(signIn.fieldErrors.value).toEqual({})
    expect(signIn.loading.value).toBe(false)
    expect(useSessionStore().isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.signIn)
  })

  it('checks the form before calling the API', async () => {
    const repository = stubRepository()
    const { signIn } = await mountSignIn(repository)

    await signIn.submit()

    expect(repository.login).not.toHaveBeenCalled()
    expect(signIn.fieldErrors.value).toEqual({
      identifier: 'Enter your email or mobile number.',
      password: 'Enter your password.',
    })
  })

  it('signs in and returns the farmer to the page they asked for', async () => {
    const { signIn, router } = await mountSignIn(stubRepository(), '/app/orders/ord_001')
    signIn.identifier.value = 'juan@example.com'
    signIn.password.value = 'Gabayan123!'

    await signIn.submit()
    await flushPromises()

    expect(useSessionStore().isAuthenticated).toBe(true)
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.orderDetail)
    expect(router.currentRoute.value.params).toEqual({ orderId: 'ord_001' })
    expect(useToastStore().messages.map((toast) => toast.message)).toEqual(['Welcome back, Juan.'])
  })

  it('ignores a redirect to an unknown page or another site', async () => {
    for (const redirect of ['/no/such/page', '//example.com/app/home']) {
      const { signIn, router } = await mountSignIn(stubRepository(), redirect)
      signIn.identifier.value = 'juan@example.com'
      signIn.password.value = 'Gabayan123!'

      await signIn.submit()
      await flushPromises()

      expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.home)
    }
  })

  it('sends a farmer without a cultivation to setup after the demo Google sign-in', async () => {
    const newcomer = { ...session, onboarding: { hasCultivation: false, suggestedRoute: '/setup' } }
    const repository = stubRepository({
      loginWithGoogle: vi.fn().mockResolvedValue({ data: newcomer, meta: { requestId: 'r' } }),
    })
    const { signIn, router } = await mountSignIn(repository)

    await signIn.continueWithGoogleDemo()
    await flushPromises()

    expect(repository.loginWithGoogle).toHaveBeenCalledWith('demo-google-token')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupIntro)
  })
})
