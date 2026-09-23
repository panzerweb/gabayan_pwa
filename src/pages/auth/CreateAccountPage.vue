<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'

import AuthPageShell from '@/components/auth/AuthPageShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { ApiError, registerAccount } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { zodFieldErrors } from '@/utils/validation'

const termsVersion = '2026-09'
const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter at least 2 characters.').max(100),
    email: z.string().trim().email('Enter a valid email address.'),
    mobileNumber: z.string().trim().min(1, 'Enter your mobile number.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    acceptedTerms: z.literal(true, { error: 'Accept the terms to continue.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  })

const router = useRouter()
const session = useSessionStore()
const fullName = ref('')
const email = ref('')
const mobileNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptedTerms = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const formError = ref('')
const loading = ref(false)

async function submit() {
  fieldErrors.value = {}
  formError.value = ''
  const parsed = schema.safeParse({
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

  loading.value = true
  try {
    const response = await registerAccount({
      ...parsed.data,
      acceptedTermsVersion: termsVersion,
    })
    session.acceptSession(response.data)
    await router.replace('/setup')
  } catch (error) {
    if (error instanceof ApiError) {
      formError.value = error.message
      for (const [field, messages] of Object.entries(error.fields ?? {})) {
        if (messages[0]) fieldErrors.value[field] = messages[0]
      }
    } else {
      formError.value = 'We could not create your account. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthPageShell
    eyebrow="Your first step"
    title="Create your account"
    message="Save your setup, guidance, and cultivation records in one place."
  >
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <BaseInput
        v-model="fullName"
        label="Full name"
        name="fullName"
        autocomplete="name"
        :error="fieldErrors.fullName"
        required
      />
      <BaseInput
        v-model="email"
        label="Email address"
        name="email"
        type="email"
        inputmode="email"
        autocomplete="email"
        :error="fieldErrors.email"
        required
      />
      <BaseInput
        v-model="mobileNumber"
        label="Mobile number"
        name="mobileNumber"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="09XX XXX XXXX"
        :error="fieldErrors.mobileNumber"
        required
      />
      <BaseInput
        v-model="password"
        label="Password"
        name="password"
        type="password"
        autocomplete="new-password"
        hint="Use at least 8 characters."
        :error="fieldErrors.password"
        required
      />
      <BaseInput
        v-model="confirmPassword"
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.confirmPassword"
        required
      />
      <label class="checkbox-row">
        <input v-model="acceptedTerms" type="checkbox" />
        <span>I agree to the demo terms and understand that biological guidance is estimated.</span>
      </label>
      <p v-if="fieldErrors.acceptedTerms" class="field-message" role="alert">
        {{ fieldErrors.acceptedTerms }}
      </p>
      <BaseButton type="submit" :loading="loading">Create account</BaseButton>
    </form>
    <template #footer>
      Already have an account? <RouterLink to="/sign-in">Sign in</RouterLink>
    </template>
  </AuthPageShell>
</template>

<style scoped>
.field-message {
  margin: calc(var(--space-3) * -1) 0 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
  font-weight: 650;
}
</style>
