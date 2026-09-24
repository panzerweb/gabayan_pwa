import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'

import { ApiError } from '@core/http'
import type { ProfileRepository } from '@pages/profile/domain/profile.repository.interface'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { meta, user } from '../../unit/profile/fixtures'

export { address, farm, meta, pageInfo, settings, user } from '../../unit/profile/fixtures'

// A repository whose every method fails loudly unless a test gives it an answer.
export function stubProfileRepository(): {
  [K in keyof ProfileRepository]: ReturnType<typeof vi.fn>
} {
  const refuse = () => vi.fn().mockRejectedValue(new Error('not stubbed'))
  return {
    updateCurrentUser: refuse(),
    getFarmProfile: refuse(),
    upsertFarmProfile: refuse(),
    listAddresses: refuse(),
    createAddress: refuse(),
    updateAddress: refuse(),
    deleteAddress: refuse(),
    getNotificationSettings: refuse(),
    updateNotificationSettings: refuse(),
  }
}

export function envelope<T>(data: T) {
  return { data, meta }
}

export function apiError(
  status: number,
  code: string,
  message: string,
  fields: Record<string, string[]> | null = null,
) {
  return new ApiError(status, { code, message, fields, details: null, requestId: 'req_1' })
}

export function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
}

// Mounts a profile component signed in as Juan, with a real QueryClient and the modal
// rendered in place so its form can be queried.
export function mountSignedIn(component: Component) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore()
  session.accessToken = 'access_1'
  session.user = { ...user }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = mount(component, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      stubs: { teleport: true },
    },
  })
  return { wrapper, session, toast: useToastStore(), queryClient }
}
