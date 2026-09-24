import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { ApiError } from '@core/http'
import { queryClient } from '@core/query'
import { authRepository } from '@pages/auth/data/auth.repository'
import type { AuthSession, UserProfile } from '@pages/auth/domain/auth.model'
import { cultivationsRepository } from '@pages/cultivations/data/cultivations.repository'
import { ROUTE_NAMES } from '@router/route-names'

export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<UserProfile | null>(null)
  const hasCultivation = ref(false)
  const initialized = ref(false)
  let restorePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  // Where a signed-in farmer belongs: Home once a cultivation exists, otherwise setup.
  const suggestedRouteName = computed(() =>
    hasCultivation.value ? ROUTE_NAMES.home : ROUTE_NAMES.setupIntro,
  )

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

  // Exchanges the refresh cookie for an access token once per page load. A 401 means
  // there is no session to restore; any other failure is left to the caller.
  async function restore() {
    if (initialized.value) return
    if (restorePromise) return restorePromise

    restorePromise = (async () => {
      try {
        const refreshed = await authRepository.refreshAccessToken()
        accessToken.value = refreshed.data.accessToken
        const [profile, cultivations] = await Promise.all([
          authRepository.getCurrentUser(refreshed.data.accessToken),
          // One row is enough: only the total says whether setup is still ahead.
          cultivationsRepository.listCultivations(refreshed.data.accessToken, 1),
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
      if (token) await authRepository.logout(token)
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
    suggestedRouteName,
    acceptSession,
    restore,
    signOut,
    markCultivationCreated,
  }
})
