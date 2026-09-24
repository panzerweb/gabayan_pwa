import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'
import { invalidateAfter } from '@core/query'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { cultivationsRepository } from '../../data/cultivations.repository'
import {
  TASK_COMPLETION_OFFLINE_MESSAGE,
  feedingAmountError,
  feedingCompletionRequest,
  type CompleteTaskRequest,
  type FarmTask,
} from '../../domain/cultivations.model'
import type { CultivationsRepository } from '../../domain/cultivations.repository.interface'

const SAVE_FAILED = 'We couldn’t save this feeding. Please try again.'

// Home still keys its dashboard as `home-dashboard` rather than under the `home` prefix of
// `@core/query` until it moves onto the feature layout, so it is refreshed by name here.
const LEGACY_HOME_KEY = ['home-dashboard'] as const

type Completion = { taskId: string; body: CompleteTaskRequest; idempotencyKey: string }

// Records a feeding task as done. `begin(task)` starts one submission with its own
// Idempotency-Key; a retry after a failure reuses that key, so a lost answer can never
// record the feeding twice. The screen updates from the server's answer, and nothing is
// sent while offline.
export function useCompleteTask(repository: CultivationsRepository = cultivationsRepository) {
  const session = useSessionStore()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const { isOnline } = useOnlineStatus()

  const task = ref<FarmTask | null>(null)
  const amount = ref('')
  const notes = ref('')
  const amountError = ref('')
  const formError = ref('')
  let idempotencyKey = crypto.randomUUID()

  const unit = computed(() => task.value?.recommendedAmount?.unit ?? 'KG')

  const mutation = useMutation({
    mutationFn: ({ taskId, body, idempotencyKey: key }: Completion) =>
      repository.completeTask(taskId, body, key, session.accessToken ?? ''),
  })

  function begin(next: FarmTask) {
    task.value = next
    amount.value = String(next.recommendedAmount?.value ?? '')
    notes.value = ''
    amountError.value = ''
    formError.value = ''
    idempotencyKey = crypto.randomUUID()
  }

  // Resolves true once the server has recorded the feeding.
  async function submit(): Promise<boolean> {
    amountError.value = ''
    formError.value = ''
    const current = task.value
    if (!current) return false
    const invalid = feedingAmountError(amount.value)
    if (invalid) {
      amountError.value = invalid
      return false
    }
    if (!isOnline.value) {
      formError.value = TASK_COMPLETION_OFFLINE_MESSAGE
      return false
    }
    try {
      await mutation.mutateAsync({
        taskId: current.id,
        body: feedingCompletionRequest(
          Number(amount.value),
          unit.value,
          notes.value,
          new Date().toISOString(),
        ),
        idempotencyKey,
      })
    } catch (error) {
      const fieldMessage = apiFieldErrors(error).actualAmount
      if (fieldMessage) amountError.value = fieldMessage
      else formError.value = describeError(error, SAVE_FAILED)
      return false
    }
    await Promise.all([
      invalidateAfter(queryClient, 'taskComplete'),
      queryClient.invalidateQueries({ queryKey: LEGACY_HOME_KEY }),
    ])
    toast.show('Feeding record saved.', 'success')
    return true
  }

  return {
    task,
    amount,
    notes,
    unit,
    amountError,
    formError,
    isOnline,
    saving: computed(() => mutation.isPending.value),
    begin,
    submit,
  }
}
