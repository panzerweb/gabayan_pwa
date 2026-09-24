<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import { ROUTE_NAMES } from '@router/route-names'

import AuthPageShell from '../components/AuthPageShell.vue'
import { useSignIn } from '../composables/useSignIn'

const {
  identifier,
  password,
  fieldErrors,
  formError,
  loading,
  googleLoading,
  submit,
  continueWithGoogleDemo,
} = useSignIn()
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
      <RouterLink class="text-link forgot-link" :to="{ name: ROUTE_NAMES.forgotPassword }">
        Forgot password?
      </RouterLink>
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
      New to Gabayan?
      <RouterLink :to="{ name: ROUTE_NAMES.createAccount }">Create an account</RouterLink>
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
