import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

// Ends the session and returns to Welcome. The session store clears local state even
// when the logout request fails, so the farmer always leaves signed out.
export function useSignOut() {
  const session = useSessionStore()
  const router = useRouter()
  const signingOut = ref(false)

  async function signOut() {
    signingOut.value = true
    try {
      await session.signOut()
      await router.replace({ name: ROUTE_NAMES.welcome })
    } finally {
      signingOut.value = false
    }
  }

  return { signingOut, signOut }
}
