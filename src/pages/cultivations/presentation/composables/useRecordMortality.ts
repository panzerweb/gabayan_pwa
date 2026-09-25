import { useQueryClient } from '@tanstack/vue-query'
import { reactive, type Ref } from 'vue'

import { invalidateAfter } from '@core/query'
import { formatQuantity, manilaDateToday } from '@core/utils/format'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { cultivationsRepository } from '../../data/cultivations.repository'
import {
  RECORD_OFFLINE_MESSAGES,
  mortalityFormErrors,
  mortalityRequest,
  type CreateMortalityRequest,
  type MortalityForm,
} from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'
import { useRecordWrite } from './useRecordWrite'

// Records observed losses. The server answers with the new live-fish estimate, which the
// success toast repeats, and recalculates the feeding plan and readiness.
export function useRecordMortality(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const form = reactive<MortalityForm>({
    occurredOn: '',
    fishCount: '',
    reason: 'UNKNOWN',
    notes: '',
  })

  const write = useRecordWrite(
    (body: CreateMortalityRequest, key: string) =>
      repository.createMortalityRecord(cultivationId.value, body, key, session.accessToken ?? ''),
    { offline: RECORD_OFFLINE_MESSAGES.mortality, failed: 'We couldn’t save this record.' },
  )

  function begin() {
    Object.assign(form, {
      occurredOn: manilaDateToday(),
      fishCount: '',
      reason: 'UNKNOWN',
      notes: '',
    })
    write.begin()
  }

  // Resolves true once the server has saved the record.
  async function submit(): Promise<boolean> {
    write.fieldErrors.value = mortalityFormErrors(form)
    if (Object.keys(write.fieldErrors.value).length) return false
    const result = await write.submit(mortalityRequest(form))
    if (!result) return false
    await invalidateAfter(queryClient, 'mortalityCreate')
    const liveFish = formatQuantity(result.data.stock.estimatedLiveFish, 'COUNT')
    toast.show(`Mortality saved. Estimated live fish: ${liveFish}.`, 'success')
    return true
  }

  return {
    form,
    fieldErrors: write.fieldErrors,
    formError: write.formError,
    isOnline: write.isOnline,
    saving: write.saving,
    begin,
    submit,
  }
}
