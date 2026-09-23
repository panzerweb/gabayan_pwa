<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'

import AuthPageShell from '@/components/auth/AuthPageShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { ApiError, login, loginWithGoogle } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { zodFieldErrors } from '@/utils/validation'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or mobile number.'),
  password: z.string().min(1, 'Enter your password.'),
})

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const identifier = ref('')
const password = ref('')
const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const loading = ref(false)
const googleLoading = ref(false)

function setApiError(error: unknown) {
  if (error instanceof ApiError) {
    formError.value = error.message
    for (const [field, messages] of Object.entries(error.fields ?? {})) {
      if (messages[0]) fieldErrors.value[field] = messages[0]
    }
  } else {
    formError.value = 'We could not sign you in. Please try again.'
  }
}

async function submit() {
  fieldErrors.value = {}
  formError.value = ''
  const parsed = schema.safeParse({ identifier: identifier.value, password: password.value })
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    return
  }
  loading.value = true
  try {
    const response = await login(parsed.data)
    session.acceptSession(response.data)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await router.replace(
      redirect.startsWith('/') ? redirect : response.data.onboarding.suggestedRoute,
    )
  } catch (error) {
    setApiError(error)
  } finally {
    loading.value = false
  }
}

async function continueWithGoogleDemo() {
  formError.value = ''
  googleLoading.value = true
  try {
    const response = await loginWithGoogle('demo-google-token')
    session.acceptSession(response.data)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await router.replace(
      redirect.startsWith('/') ? redirect : response.data.onboarding.suggestedRoute,
    )
  } catch (error) {
    setApiError(error)
  } finally {
    googleLoading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    eyebrow="Welcome back"
    title="Sign in to Gabayan"
    message="Continue caring for your cultivation with your saved guidance and records."
  >
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <BaseInput
        v-model="identifier"
        label="Email or mobile number"
        name="identifier"
        autocomplete="username"
        inputmode="email"
        :error="fieldErrors.identifier"
        required
      />
      <BaseInput
        v-model="password"
        label="Password"
        name="password"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
        required
      />
      <RouterLink class="text-link forgot-link" to="/forgot-password">Forgot password?</RouterLink>
      <BaseButton type="submit" :loading="loading">Sign in</BaseButton>
      <div class="auth-divider">or</div>
      <BaseButton
        type="button"
        variant="secondary"
        :loading="googleLoading"
        @click="continueWithGoogleDemo"
      >
        Continue with Google (demo)
      </BaseButton>
      <p class="demo-credentials">
        Demo account: <strong>juan@example.com</strong> / <strong>Gabayan123!</strong>
      </p>
    </form>
    <template #footer>
      New to Gabayan? <RouterLink to="/create-account">Create an account</RouterLink>
    </template>
  </AuthPageShell>
</template>

<style scoped>
.forgot-link {
  justify-self: end;
  margin-top: calc(var(--space-2) * -1);
  font-size: 0.8125rem;
}

.demo-credentials {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
  text-align: center;
}
</style>
