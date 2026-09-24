import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

// Restores the session once the splash is on screen, then replaces it with Welcome for a
// visitor, or with Home or setup for a signed-in farmer.
export function useSplashRedirect() {
  const router = useRouter()
  const session = useSessionStore()

  onMounted(async () => {
    await session.restore()
    await router.replace({
      name: session.isAuthenticated ? session.suggestedRouteName : ROUTE_NAMES.welcome,
    })
  })
}
