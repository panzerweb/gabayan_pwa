import { useMutation } from '@tanstack/vue-query'
import { computed, reactive, ref, type Ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { useSessionStore } from '@stores/session.store'

import { waterQualityRepository } from '../../data/water-quality.repository'
import {
  SAFETY_CHECK_OFFLINE_MESSAGE,
  emptyReadingsForm,
  parseReadingsForm,
  type WaterSafetyCheck,
  type WaterSafetyCheckRequest,
  type WaterReadingsForm,
} from '../../domain/water-quality.model'
import type { WaterQualityRepository } from '../../domain/water-quality.repository.interface'

const CHECK_FAILED = 'We couldn’t check these readings. Please try again.'

// A one-off check of typed water readings against the suggested ranges. The server answers
// per reading and stores nothing, so there is no cache to refresh afterwards.
export function useSafetyCheck(
  speciesId: Ref<string>,
  environmentId: Ref<string>,
  repository: WaterQualityRepository = waterQualityRepository,
) {
  const session = useSessionStore()
  const { isOnline } = useOnlineStatus()

  const form = reactive<WaterReadingsForm>(emptyReadingsForm())
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')
  const result = ref<WaterSafetyCheck | null>(null)

  const mutation = useMutation({
    mutationFn: (body: WaterSafetyCheckRequest) =>
      repository.createWaterSafetyCheck(body, session.accessToken ?? ''),
  })

  // Resolves true once the server has answered with a result.
  async function submit(): Promise<boolean> {
    formError.value = ''
    const parsed = parseReadingsForm(form)
    fieldErrors.value = parsed.fieldErrors
    if (Object.keys(parsed.fieldErrors).length) return false
    if (!isOnline.value) {
      formError.value = SAFETY_CHECK_OFFLINE_MESSAGE
      return false
    }
    try {
      const response = await mutation.mutateAsync({
        speciesId: speciesId.value,
        environmentId: environmentId.value,
        readings: parsed.readings,
      })
      result.value = response.data
      return true
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, CHECK_FAILED)
      return false
    }
  }

  // Clears the readings and the last result for a new check.
  function reset() {
    Object.assign(form, emptyReadingsForm())
    fieldErrors.value = {}
    formError.value = ''
    result.value = null
  }

  return {
    form,
    fieldErrors,
    formError,
    result,
    isOnline,
    checking: computed(() => mutation.isPending.value),
    submit,
    reset,
  }
}
