import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import { queryClient } from '@core/query'
import { tiersKeys } from '@pages/tiers/data/tiers.keys'
import { tiersRepository } from '@pages/tiers/data/tiers.repository'
import { meetsTier, type TierCode } from '@pages/tiers/domain/tiers.model'
import { useSessionStore } from '@stores/session.store'

import { ROUTE_NAMES } from '../route-names'

async function currentTier(accessToken: string): Promise<TierCode | null> {
  try {
    const response = await queryClient.fetchQuery({
      queryKey: tiersKeys.account(),
      queryFn: () => tiersRepository.getAccountTier(accessToken),
      retry: false,
    })
    return response.data.plan.code
  } catch {
    return null
  }
}

// Sends a farmer whose plan is below a screen's `meta.tier` to the plans, naming the plan the
// screen needs and where they were going. The API enforces every tier on its own; this only
// spares the farmer a screen of refusals. When the tier cannot be read (offline, server
// unavailable) the screen still opens and its requests carry any refusal.
export async function tierGuard(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  const required = to.meta.tier
  if (!required) return true

  const session = useSessionStore()
  if (!session.isAuthenticated || !session.accessToken) return true

  const current = await currentTier(session.accessToken)
  if (!current || meetsTier(current, required)) return true
  return { name: ROUTE_NAMES.plans, query: { required, redirect: to.fullPath } }
}
