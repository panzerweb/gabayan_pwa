<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import { ROUTE_NAMES } from '@router/route-names'

import AuthPageShell from '../components/AuthPageShell.vue'
import { usePasswordReset } from '../composables/usePasswordReset'

const { password, confirmPassword, fieldErrors, formError, message, loading, updatePassword } =
  usePasswordReset()
</script>

<template>
  <AuthPageShell
    eyebrow="Choose a new password"
    title="Protect your account"
    message="Use a password you do not use for another service."
  >
    <form class="form-stack" novalidate @submit.prevent="updatePassword">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <p v-if="message" class="form-success" role="status">{{ message }}</p>
      <BaseInput
        v-model="password"
        label="New password"
        name="password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.password"
        required
      />
      <BaseInput
        v-model="confirmPassword"
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.confirmPassword"
        required
      />
      <BaseButton v-if="!message" type="submit" :loading="loading">Update password</BaseButton>
      <BaseButton v-else :to="{ name: ROUTE_NAMES.signIn }">Continue to sign in</BaseButton>
      <RouterLink
        v-if="formError && !message"
        class="text-link request-link"
        :to="{ name: ROUTE_NAMES.forgotPassword }"
      >
        Request a new reset link
      </RouterLink>
    </form>
  </AuthPageShell>
</template>

<style scoped>
.request-link {
  justify-self: center;
  font-size: 0.8125rem;
}
</style>
