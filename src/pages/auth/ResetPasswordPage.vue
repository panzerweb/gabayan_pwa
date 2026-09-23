<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import AuthPageShell from '@/components/auth/AuthPageShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { ApiError, resetPassword } from '@/services/api'

const route = useRoute()
const password = ref('')
const confirmPassword = ref('')
const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const message = ref('')
const loading = ref(false)

async function submit() {
  fieldErrors.value = {}
  formError.value = ''
  if (password.value.length < 8) fieldErrors.value.password = 'Use at least 8 characters.'
  if (password.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = 'Passwords must match.'
  }
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) formError.value = 'This reset link is missing a token.'
  if (Object.keys(fieldErrors.value).length || formError.value) return

  loading.value = true
  try {
    const response = await resetPassword(token, password.value, confirmPassword.value)
    message.value = response.data.message
  } catch (error) {
    formError.value =
      error instanceof ApiError ? error.message : 'We could not reset your password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    eyebrow="Choose a new password"
    title="Protect your account"
    message="Use a password you do not use for another service."
  >
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <p v-if="message" class="form-success" role="status">{{ message }}</p>
      <BaseInput
        v-model="password"
        label="New password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.password"
        required
      />
      <BaseInput
        v-model="confirmPassword"
        label="Confirm new password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.confirmPassword"
        required
      />
      <BaseButton v-if="!message" type="submit" :loading="loading">Update password</BaseButton>
      <BaseButton v-else to="/sign-in">Continue to sign in</BaseButton>
    </form>
  </AuthPageShell>
</template>
