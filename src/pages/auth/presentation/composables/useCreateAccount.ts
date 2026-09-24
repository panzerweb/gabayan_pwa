import { useMutation } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { apiFieldErrors, describeError } from '@core/errors'
import type { Envelope } from '@core/http'
import { zodFieldErrors } from '@core/utils/validation'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { authKeys } from '../../data/auth.keys'
import { authRepository } from '../../data/auth.repository'
import {
  TERMS_VERSION,
  createAccountFormSchema,
  type AuthSession,
  type RegisterRequest,
} from '../../domain/auth.model'
import type { AuthRepository } from '../../domain/auth.repository.interface'

const CREATE_ACCOUNT_FAILED = 'We could not create your account. Please try again.'

// Create-account form state and registration. A new account goes on to choose its plan,
// then to setup.
export function useCreateAccount(repository: AuthRepository = authRepository) {
  const router = useRouter()
  const session = useSessionStore()
  const toast = useToastStore()

  const fullName = ref('')
  const email = ref('')
  const mobileNumber = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const acceptedTerms = ref(false)
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')

  const register = useMutation({
    mutationKey: authKeys.register(),
    mutationFn: (body: RegisterRequest) => repository.register(body),
  })

  const loading = computed(() => register.isPending.value)

  async function submit() {
    fieldErrors.value = {}
    formError.value = ''
    const parsed = createAccountFormSchema.safeParse({
      fullName: fullName.value,
      email: email.value,
      mobileNumber: mobileNumber.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      acceptedTerms: acceptedTerms.value,
    })
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }

    let response: Envelope<AuthSession>
    try {
      response = await register.mutateAsync({
        ...parsed.data,
        acceptedTermsVersion: TERMS_VERSION,
      })
    } catch (error) {
      fieldErrors.value = apiFieldErrors(error)
      formError.value = describeError(error, CREATE_ACCOUNT_FAILED)
      return
    }
    session.acceptSession(response.data)
    toast.show('Your account is ready.', 'success')
    await router.replace({ name: ROUTE_NAMES.setupPlan })
  }

  return {
    fullName,
    email,
    mobileNumber,
    password,
    confirmPassword,
    acceptedTerms,
    fieldErrors,
    formError,
    loading,
    submit,
  }
}
