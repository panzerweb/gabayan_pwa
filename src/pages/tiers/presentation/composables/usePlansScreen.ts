import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { tiersRepository } from '../../data/tiers.repository'
import { isTierCode, meetsTier, tierName, tierRank, type TierPlan } from '../../domain/tiers.model'
import type { TiersRepository } from '../../domain/tiers.repository.interface'
import { useAccountTier } from './useAccountTier'
import { usePlans } from './usePlans'
import { useUpgradeRequest } from './useUpgradeRequest'

// State of the plans screen: every plan beside the account's own, the plan a guarded screen
// asked for (`?required=PRO`), and the request action for each plan above the current one.
// Only one request may wait for review at a time, so every request button rests while one
// is pending.
export function usePlansScreen(repository: TiersRepository = tiersRepository) {
  const route = useRoute()
  const plansQuery = usePlans(repository)
  const tierQuery = useAccountTier(repository)
  const upgrade = useUpgradeRequest(repository)
  const requestingCode = ref<string | null>(null)

  const accountTier = tierQuery.accountTier
  const currentCode = computed(() => accountTier.value?.plan.code ?? null)
  const pendingRequest = computed(() => accountTier.value?.pendingUpgradeRequest ?? null)

  // The plan a guarded screen needs, shown only while the account is still below it.
  const requiredPlanName = computed(() => {
    const required = route.query.required
    if (!isTierCode(required) || !currentCode.value) return null
    if (meetsTier(currentCode.value, required)) return null
    return tierName(required, plansQuery.plans.value)
  })

  const pendingPlanName = computed(() =>
    pendingRequest.value
      ? tierName(pendingRequest.value.requestedTier, plansQuery.plans.value)
      : null,
  )

  function canRequest(plan: TierPlan) {
    if (!currentCode.value) return false
    return tierRank(plan.code) > tierRank(currentCode.value)
  }

  async function request(plan: TierPlan) {
    if (!canRequest(plan) || pendingRequest.value) return false
    requestingCode.value = plan.code
    try {
      return await upgrade.requestUpgrade(plan, accountTier.value?.plan.name)
    } finally {
      requestingCode.value = null
    }
  }

  function retry() {
    if (plansQuery.loadFailed.value) void plansQuery.refetch()
    if (tierQuery.loadFailed.value) void tierQuery.refetch()
  }

  return {
    plans: plansQuery.plans,
    accountTier,
    currentCode,
    pendingRequest,
    pendingPlanName,
    requiredPlanName,
    loading: computed(() => plansQuery.loading.value || tierQuery.loading.value),
    loadFailed: computed(() => plansQuery.loadFailed.value || tierQuery.loadFailed.value),
    retry,
    canRequest,
    request,
    requestingCode,
    formError: upgrade.formError,
    isOnline: upgrade.isOnline,
  }
}
