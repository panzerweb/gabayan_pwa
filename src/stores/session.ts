import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  ApiError,
  getCurrentUser,
  listCultivations,
  logout as logoutRequest,
  refreshAccessToken,
  type AuthSession,
  type UserProfile,
} from '@/services/api'
import { queryClient } from '@core/query'

export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<UserProfile | null>(null)
  const hasCultivation = ref(false)
  const initialized = ref(false)
  let restorePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const suggestedRoute = computed(() => (hasCultivation.value ? '/app/home' : '/setup'))

  function acceptSession(session: AuthSession) {
    accessToken.value = session.accessToken
    user.value = session.user
    hasCultivation.value = session.onboarding.hasCultivation
    initialized.value = true
  }

  function clear() {
    accessToken.value = null
    user.value = null
    hasCultivation.value = false
  }

  async function restore() {
    if (initialized.value) return
    if (restorePromise) return restorePromise

    restorePromise = (async () => {
      try {
        const refreshed = await refreshAccessToken()
        accessToken.value = refreshed.data.accessToken
        const [profile, cultivations] = await Promise.all([
          getCurrentUser(refreshed.data.accessToken),
          listCultivations(refreshed.data.accessToken, 1),
        ])
        user.value = profile.data
        hasCultivation.value = cultivations.page.total > 0
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error
        clear()
      } finally {
        initialized.value = true
        restorePromise = null
      }
    })()

    return restorePromise
  }

  async function signOut() {
    const token = accessToken.value
    try {
      if (token) await logoutRequest(token)
    } catch {
      // Local session state must still be cleared if the server is unavailable.
    } finally {
      queryClient.clear()
      clear()
      initialized.value = true
    }
  }

  function markCultivationCreated() {
    hasCultivation.value = true
  }

  return {
    accessToken,
    user,
    hasCultivation,
    initialized,
    isAuthenticated,
    suggestedRoute,
    acceptSession,
    restore,
    signOut,
    markCultivationCreated,
  }
})
