import { useMutation } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { apiFieldErrors, describeError } from '@core/errors'
import { zodFieldErrors } from '@core/utils/validation'

import { authKeys } from '../../data/auth.keys'
import { authRepository } from '../../data/auth.repository'
import {
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
  type ResetPasswordRequest,
} from '../../domain/auth.model'
import type { AuthRepository } from '../../domain/auth.repository.interface'

const REQUEST_FAILED = 'We could not prepare reset instructions. Please try again.'
const RESET_FAILED = 'We could not reset your password. Please try again.'
const MISSING_TOKEN = 'This reset link is missing a token. Request a new one.'
const INVALID_TOKEN = 'This reset link is invalid or has expired. Request a new one.'

// Both halves of password recovery: asking for reset instructions, then choosing a new
// password with the token the reset link carries (`?token=`). The server's answer to
// either step is shown as `message`.
export function usePasswordReset(repository: AuthRepository = authRepository) {
  const route = useRoute()

  const identifier = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')
  const message = ref('')

  const request = useMutation({
    mutationKey: authKeys.forgotPassword(),
    mutationFn: (value: string) => repository.forgotPassword(value),
  })
  const reset = useMutation({
    mutationKey: authKeys.resetPassword(),
    mutationFn: (body: ResetPasswordRequest) => repository.resetPassword(body),
  })

  const loading = computed(() => request.isPending.value || reset.isPending.value)

  function resetMessages() {
    fieldErrors.value = {}
    formError.value = ''
  }

  async function requestInstructions() {
    resetMessages()
    const parsed = forgotPasswordFormSchema.safeParse({ identifier: identifier.value })
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    try {
      const response = await request.mutateAsync(parsed.data.identifier)
      message.value = response.data.message
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, REQUEST_FAILED)
    }
  }

  async function updatePassword() {
    resetMessages()
    const parsed = resetPasswordFormSchema.safeParse({
      password: password.value,
      confirmPassword: confirmPassword.value,
    })
    if (!parsed.success) fieldErrors.value = zodFieldErrors(parsed.error)
    const token = typeof route.query.token === 'string' ? route.query.token : ''
    if (!token) formError.value = MISSING_TOKEN
    if (!parsed.success || !token) return

    try {
      const response = await reset.mutateAsync({ token, ...parsed.data })
      message.value = response.data.message
    } catch (error) {
      // The token has no input of its own, so its rejection is said in the form message.
      const { token: tokenError, ...fields } = apiFieldErrors(error)
      fieldErrors.value = fields
      formError.value = tokenError ? INVALID_TOKEN : describeError(error, RESET_FAILED)
    }
  }

  return {
    identifier,
    password,
    confirmPassword,
    fieldErrors,
    formError,
    message,
    loading,
    requestInstructions,
    updatePassword,
  }
}
