import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { describeError } from '@core/errors'
import { invalidateAfter } from '@core/query'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { tiersRepository } from '../../data/tiers.repository'
import {
  TIER_OFFLINE_MESSAGE,
  type CreateUpgradeRequest,
  type TierPlan,
} from '../../domain/tiers.model'
import type { TiersRepository } from '../../domain/tiers.repository.interface'

const REQUEST_FAILED = 'We could not send your plan request. Please try again.'

// Records a request to move up to a paid plan. Nothing is charged: the account stays on its
// plan until the request is reviewed, and the toast says so. A request is never queued
// while offline.
export function useUpgradeRequest(repository: TiersRepository = tiersRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const formError = ref('')

  const mutation = useMutation({
    mutationFn: (body: CreateUpgradeRequest) =>
      repository.createUpgradeRequest(body, session.accessToken ?? ''),
  })

  // Resolves true once the server has recorded the request.
  async function requestUpgrade(plan: TierPlan, currentPlanName = 'Free'): Promise<boolean> {
    formError.value = ''
    if (!isOnline.value) {
      formError.value = TIER_OFFLINE_MESSAGE
      return false
    }
    try {
      await mutation.mutateAsync({ requestedTier: plan.code })
    } catch (error) {
      formError.value = describeError(error, REQUEST_FAILED)
      return false
    }
    await invalidateAfter(queryClient, 'upgradeRequest')
    toast.show(
      `${plan.name} request sent. You stay on ${currentPlanName} until it is reviewed.`,
      'success',
      6000,
    )
    return true
  }

  return {
    formError,
    isOnline,
    requesting: computed(() => mutation.isPending.value),
    requestUpgrade,
  }
}
