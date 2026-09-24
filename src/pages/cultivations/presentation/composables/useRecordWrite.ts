import { useMutation } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import { apiFieldErrors, describeError } from '@core/errors'

import type { FormErrors } from '../../domain/cultivations.model'

type Send<TBody, TResult> = (body: TBody, idempotencyKey: string) => Promise<TResult>

interface Messages {
  // Shown instead of sending while offline; high-impact records are never queued.
  offline: string
  // Shown when a failure says nothing more specific.
  failed: string
}

// The submission plumbing every record form shares. `begin()` starts a new submission with
// its own Idempotency-Key; a retry after a failure reuses that key, so a lost answer can never
// save the record twice. `send()` refuses while offline, and on failure fills `fieldErrors`
// from the contract's camelCase `fields` and `formError` with one readable sentence.
export function useRecordWrite<TBody, TResult>(send: Send<TBody, TResult>, messages: Messages) {
  const { isOnline } = useOnlineStatus()
  const fieldErrors = ref<FormErrors>({})
  const formError = ref('')
  let idempotencyKey = crypto.randomUUID()

  const mutation = useMutation({
    mutationFn: ({ body, key }: { body: TBody; key: string }) => send(body, key),
  })

  function begin() {
    fieldErrors.value = {}
    formError.value = ''
    idempotencyKey = crypto.randomUUID()
  }

  // Resolves to the server's answer, or null when nothing was saved.
  async function submit(body: TBody): Promise<TResult | null> {
    formError.value = ''
    if (!isOnline.value) {
      formError.value = messages.offline
      return null
    }
    try {
      return await mutation.mutateAsync({ body, key: idempotencyKey })
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, messages.failed)
      return null
    }
  }

  return {
    isOnline,
    fieldErrors,
    formError,
    saving: computed(() => mutation.isPending.value),
    begin,
    submit,
  }
}
