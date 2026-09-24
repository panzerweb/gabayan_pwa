<script setup lang="ts">
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { useSessionStore } from '@stores/session.store'

import AddressBook from '../components/AddressBook.vue'
import FarmDetailsSection from '../components/FarmDetailsSection.vue'
import PersonalDetailsSection from '../components/PersonalDetailsSection.vue'
import ProfileSummary from '../components/ProfileSummary.vue'
import ReminderSettingsSection from '../components/ReminderSettingsSection.vue'
import { useSignOut } from '../composables/useSignOut'

const session = useSessionStore()
const { signingOut, signOut } = useSignOut()
</script>

<template>
  <div class="profile-page">
    <AppHeader title="Profile" subtitle="Account and farm preferences" />
    <main class="profile-page__content">
      <ProfileSummary :full-name="session.user?.fullName" :email="session.user?.email" />
      <PersonalDetailsSection />
      <FarmDetailsSection />
      <AddressBook />
      <ReminderSettingsSection />
      <BaseButton variant="secondary" :loading="signingOut" @click="signOut">Sign out</BaseButton>
    </main>
  </div>
</template>

<style scoped>
.profile-page__content {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
</style>
