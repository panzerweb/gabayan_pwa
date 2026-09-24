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
  growthFormErrors,
  growthMeasurementRequest,
  type CreateGrowthMeasurementRequest,
  type GrowthForm,
} from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'
import { useRecordWrite } from './useRecordWrite'

// Records a growth sample. The server answers with the recalculated feeding plan and harvest
// readiness, so the detail, growth, feed, readiness and Home queries are refreshed after it.
export function useRecordGrowth(
  cultivationId: Ref<string>,
  repository: CultivationsRepository = cultivationsRepository,
) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const form = reactive<GrowthForm>({
    measuredOn: '',
    numberOfFishSampled: '',
    averageWeight: '',
    notes: '',
  })

  const write = useRecordWrite(
    (body: CreateGrowthMeasurementRequest, key: string) =>
      repository.createGrowthMeasurement(cultivationId.value, body, key, session.accessToken ?? ''),
    { offline: RECORD_OFFLINE_MESSAGES.growth, failed: 'We couldn’t save this growth record.' },
  )

  function begin() {
    Object.assign(form, {
      measuredOn: manilaDateToday(),
      numberOfFishSampled: '10',
      averageWeight: '',
      notes: '',
    })
    write.begin()
  }

  // Resolves true once the server has saved the sample.
  async function submit(): Promise<boolean> {
    write.fieldErrors.value = growthFormErrors(form)
    if (Object.keys(write.fieldErrors.value).length) return false
    const result = await write.submit(growthMeasurementRequest(form))
    if (!result) return false
    await Promise.all([
      invalidateAfter(queryClient, 'growthCreate'),
      queryClient.invalidateQueries({ queryKey: LEGACY_HOME_KEY }),
    ])
    toast.show('Growth record saved.', 'success')
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
