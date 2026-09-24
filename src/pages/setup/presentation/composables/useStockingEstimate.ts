import { useMutation } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { useSessionStore } from '@stores/session.store'

import { setupRepository } from '../../data/setup.repository'
import {
  FINGERLINGS_ERROR,
  SETUP_OFFLINE_MESSAGES,
  canReviewEstimate,
  parseFingerlings,
  stockingEstimateRequest,
  stockingResultContent,
  type StockingEstimateRequest,
} from '../../domain/setup.model'
import type { SetupRepository } from '../../domain/setup.repository.interface'
import { useSetupStore } from '../stores/setup.store'

const ESTIMATE_FAILED = 'We couldn’t prepare the estimate. Please try again.'
const DRAFT_INCOMPLETE = 'Some setup answers are missing. Go back a step and check them.'

// Asks the server to compare a planned fingerling count with the species and environment
// profile. The range, status and suggestion are the server's; nothing here computes them.
// An estimate is a calculation that stores nothing the farmer owns, so it carries no
// Idempotency-Key.
export function useStockingEstimate(repository: SetupRepository = setupRepository) {
  const setup = useSetupStore()
  const session = useSessionStore()
  const { isOnline } = useOnlineStatus()

  const plannedFingerlings = ref(setup.draft.plannedFingerlings?.toString() ?? '')
  const fieldError = ref('')
  const formError = ref('')

  const mutation = useMutation({
    mutationFn: (body: StockingEstimateRequest) =>
      repository.createStockingEstimate(body, session.accessToken ?? ''),
  })

  const estimate = computed(() => setup.draft.estimate)

  async function request(count: number): Promise<boolean> {
    formError.value = ''
    if (!isOnline.value) {
      formError.value = SETUP_OFFLINE_MESSAGES.estimate
      return false
    }
    const body = stockingEstimateRequest(setup.draft, count)
    if (!body) {
      formError.value = DRAFT_INCOMPLETE
      return false
    }
    try {
      const response = await mutation.mutateAsync(body)
      setup.setEstimate(response.data)
      plannedFingerlings.value = String(response.data.plannedFingerlings)
      return true
    } catch (error) {
      const fieldMessage = apiFieldErrors(error).plannedFingerlings
      if (fieldMessage) fieldError.value = fieldMessage
      else formError.value = describeError(error, ESTIMATE_FAILED)
      return false
    }
  }

  // Resolves true once the typed count has an estimate.
  async function submitPlannedCount(): Promise<boolean> {
    fieldError.value = ''
    const count = parseFingerlings(plannedFingerlings.value)
    if (count === null) {
      fieldError.value = FINGERLINGS_ERROR
      return false
    }
    return request(count)
  }

  // Re-estimates with the server's suggested count in place of the farmer's.
  async function applySuggestedCount(): Promise<boolean> {
    if (!estimate.value) return false
    return request(estimate.value.suggestedFingerlings)
  }

  return {
    estimate,
    content: computed(() => (estimate.value ? stockingResultContent(estimate.value.status) : null)),
    acceptedAboveRangeWarning: computed({
      get: () => setup.draft.acceptedAboveRangeWarning,
      set: (accepted: boolean) => setup.acceptAboveRangeWarning(accepted),
    }),
    canReview: computed(() =>
      estimate.value
        ? canReviewEstimate(estimate.value, setup.draft.acceptedAboveRangeWarning)
        : false,
    ),
    plannedFingerlings,
    fieldError,
    formError,
    isOnline,
    estimating: computed(() => mutation.isPending.value),
    submitPlannedCount,
    applySuggestedCount,
  }
}
