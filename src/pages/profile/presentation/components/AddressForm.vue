<script setup lang="ts">
import BaseInput from '@components/ui/BaseInput.vue'

import type { AddressForm } from '../../domain/profile.model'
import ProfileFormFooter from './ProfileFormFooter.vue'

defineProps<{
  fieldErrors: Record<string, string>
  formError: string
  saving: boolean
  online: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const form = defineModel<AddressForm>('form', { required: true })

interface RequiredField {
  field: Exclude<keyof AddressForm, 'deliveryInstructions' | 'isDefault'>
  label: string
  type: 'text' | 'tel'
  inputmode: 'text' | 'tel' | 'numeric'
  autocomplete: string
}

const text = { type: 'text', inputmode: 'text' } as const

const requiredFields: RequiredField[] = [
  { field: 'label', label: 'Address label', ...text, autocomplete: 'off' },
  { field: 'recipientName', label: 'Recipient name', ...text, autocomplete: 'name' },
  {
    field: 'mobileNumber',
    label: 'Mobile number',
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
  },
  { field: 'line1', label: 'Street and building', ...text, autocomplete: 'address-line1' },
  { field: 'barangay', label: 'Barangay', ...text, autocomplete: 'address-level3' },
  {
    field: 'cityMunicipality',
    label: 'City or municipality',
    ...text,
    autocomplete: 'address-level2',
  },
  { field: 'province', label: 'Province', ...text, autocomplete: 'address-level1' },
  { field: 'region', label: 'Region', ...text, autocomplete: 'off' },
  {
    field: 'postalCode',
    label: 'Postal code',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'postal-code',
  },
]
</script>

<template>
  <form class="address-form" novalidate @submit.prevent="emit('submit')">
    <BaseInput
      v-for="item in requiredFields"
      :key="item.field"
      v-model="form[item.field]"
      :name="item.field"
      :label="item.label"
      :type="item.type"
      :inputmode="item.inputmode"
      :autocomplete="item.autocomplete"
      required
      :error="fieldErrors[item.field]"
    />
    <BaseInput
      v-model="form.deliveryInstructions"
      name="deliveryInstructions"
      label="Delivery instructions (optional)"
      :error="fieldErrors.deliveryInstructions"
    />
    <label class="check-row">
      <input v-model="form.isDefault" type="checkbox" />
      <span>Use as default address</span>
    </label>
    <ProfileFormFooter label="Add address" :online="online" :loading="saving" :error="formError" />
  </form>
</template>

<style scoped>
.address-form {
  display: grid;
  gap: var(--space-4);
}
.check-row {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.85rem;
  font-weight: 700;
}
.check-row input {
  width: 1.3rem;
  height: 1.3rem;
  accent-color: var(--color-brand-700);
}
</style>
