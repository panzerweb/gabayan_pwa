<script setup lang="ts">
import { ref } from 'vue'

import AuthPageShell from '@/components/auth/AuthPageShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { forgotPassword } from '@/services/api'

const identifier = ref('')
const error = ref('')
const message = ref('')
const loading = ref(false)

async function submit() {
  error.value = identifier.value.trim() ? '' : 'Enter your email or mobile number.'
  if (error.value) return
  loading.value = true
  try {
    const response = await forgotPassword(identifier.value.trim())
    message.value = response.data.message
  } catch {
    error.value = 'We could not prepare reset instructions. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    eyebrow="Account recovery"
    title="Reset your password"
    message="Enter the email or mobile number connected to your Gabayan account."
  >
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="message" class="form-success" role="status">{{ message }}</p>
      <BaseInput
        v-model="identifier"
        label="Email or mobile number"
        autocomplete="username"
        :error="error"
        required
      />
      <BaseButton type="submit" :loading="loading">Request reset instructions</BaseButton>
      <RouterLink class="text-link back-link" to="/sign-in">Back to sign in</RouterLink>
    </form>
  </AuthPageShell>
</template>

<style scoped>
.back-link {
  justify-self: center;
  font-size: 0.8125rem;
}
</style>
