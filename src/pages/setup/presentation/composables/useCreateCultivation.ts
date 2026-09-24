import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { invalidateAfter } from '@core/query'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'

import { setupRepository } from '../../data/setup.repository'
import {
  SETUP_OFFLINE_MESSAGES,
  canReviewEstimate,
  createCultivationRequest,
  type CreateCultivationRequest,
  type CultivationDetailsForm,
  type FormErrors,
} from '../../domain/setup.model'
import type { SetupRepository } from '../../domain/setup.repository.interface'
import { useSetupStore } from '../stores/setup.store'

const CREATE_FAILED = 'We couldn’t create the cultivation. Please try again.'
const ABOVE_RANGE_UNCONFIRMED =
  'Confirm the above-range warning on the estimate before creating this cultivation.'

// Creates the cultivation from the reviewed estimate. One visit to the review screen is one
// submission with one Idempotency-Key: a retry after a failure reuses it, so a lost answer can
// never create the cultivation twice. An above-range plan is sent only with the farmer's
// explicit confirmation, and nothing is sent while offline.
export function useCreateCultivation(repository: SetupRepository = setupRepository) {
  const setup = useSetupStore()
  const session = useSessionStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const form = reactive<CultivationDetailsForm>({
    cultivationName: setup.draft.cultivationName,
    stockedOn: setup.draft.stockedOn ?? '',
    aboveRangeReason: '',
  })
  const fieldErrors = ref<FormErrors>({})
  const formError = ref('')
  const idempotencyKey = crypto.randomUUID()

  const mutation = useMutation({
    mutationFn: (body: CreateCultivationRequest) =>
      repository.createCultivation(body, idempotencyKey, session.accessToken ?? ''),
  })

  const estimate = computed(() => setup.draft.estimate)

  // Resolves true once the cultivation exists and the success screen is open.
  async function submit(): Promise<boolean> {
    fieldErrors.value = {}
    formError.value = ''
    const current = estimate.value
    if (!current) return false
    if (!canReviewEstimate(current, setup.draft.acceptedAboveRangeWarning)) {
      formError.value = ABOVE_RANGE_UNCONFIRMED
      return false
    }
    if (!isOnline.value) {
      formError.value = SETUP_OFFLINE_MESSAGES.create
      return false
    }
    // Kept in the draft so a failed attempt or a reload does not lose what was typed.
    setup.saveCultivationDetails({
      cultivationName: form.cultivationName.trim(),
      stockedOn: form.stockedOn || null,
    })
    let cultivationId: string
    try {
      const response = await mutation.mutateAsync(
        createCultivationRequest(current, form, setup.draft.acceptedAboveRangeWarning),
      )
      cultivationId = response.data.id
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, CREATE_FAILED)
      return false
    }
    session.markCultivationCreated()
    await invalidateAfter(queryClient, 'cultivationCreate')
    await router.replace({ name: ROUTE_NAMES.setupSuccess, params: { cultivationId } })
    return true
  }

  return {
    estimate,
    form,
    fieldErrors,
    formError,
    isOnline,
    creating: computed(() => mutation.isPending.value),
    submit,
  }
}
