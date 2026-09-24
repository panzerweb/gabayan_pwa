<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import { ROUTE_NAMES } from '@router/route-names'

import AuthPageShell from '../components/AuthPageShell.vue'
import { useCreateAccount } from '../composables/useCreateAccount'

const {
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
} = useCreateAccount()
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
      Already have an account?
      <RouterLink :to="{ name: ROUTE_NAMES.signIn }">Sign in</RouterLink>
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
