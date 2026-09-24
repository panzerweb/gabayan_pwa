<script setup lang="ts">
import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import { useProfileDetails } from '../composables/useProfileDetails'
import ProfileFormFooter from './ProfileFormFooter.vue'
import ProfileSectionHeading from './ProfileSectionHeading.vue'

const {
  user,
  editing,
  fullName,
  mobileNumber,
  fieldErrors,
  formError,
  saving,
  isOnline,
  open,
  close,
  save,
} = useProfileDetails()
</script>

<template>
  <section id="profile-details" class="profile-section">
    <ProfileSectionHeading eyebrow="Account" title="Personal details">
      <template #action>
        <BaseButton variant="text" @click="open">Edit</BaseButton>
      </template>
    </ProfileSectionHeading>
    <BaseCard padding="md">
      <dl>
        <div>
          <dt>Mobile</dt>
          <dd>{{ user?.mobileNumber }}</dd>
        </div>
        <div>
          <dt>Timezone</dt>
          <dd>{{ user?.timezone }}</dd>
        </div>
      </dl>
    </BaseCard>

    <BaseModal :open="editing" variant="sheet" title="Edit personal details" @close="close">
      <form class="profile-form" novalidate @submit.prevent="save">
        <BaseInput
          v-model="fullName"
          name="fullName"
          label="Full name"
          autocomplete="name"
          required
          :error="fieldErrors.fullName"
        />
        <BaseInput
          v-model="mobileNumber"
          name="mobileNumber"
          label="Mobile number"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          required
          :error="fieldErrors.mobileNumber"
        />
        <ProfileFormFooter
          label="Save details"
          :online="isOnline"
          :loading="saving"
          :error="formError"
        />
      </form>
    </BaseModal>
  </section>
</template>

<style scoped>
.profile-section,
.profile-form {
  display: grid;
  gap: var(--space-4);
}
dl {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
dt {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
dd {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 750;
  text-align: right;
}
</style>
