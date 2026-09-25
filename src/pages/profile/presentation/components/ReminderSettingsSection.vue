<script setup lang="ts">
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import { REMINDER_TOGGLES, type ReminderToggle } from '../../domain/profile.model'
import { useReminderSettings } from '../composables/useReminderSettings'
import ProfileFormFooter from './ProfileFormFooter.vue'
import ProfileSectionHeading from './ProfileSectionHeading.vue'

const { form, loading, loadFailed, refetch, fieldErrors, formError, saving, isOnline, save } =
  useReminderSettings()

// Each switch is labelled by its name and described by the line saying what it sends.
const switchId = (field: ReminderToggle) => `reminder-${field}`
const helpId = (field: ReminderToggle) => `reminder-${field}-help`
</script>

<template>
  <section id="notifications" class="profile-section">
    <ProfileSectionHeading eyebrow="Reminders" title="Notification preferences" />
    <LoadingState v-if="loading" compact label="Loading preferences…" />
    <ErrorState v-else-if="loadFailed" @retry="refetch()" />
    <BaseCard v-else-if="form" padding="md">
      <form class="settings-form" novalidate @submit.prevent="save">
        <div v-for="toggle in REMINDER_TOGGLES" :key="toggle.field" class="switch-row">
          <div class="switch-row__text">
            <label :for="switchId(toggle.field)">{{ toggle.label }}</label>
            <p :id="helpId(toggle.field)">{{ toggle.description }}</p>
          </div>
          <input
            :id="switchId(toggle.field)"
            v-model="form[toggle.field]"
            type="checkbox"
            :aria-describedby="helpId(toggle.field)"
          />
        </div>
        <div class="time-grid">
          <BaseInput
            v-model="form.morningFeedingTime"
            name="morningFeedingTime"
            label="Morning feeding time"
            type="time"
            :disabled="!form.feedingReminders"
            :error="fieldErrors.morningFeedingTime"
          />
          <BaseInput
            v-model="form.afternoonFeedingTime"
            name="afternoonFeedingTime"
            label="Afternoon feeding time"
            type="time"
            :disabled="!form.feedingReminders"
            :error="fieldErrors.afternoonFeedingTime"
          />
        </div>
        <ProfileFormFooter
          label="Save preferences"
          :online="isOnline"
          :loading="saving"
          :error="formError"
        />
      </form>
    </BaseCard>
  </section>
</template>

<style scoped>
.profile-section,
.settings-form {
  display: grid;
  gap: var(--space-4);
}
.settings-form {
  gap: var(--space-3);
}
.switch-row {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.switch-row__text {
  display: grid;
  gap: var(--space-1);
}
.switch-row label {
  display: flex;
  min-height: 1.75rem;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
}
.switch-row p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
.switch-row input {
  flex: none;
  width: 1.3rem;
  height: 1.3rem;
  margin: 0.72rem;
  accent-color: var(--color-brand-700);
}
.time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
@media (max-width: 22rem) {
  .time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
