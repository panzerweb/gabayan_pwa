import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import SplashView from '@pages/public/presentation/views/SplashView.vue'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

const stub = { template: '<div />' }

// Named stand-ins for the splash's three destinations, so no real page loads.
function testRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: ROUTE_NAMES.splash, component: SplashView },
      { path: '/welcome', name: ROUTE_NAMES.welcome, component: stub },
      { path: '/app/home', name: ROUTE_NAMES.home, component: stub },
      { path: '/setup', name: ROUTE_NAMES.setupIntro, component: stub },
    ],
  })
}

async function openSplash(session: { signedIn: boolean; hasCultivation?: boolean }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useSessionStore()
  const restore = vi.spyOn(store, 'restore').mockImplementation(async () => {
    if (session.signedIn) {
      store.$patch({
        accessToken: 'token',
        user: { id: 'usr_1' } as never,
        hasCultivation: session.hasCultivation ?? false,
      })
    }
  })
  const router = testRouter()
  await router.push('/')
  await router.isReady()
  mount(SplashView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { router, restore }
}

describe('SplashView', () => {
  it('restores the session, then sends a visitor to Welcome', async () => {
    const { router, restore } = await openSplash({ signedIn: false })

    expect(restore).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.welcome)
  })

  it('sends a signed-in farmer with a cultivation to Home', async () => {
    const { router } = await openSplash({ signedIn: true, hasCultivation: true })

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.home)
  })

  it('sends a signed-in farmer without a cultivation to setup', async () => {
    const { router } = await openSplash({ signedIn: true, hasCultivation: false })

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupIntro)
  })
})
