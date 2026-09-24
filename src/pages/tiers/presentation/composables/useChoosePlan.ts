import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@router/route-names'

import { tiersRepository } from '../../data/tiers.repository'
import { tierName, type TierCode } from '../../domain/tiers.model'
import type { TiersRepository } from '../../domain/tiers.repository.interface'
import { usePlans } from './usePlans'
import { useUpgradeRequest } from './useUpgradeRequest'

// The plan step of onboarding. Every new account is on Free, which stays selected unless
// the farmer picks another plan. A paid plan cannot be bought in the app yet, so choosing
// one records an upgrade request and the farmer continues to setup on Free; if the request
// cannot be sent they stay on this step with the reason.
export function useChoosePlan(repository: TiersRepository = tiersRepository) {
  const router = useRouter()
  const plansQuery = usePlans(repository)
  const upgrade = useUpgradeRequest(repository)
  const selectedCode = ref<TierCode>('FREE')

  const selectedPlan = computed(
    () => plansQuery.plans.value.find((plan) => plan.code === selectedCode.value) ?? null,
  )
  const freeName = computed(() => tierName('FREE', plansQuery.plans.value))

  const continueLabel = computed(() => {
    const plan = selectedPlan.value
    if (!plan || plan.code === 'FREE') return `Continue with ${freeName.value}`
    return `Request ${plan.name} and continue`
  })

  function select(code: TierCode) {
    selectedCode.value = code
    upgrade.formError.value = ''
  }

  // Resolves true once the farmer is on their way to the setup introduction.
  async function submit(): Promise<boolean> {
    const plan = selectedPlan.value
    if (plan && plan.code !== 'FREE') {
      const sent = await upgrade.requestUpgrade(plan, freeName.value)
      if (!sent) return false
    }
    await router.replace({ name: ROUTE_NAMES.setupIntro })
    return true
  }

  return {
    plans: plansQuery.plans,
    loading: plansQuery.loading,
    loadFailed: plansQuery.loadFailed,
    refetch: plansQuery.refetch,
    selectedCode,
    select,
    continueLabel,
    submitting: upgrade.requesting,
    formError: upgrade.formError,
    isOnline: upgrade.isOnline,
    submit,
  }
}
