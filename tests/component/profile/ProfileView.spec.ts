import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import ProfileView from '@pages/profile/presentation/views/ProfileView.vue'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

import { user } from './support'

const stub = { template: '<div />' }

vi.mock('@pages/profile/data/profile.repository', () => {
  const pending = () => vi.fn(() => new Promise(() => {}))
  return {
    profileRepository: {
      getFarmProfile: pending(),
      listAddresses: pending(),
      getNotificationSettings: pending(),
    },
  }
})

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/app/profile', name: ROUTE_NAMES.profile, component: ProfileView },
      { path: '/welcome', name: ROUTE_NAMES.welcome, component: stub },
    ],
  })
  await router.push({ name: ROUTE_NAMES.profile })
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore()
  session.accessToken = 'access_1'
  session.user = { ...user }
  const signOut = vi.spyOn(session, 'signOut').mockResolvedValue()

  const queryClient = new QueryClient()
  const wrapper = mount(ProfileView, {
    global: {
      plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      stubs: { teleport: true, AppHeader: true },
    },
  })
  return { wrapper, router, signOut }
}

describe('ProfileView', () => {
  it('composes the summary and the four profile sections', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('h1').text()).toBe('Juan Dela Cruz')
    expect(wrapper.text()).toContain('JD')
    expect(wrapper.findAll('h2').map((heading) => heading.text())).toEqual([
      'Personal details',
      'Farm profile',
      'Addresses',
      'Notification preferences',
    ])
  })

  it('signs out and returns to Welcome by route name', async () => {
    const { wrapper, router, signOut } = await mountView()

    const button = wrapper.findAll('button').find((item) => item.text() === 'Sign out')
    await button?.trigger('click')
    await flushPromises()

    expect(signOut).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.welcome)
  })
})
