<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'

import { addressSummary } from '../../domain/profile.model'
import { useAddresses } from '../composables/useAddresses'
import AddressForm from './AddressForm.vue'
import ProfileSectionHeading from './ProfileSectionHeading.vue'

const {
  addresses,
  loading,
  loadFailed,
  refetch,
  adding,
  form,
  fieldErrors,
  formError,
  saving,
  actionError,
  pendingAddressId,
  isOnline,
  open,
  close,
  save,
  makeDefault,
  remove,
} = useAddresses()
</script>

<template>
  <section class="profile-section">
    <ProfileSectionHeading eyebrow="Delivery" title="Addresses">
      <template #action>
        <BaseButton variant="text" :disabled="loading || loadFailed" @click="open">Add</BaseButton>
      </template>
    </ProfileSectionHeading>
    <p v-if="actionError" class="form-error" role="alert">{{ actionError }}</p>
    <LoadingState v-if="loading" compact label="Loading addresses…" />
    <ErrorState v-else-if="loadFailed" @retry="refetch()" />
    <EmptyState
      v-else-if="!addresses.length"
      title="No addresses"
      message="Add an address before checking out."
    />
    <BaseCard
      v-for="address in addresses"
      v-else
      :key="address.id"
      class="address-card"
      padding="md"
    >
      <div class="address-card__title">
        <h3>{{ address.label }}</h3>
        <StatusChip v-if="address.isDefault" label="Default" tone="success" />
      </div>
      <p>{{ addressSummary(address) }}</p>
      <div v-if="!address.isDefault" class="address-card__actions">
        <BaseButton
          variant="text"
          :disabled="!isOnline || pendingAddressId !== null"
          :loading="pendingAddressId === address.id"
          @click="makeDefault(address)"
          >Make default</BaseButton
        >
        <BaseButton
          variant="text"
          :disabled="!isOnline || pendingAddressId !== null"
          :loading="pendingAddressId === address.id"
          @click="remove(address)"
          >Remove</BaseButton
        >
      </div>
    </BaseCard>

    <BaseModal :open="adding" variant="sheet" title="Add delivery address" @close="close">
      <AddressForm
        v-model:form="form"
        :field-errors="fieldErrors"
        :form-error="formError"
        :saving="saving"
        :online="isOnline"
        @submit="save"
      />
    </BaseModal>
  </section>
</template>

<style scoped>
.profile-section {
  display: grid;
  gap: var(--space-4);
}
.form-error {
  margin: 0;
}
.address-card {
  display: grid;
  gap: var(--space-2);
}
.address-card h3,
.address-card p {
  margin: 0;
}
.address-card p {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
.address-card__title,
.address-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.address-card__actions {
  justify-content: flex-end;
}
</style>
