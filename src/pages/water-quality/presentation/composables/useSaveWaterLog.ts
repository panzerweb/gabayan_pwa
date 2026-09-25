import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, reactive, ref, type Ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { invalidateAfter } from '@core/query'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { waterQualityRepository } from '../../data/water-quality.repository'
import {
  WATER_LOG_OFFLINE_MESSAGE,
  emptyReadingsForm,
  parseWaterLogForm,
  type CreateWaterParameterLogRequest,
  type WaterReadingsForm,
} from '../../domain/water-quality.model'
import type { WaterQualityRepository } from '../../domain/water-quality.repository.interface'

const SAVE_FAILED = 'We couldn’t save this reading. Please try again.'

// Saves one set of water readings to a cultivation's log (Pro). `begin()` starts a new
// submission with its own Idempotency-Key; a retry after a failure reuses it, so a lost
// answer never stores the reading twice. Nothing is sent or queued while offline.
export function useSaveWaterLog(
  cultivationId: Ref<string>,
  repository: WaterQualityRepository = waterQualityRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const form = reactive<WaterReadingsForm>(emptyReadingsForm())
  const notes = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')
  let idempotencyKey = crypto.randomUUID()

  const mutation = useMutation({
    mutationFn: ({ body, key }: { body: CreateWaterParameterLogRequest; key: string }) =>
      repository.createWaterParameterLog(cultivationId.value, body, key, session.accessToken ?? ''),
  })

  function begin() {
    Object.assign(form, emptyReadingsForm())
    notes.value = ''
    fieldErrors.value = {}
    formError.value = ''
    idempotencyKey = crypto.randomUUID()
  }

  // Resolves true once the server has saved the reading.
  async function submit(): Promise<boolean> {
    formError.value = ''
    const parsed = parseWaterLogForm(form, notes.value)
    fieldErrors.value = parsed.fieldErrors
    if (!parsed.body) return false
    if (!isOnline.value) {
      formError.value = WATER_LOG_OFFLINE_MESSAGE
      return false
    }
    try {
      await mutation.mutateAsync({ body: parsed.body, key: idempotencyKey })
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, SAVE_FAILED)
      return false
    }
    await invalidateAfter(queryClient, 'waterLogCreate')
    toast.show('Water reading saved.', 'success')
    return true
  }

  return {
    form,
    notes,
    fieldErrors,
    formError,
    isOnline,
    saving: computed(() => mutation.isPending.value),
    begin,
    submit,
  }
}
