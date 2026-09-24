<script setup lang="ts">
import BaseInput from '@components/ui/BaseInput.vue'

defineProps<{ errors: Record<string, string> }>()

const fullName = defineModel<string>('fullName', { required: true })
const mobileNumber = defineModel<string>('mobileNumber', { required: true })
const email = defineModel<string>('email', { required: true })
</script>

<template>
  <section class="checkout-contact" aria-labelledby="contact-heading">
    <h2 id="contact-heading">Contact details</h2>
    <BaseInput
      v-model="fullName"
      name="fullName"
      label="Full name"
      autocomplete="name"
      required
      :error="errors.fullName"
    />
    <BaseInput
      v-model="mobileNumber"
      name="mobileNumber"
      label="Mobile number"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      required
      :error="errors.mobileNumber"
    />
    <BaseInput
      v-model="email"
      name="email"
      label="Email address"
      type="email"
      inputmode="email"
      autocomplete="email"
      required
      :error="errors.email"
    />
  </section>
</template>

<style scoped>
.checkout-contact {
  display: grid;
  gap: var(--space-3);
}
.checkout-contact h2 {
  margin: 0 0 var(--space-1);
  font-size: 1rem;
}
</style>
