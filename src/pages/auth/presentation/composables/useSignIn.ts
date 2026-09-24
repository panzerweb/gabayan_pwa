import { useMutation } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { apiFieldErrors, describeError } from '@core/errors'
import type { Envelope } from '@core/http'
import { zodFieldErrors } from '@core/utils/validation'
import { ROUTE_NAMES } from '@router/route-names'
import { useSessionStore } from '@stores/session.store'
import { useToastStore } from '@stores/toast.store'

import { authKeys } from '../../data/auth.keys'
import { authRepository } from '../../data/auth.repository'
import {
  DEMO_GOOGLE_ID_TOKEN,
  redirectPathFrom,
  signInFormSchema,
  type AuthSession,
  type LoginRequest,
} from '../../domain/auth.model'
import type { AuthRepository } from '../../domain/auth.repository.interface'

const SIGN_IN_FAILED = 'We could not sign you in. Please try again.'

// Sign-in form state, the password and demo Google sign-ins, and where the farmer lands:
// the page they were sent away from when it is a known route, otherwise Home or setup.
export function useSignIn(repository: AuthRepository = authRepository) {
  const router = useRouter()
  const route = useRoute()
  const session = useSessionStore()
  const toast = useToastStore()

  const identifier = ref('')
  const password = ref('')
  const fieldErrors = ref<Record<string, string>>({})
  const formError = ref('')

  const login = useMutation({
    mutationKey: authKeys.login(),
    mutationFn: (body: LoginRequest) => repository.login(body),
  })
  const google = useMutation({
    mutationKey: authKeys.google(),
    mutationFn: () => repository.loginWithGoogle(DEMO_GOOGLE_ID_TOKEN),
  })

  const loading = computed(() => login.isPending.value)
  const googleLoading = computed(() => google.isPending.value)

  function resetMessages() {
    fieldErrors.value = {}
    formError.value = ''
  }

  function showFailure(error: unknown) {
    fieldErrors.value = apiFieldErrors(error)
    formError.value = describeError(error, SIGN_IN_FAILED)
  }

  function destination(): RouteLocationRaw {
    const redirect = redirectPathFrom(route.query.redirect)
    if (redirect) {
      const target = router.resolve(redirect)
      if (target.name && target.name !== ROUTE_NAMES.notFound) {
        return { name: target.name, params: target.params, query: target.query, hash: target.hash }
      }
    }
    return { name: session.suggestedRouteName }
  }

  async function enter(response: Envelope<AuthSession>) {
    session.acceptSession(response.data)
    const firstName = response.data.user.fullName.trim().split(/\s+/)[0]
    toast.show(`Welcome back, ${firstName}.`, 'success')
    await router.replace(destination())
  }

  async function submit() {
    resetMessages()
    const parsed = signInFormSchema.safeParse({
      identifier: identifier.value,
      password: password.value,
    })
    if (!parsed.success) {
      fieldErrors.value = zodFieldErrors(parsed.error)
      return
    }
    let response: Envelope<AuthSession>
    try {
      response = await login.mutateAsync(parsed.data)
    } catch (error) {
      showFailure(error)
      return
    }
    await enter(response)
  }

  async function continueWithGoogleDemo() {
    resetMessages()
    let response: Envelope<AuthSession>
    try {
      response = await google.mutateAsync()
    } catch (error) {
      showFailure(error)
      return
    }
    await enter(response)
  }

  return {
    identifier,
    password,
    fieldErrors,
    formError,
    loading,
    googleLoading,
    submit,
    continueWithGoogleDemo,
  }
}
