<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import { ROUTE_NAMES } from '@router/route-names'

import AuthPageShell from '../components/AuthPageShell.vue'
import { usePasswordReset } from '../composables/usePasswordReset'

const { identifier, fieldErrors, formError, message, loading, requestInstructions } =
  usePasswordReset()
</script>

<template>
  <AuthPageShell
    eyebrow="Account recovery"
    title="Reset your password"
    message="Enter the email or mobile number connected to your Gabayan account."
  >
    <form class="form-stack" novalidate @submit.prevent="requestInstructions">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <p v-if="message" class="form-success" role="status">{{ message }}</p>
      <BaseInput
        v-model="identifier"
        label="Email or mobile number"
        name="identifier"
        autocomplete="username"
        :error="fieldErrors.identifier"
        required
      />
      <BaseButton type="submit" :loading="loading">Request reset instructions</BaseButton>
      <RouterLink class="text-link back-link" :to="{ name: ROUTE_NAMES.signIn }">
        Back to sign in
      </RouterLink>
    </form>
  </AuthPageShell>
</template>

<style scoped>
.back-link {
  justify-self: center;
  font-size: 0.8125rem;
}
</style>
