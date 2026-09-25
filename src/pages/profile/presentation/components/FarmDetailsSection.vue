<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import StatusChip from '@components/ui/StatusChip.vue'

import {
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVELS,
  farmLocation,
} from '../../domain/profile.model'
import { useFarmProfile } from '../composables/useFarmProfile'
import ProfileFormFooter from './ProfileFormFooter.vue'
import ProfileSectionHeading from './ProfileSectionHeading.vue'
import ProfileSelectField from './ProfileSelectField.vue'
import ProfileTextareaField from './ProfileTextareaField.vue'

const {
  farm,
  missing,
  loading,
  loadFailed,
  refetch,
  editing,
  form,
  fieldErrors,
  formError,
  saving,
  isOnline,
  open,
  close,
  save,
} = useFarmProfile()

const experienceOptions = EXPERIENCE_LEVELS.map((level) => ({
  value: level,
  label: EXPERIENCE_LEVEL_LABELS[level],
}))
</script>

<template>
  <section id="farm-profile" class="profile-section">
    <ProfileSectionHeading eyebrow="Farm" title="Farm profile">
      <template #action>
        <BaseButton variant="text" :disabled="loading || loadFailed" @click="open">{{
          missing ? 'Create' : 'Edit'
        }}</BaseButton>
      </template>
    </ProfileSectionHeading>
    <LoadingState v-if="loading" compact label="Loading farm profile…" />
    <EmptyState
      v-else-if="missing"
      title="No farm profile yet"
      message="Add your farm details to keep account information together."
    />
    <ErrorState v-else-if="loadFailed" @retry="refetch()" />
    <BaseCard v-else-if="farm" class="farm-card" padding="md">
      <h3>{{ farm.name }}</h3>
      <p>{{ farmLocation(farm) }}</p>
      <StatusChip :label="EXPERIENCE_LEVEL_LABELS[farm.experienceLevel]" tone="info" />
    </BaseCard>

    <BaseModal :open="editing" variant="sheet" title="Farm profile" @close="close">
      <form class="profile-form" novalidate @submit.prevent="save">
        <BaseInput
          v-model="form.name"
          name="name"
          label="Farm name"
          required
          :error="fieldErrors.name"
        />
        <BaseInput
          v-model="form.municipality"
          name="municipality"
          label="City or municipality"
          hint="With the province, this is where weather alerts are read for."
          :error="fieldErrors.municipality"
        />
        <BaseInput
          v-model="form.province"
          name="province"
          label="Province"
          :error="fieldErrors.province"
        />
        <BaseInput v-model="form.region" name="region" label="Region" :error="fieldErrors.region" />
        <ProfileSelectField
          v-model="form.experienceLevel"
          label="Experience level"
          :options="experienceOptions"
          :error="fieldErrors.experienceLevel"
        />
        <ProfileTextareaField
          v-model="form.notes"
          label="Farm notes (optional)"
          :maxlength="300"
          :error="fieldErrors.notes"
        />
        <ProfileFormFooter
          label="Save farm profile"
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
.farm-card {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}
.farm-card h3,
.farm-card p {
  margin: 0;
}
.farm-card p {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
