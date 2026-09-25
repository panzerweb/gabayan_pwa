import { useQueryClient } from '@tanstack/vue-query'
import { reactive, type Ref } from 'vue'

import { invalidateAfter } from '@core/query'
import { manilaDateToday } from '@core/utils/format'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { cultivationsRepository } from '../../data/cultivations.repository'
import {
  RECORD_OFFLINE_MESSAGES,
  harvestFormErrors,
  harvestRequest,
  type CreateHarvestRequest,
  type HarvestCompletion,
  type HarvestForm,
} from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'
import { useRecordWrite } from './useRecordWrite'

// Records a completed harvest, which closes the cultivation. The form opens as one submission
// with its own Idempotency-Key, so a retry after a lost answer cannot record the harvest twice.
// Revenue and the completion summary come from the server's answer.
export function useCompleteHarvest(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const form = reactive<HarvestForm>({
    harvestDate: manilaDateToday(),
    numberHarvested: '',
    totalHarvestWeight: '',
    averageFishWeight: '',
    sellingPricePerKg: '',
    notes: '',
  })

  const write = useRecordWrite(
    (body: CreateHarvestRequest, key: string) =>
      repository.completeHarvest(cultivationId.value, body, key, session.accessToken ?? ''),
    { offline: RECORD_OFFLINE_MESSAGES.harvest, failed: 'We couldn’t record the harvest.' },
  )

  // Resolves to the completed cultivation and its summary, or null when nothing was saved.
  async function submit(): Promise<HarvestCompletion | null> {
    write.fieldErrors.value = harvestFormErrors(form)
    if (Object.keys(write.fieldErrors.value).length) return null
    const result = await write.submit(harvestRequest(form))
    if (!result) return null
    await invalidateAfter(queryClient, 'harvestCreate')
    toast.show('Harvest recorded. Cultivation moved to Completed.', 'success')
    return result.data
  }

  return {
    form,
    fieldErrors: write.fieldErrors,
    formError: write.formError,
    isOnline: write.isOnline,
    saving: write.saving,
    submit,
  }
}
