import { useQueryClient } from '@tanstack/vue-query'
import { reactive, type Ref } from 'vue'

import { invalidateAfter } from '@core/query'
import { manilaDateToday } from '@core/utils/format'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { LEGACY_HOME_KEY } from '../../data/cultivations.keys'
import { cultivationsRepository } from '../../data/cultivations.repository'
import {
  RECORD_OFFLINE_MESSAGES,
  waterCheckFormErrors,
  waterCheckRequest,
  type CreateWaterCheckRequest,
  type WaterCheckForm,
} from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'
import { useRecordWrite } from './useRecordWrite'

function blankForm(): WaterCheckForm {
  return {
    checkedOn: manilaDateToday(),
    clarity: 'Clear',
    odor: 'Normal',
    fishBehavior: 'Active and feeding normally',
    unusualChanges: false,
    actionTaken: '',
    notes: '',
  }
}

// Records a qualitative water observation. The server answers with conditional guidance,
// whose first title becomes the success toast, and may add follow-up tasks.
export function useRecordWaterCheck(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const form = reactive<WaterCheckForm>(blankForm())

  const write = useRecordWrite(
    (body: CreateWaterCheckRequest, key: string) =>
      repository.createWaterCheck(cultivationId.value, body, key, session.accessToken ?? ''),
    { offline: RECORD_OFFLINE_MESSAGES.waterCheck, failed: 'We couldn’t save this check.' },
  )

  function begin() {
    Object.assign(form, blankForm())
    write.begin()
  }

  // Resolves true once the server has saved the check.
  async function submit(): Promise<boolean> {
    write.fieldErrors.value = waterCheckFormErrors(form)
    if (Object.keys(write.fieldErrors.value).length) return false
    const result = await write.submit(waterCheckRequest(form))
    if (!result) return false
    await Promise.all([
      invalidateAfter(queryClient, 'waterCheckCreate'),
      queryClient.invalidateQueries({ queryKey: LEGACY_HOME_KEY }),
    ])
    toast.show(result.data.guidance[0]?.title ?? 'Water check saved.', 'success')
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
