<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseModal from '@/components/overlays/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import {
  ApiError,
  createProfileAddress,
  deleteProfileAddress,
  getFarmProfile,
  getNotificationSettings,
  getProfileAddresses,
  profileQueryKeys,
  updateCurrentUser,
  updateNotificationSettings,
  updateProfileAddress,
  upsertFarmProfile,
  type Address,
  type FarmProfile,
  type NotificationSettings,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@stores/toast.store'

type ProfileModal = 'personal' | 'farm' | 'address' | null
type ReminderForm = Omit<
  NotificationSettings,
  'updatedAt' | 'version' | 'morningFeedingTime' | 'afternoonFeedingTime'
> & {
  morningFeedingTime: string
  afternoonFeedingTime: string
}

const session = useSessionStore()
const router = useRouter()
const toast = useToastStore()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const signingOut = ref(false)
const modal = ref<ProfileModal>(null)
const formError = ref('')

const fullName = ref('')
const mobileNumber = ref('')
const farmName = ref('')
const region = ref('')
const province = ref('')
const municipality = ref('')
const experienceLevel = ref<FarmProfile['experienceLevel']>('BEGINNER')
const farmNotes = ref('')
const addressLabel = ref('Farm address')
const recipientName = ref('')
const addressMobile = ref('')
const line1 = ref('')
const barangay = ref('')
const cityMunicipality = ref('')
const addressProvince = ref('')
const addressRegion = ref('')
const postalCode = ref('')
const deliveryInstructions = ref('')
const makeDefault = ref(false)
const reminderForm = ref<ReminderForm | null>(null)

const farmQuery = useQuery({
  queryKey: profileQueryKeys.farm,
  queryFn: () => getFarmProfile(session.accessToken!),
  retry: false,
})
const addressesQuery = useQuery({
  queryKey: profileQueryKeys.addresses,
  queryFn: () => getProfileAddresses(session.accessToken!),
})
const settingsQuery = useQuery({
  queryKey: profileQueryKeys.notifications,
  queryFn: () => getNotificationSettings(session.accessToken!),
})

watch(
  () => settingsQuery.data.value?.data,
  (settings) => {
    if (!settings) return
    reminderForm.value = {
      feedingReminders: settings.feedingReminders,
      waterMaintenance: settings.waterMaintenance,
      growthSampling: settings.growthSampling,
      harvestReminders: settings.harvestReminders,
      orderUpdates: settings.orderUpdates,
      educationalTips: settings.educationalTips,
      morningFeedingTime: settings.morningFeedingTime ?? '',
      afternoonFeedingTime: settings.afternoonFeedingTime ?? '',
      timezone: settings.timezone,
    }
  },
  { immediate: true },
)

const initials = computed(() =>
  (session.user?.fullName ?? 'Gabayan User')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)
const farmMissing = computed(
  () => farmQuery.error.value instanceof ApiError && farmQuery.error.value.status === 404,
)

const personalMutation = useMutation({
  mutationFn: () =>
    updateCurrentUser(
      { fullName: fullName.value.trim(), mobileNumber: mobileNumber.value.trim() },
      session.accessToken!,
    ),
})
const farmMutation = useMutation({
  mutationFn: () =>
    upsertFarmProfile(
      {
        name: farmName.value.trim(),
        region: region.value.trim() || null,
        province: province.value.trim() || null,
        municipality: municipality.value.trim() || null,
        experienceLevel: experienceLevel.value,
        notes: farmNotes.value.trim() || null,
      },
      session.accessToken!,
    ),
})
const addressMutation = useMutation({
  mutationFn: () =>
    createProfileAddress(
      {
        label: addressLabel.value.trim(),
        recipientName: recipientName.value.trim(),
        mobileNumber: addressMobile.value.trim(),
        line1: line1.value.trim(),
        barangay: barangay.value.trim(),
        cityMunicipality: cityMunicipality.value.trim(),
        province: addressProvince.value.trim(),
        region: addressRegion.value.trim(),
        postalCode: postalCode.value.trim(),
        countryCode: 'PH',
        deliveryInstructions: deliveryInstructions.value.trim() || null,
        isDefault: makeDefault.value,
      },
      session.accessToken!,
    ),
})
const settingsMutation = useMutation({
  mutationFn: () => {
    if (!reminderForm.value) throw new Error('Settings are unavailable.')
    return updateNotificationSettings(reminderForm.value, session.accessToken!)
  },
})
const addressActionMutation = useMutation({
  mutationFn: (action: { type: 'default' | 'delete'; address: Address }) =>
    action.type === 'default'
      ? updateProfileAddress(action.address.id, { isDefault: true }, session.accessToken!)
      : deleteProfileAddress(action.address.id, session.accessToken!),
})

function ensureOnline() {
  if (isOnline.value) return true
  formError.value = 'Reconnect before saving profile changes. Changes are not queued offline.'
  return false
}

function openPersonal() {
  fullName.value = session.user?.fullName ?? ''
  mobileNumber.value = session.user?.mobileNumber ?? ''
  formError.value = ''
  modal.value = 'personal'
}

function openFarm() {
  const farm = farmQuery.data.value?.data
  farmName.value = farm?.name ?? ''
  region.value = farm?.region ?? ''
  province.value = farm?.province ?? ''
  municipality.value = farm?.municipality ?? ''
  experienceLevel.value = farm?.experienceLevel ?? 'BEGINNER'
  farmNotes.value = farm?.notes ?? ''
  formError.value = ''
  modal.value = 'farm'
}

function openAddress() {
  addressLabel.value = 'Farm address'
  recipientName.value = session.user?.fullName ?? ''
  addressMobile.value = session.user?.mobileNumber ?? ''
  line1.value = ''
  barangay.value = ''
  cityMunicipality.value = ''
  addressProvince.value = ''
  addressRegion.value = ''
  postalCode.value = ''
  deliveryInstructions.value = ''
  makeDefault.value = !(addressesQuery.data.value?.data.length ?? 0)
  formError.value = ''
  modal.value = 'address'
}

async function savePersonal() {
  formError.value = ''
  if (!fullName.value.trim() || !mobileNumber.value.trim()) {
    formError.value = 'Enter your name and mobile number.'
    return
  }
  if (!ensureOnline()) return
  try {
    const result = await personalMutation.mutateAsync()
    session.user = result.data
    toast.show('Personal details updated.', 'success')
    modal.value = null
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'We couldn’t update your profile.'
  }
}

async function saveFarm() {
  formError.value = ''
  if (!farmName.value.trim()) {
    formError.value = 'Enter a farm name.'
    return
  }
  if (!ensureOnline()) return
  try {
    await farmMutation.mutateAsync()
    await queryClient.invalidateQueries({ queryKey: profileQueryKeys.farm })
    toast.show('Farm profile updated.', 'success')
    modal.value = null
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'We couldn’t update the farm.'
  }
}

async function saveAddress() {
  formError.value = ''
  if (
    !addressLabel.value.trim() ||
    !recipientName.value.trim() ||
    !line1.value.trim() ||
    !barangay.value.trim() ||
    !cityMunicipality.value.trim() ||
    !addressProvince.value.trim() ||
    !addressRegion.value.trim() ||
    !postalCode.value.trim()
  ) {
    formError.value = 'Complete all required address fields.'
    return
  }
  if (!ensureOnline()) return
  try {
    await addressMutation.mutateAsync()
    await queryClient.invalidateQueries({ queryKey: profileQueryKeys.addresses })
    toast.show('Address added.', 'success')
    modal.value = null
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'We couldn’t add the address.'
  }
}

async function saveSettings() {
  formError.value = ''
  if (!ensureOnline()) return
  try {
    const result = await settingsMutation.mutateAsync()
    reminderForm.value = {
      feedingReminders: result.data.feedingReminders,
      waterMaintenance: result.data.waterMaintenance,
      growthSampling: result.data.growthSampling,
      harvestReminders: result.data.harvestReminders,
      orderUpdates: result.data.orderUpdates,
      educationalTips: result.data.educationalTips,
      morningFeedingTime: result.data.morningFeedingTime ?? '',
      afternoonFeedingTime: result.data.afternoonFeedingTime ?? '',
      timezone: result.data.timezone,
    }
    toast.show('Notification preferences saved.', 'success')
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'We couldn’t save preferences.'
  }
}

async function addressAction(type: 'default' | 'delete', address: Address) {
  formError.value = ''
  if (!ensureOnline()) return
  try {
    await addressActionMutation.mutateAsync({ type, address })
    await queryClient.invalidateQueries({ queryKey: profileQueryKeys.addresses })
    toast.show(type === 'default' ? 'Default address updated.' : 'Address removed.', 'success')
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'We couldn’t update the address.'
  }
}

async function signOut() {
  signingOut.value = true
  await session.signOut()
  await router.replace('/welcome')
}
</script>

<template>
  <div class="profile-page">
    <AppHeader title="Profile" subtitle="Account and farm preferences" />
    <main class="profile-page__content">
      <section class="profile-summary">
        <span aria-hidden="true">{{ initials }}</span>
        <div>
          <h1>{{ session.user?.fullName }}</h1>
          <p>{{ session.user?.email }}</p>
        </div>
      </section>

      <section id="profile-details" class="profile-section">
        <div class="section-heading">
          <div>
            <p>Account</p>
            <h2>Personal details</h2>
          </div>
          <BaseButton size="sm" variant="text" @click="openPersonal">Edit</BaseButton>
        </div>
        <BaseCard padding="md"
          ><dl>
            <div>
              <dt>Mobile</dt>
              <dd>{{ session.user?.mobileNumber }}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{{ session.user?.timezone }}</dd>
            </div>
          </dl></BaseCard
        >
      </section>

      <section class="profile-section">
        <div class="section-heading">
          <div>
            <p>Farm</p>
            <h2>Farm profile</h2>
          </div>
          <BaseButton size="sm" variant="text" @click="openFarm">{{
            farmMissing ? 'Create' : 'Edit'
          }}</BaseButton>
        </div>
        <LoadingState v-if="farmQuery.isPending.value" compact label="Loading farm profile…" />
        <ErrorState
          v-else-if="farmQuery.isError.value && !farmMissing"
          @retry="farmQuery.refetch()"
        />
        <EmptyState
          v-else-if="farmMissing"
          title="No farm profile yet"
          message="Add your farm details to keep account information together."
        />
        <BaseCard v-else-if="farmQuery.data.value" padding="md"
          ><h3>{{ farmQuery.data.value.data.name }}</h3>
          <p>
            {{
              [
                farmQuery.data.value.data.municipality,
                farmQuery.data.value.data.province,
                farmQuery.data.value.data.region,
              ]
                .filter(Boolean)
                .join(', ') || 'Location not added'
            }}
          </p>
          <StatusChip :label="farmQuery.data.value.data.experienceLevel" tone="info"
        /></BaseCard>
      </section>

      <section class="profile-section">
        <div class="section-heading">
          <div>
            <p>Delivery</p>
            <h2>Addresses</h2>
          </div>
          <BaseButton size="sm" variant="text" @click="openAddress">Add</BaseButton>
        </div>
        <LoadingState v-if="addressesQuery.isPending.value" compact label="Loading addresses…" />
        <ErrorState v-else-if="addressesQuery.isError.value" @retry="addressesQuery.refetch()" />
        <EmptyState
          v-else-if="!addressesQuery.data.value?.data.length"
          title="No addresses"
          message="Add an address before checking out."
        />
        <BaseCard
          v-for="address in addressesQuery.data.value?.data"
          v-else
          :key="address.id"
          class="address-card"
          padding="md"
        >
          <div>
            <h3>{{ address.label }}</h3>
            <StatusChip v-if="address.isDefault" label="Default" tone="success" />
          </div>
          <p>
            {{ address.line1 }}, {{ address.barangay }}, {{ address.cityMunicipality }},
            {{ address.province }} {{ address.postalCode }}
          </p>
          <div class="address-actions">
            <BaseButton
              v-if="!address.isDefault"
              size="sm"
              variant="text"
              :loading="addressActionMutation.isPending.value"
              @click="addressAction('default', address)"
              >Make default</BaseButton
            ><BaseButton
              v-if="!address.isDefault"
              size="sm"
              variant="text"
              :loading="addressActionMutation.isPending.value"
              @click="addressAction('delete', address)"
              >Remove</BaseButton
            >
          </div>
        </BaseCard>
      </section>

      <section id="notifications" class="profile-section">
        <div class="section-heading">
          <div>
            <p>Reminders</p>
            <h2>Notification preferences</h2>
          </div>
        </div>
        <LoadingState v-if="settingsQuery.isPending.value" compact label="Loading preferences…" />
        <ErrorState v-else-if="settingsQuery.isError.value" @retry="settingsQuery.refetch()" />
        <BaseCard v-else-if="reminderForm" class="settings-card" padding="md">
          <label
            v-for="setting in [
              ['feedingReminders', 'Feeding reminders'],
              ['waterMaintenance', 'Water maintenance'],
              ['growthSampling', 'Growth sampling'],
              ['harvestReminders', 'Harvest reminders'],
              ['orderUpdates', 'Order updates'],
              ['educationalTips', 'Educational tips'],
            ] as const"
            :key="setting[0]"
            class="switch-row"
            ><span>{{ setting[1] }}</span
            ><input v-model="reminderForm[setting[0]]" type="checkbox" :aria-label="setting[1]"
          /></label>
          <div class="time-grid">
            <BaseInput
              v-model="reminderForm.morningFeedingTime"
              label="Morning feeding time"
              type="time"
              :disabled="!reminderForm.feedingReminders"
            /><BaseInput
              v-model="reminderForm.afternoonFeedingTime"
              label="Afternoon feeding time"
              type="time"
              :disabled="!reminderForm.feedingReminders"
            />
          </div>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <BaseButton
            :loading="settingsMutation.isPending.value"
            :disabled="!isOnline"
            @click="saveSettings"
            >Save preferences</BaseButton
          >
        </BaseCard>
      </section>

      <BaseButton variant="secondary" :loading="signingOut" @click="signOut">Sign out</BaseButton>
    </main>

    <BaseModal
      :open="modal === 'personal'"
      variant="sheet"
      title="Edit personal details"
      @close="modal = null"
      ><form class="modal-form" @submit.prevent="savePersonal">
        <BaseInput v-model="fullName" label="Full name" required /><BaseInput
          v-model="mobileNumber"
          label="Mobile number"
          type="tel"
          inputmode="tel"
          required
        />
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BaseButton type="submit" :loading="personalMutation.isPending.value" :disabled="!isOnline"
          >Save details</BaseButton
        >
      </form></BaseModal
    >
    <BaseModal :open="modal === 'farm'" variant="sheet" title="Farm profile" @close="modal = null"
      ><form class="modal-form" @submit.prevent="saveFarm">
        <BaseInput v-model="farmName" label="Farm name" required /><BaseInput
          v-model="municipality"
          label="City or municipality"
        /><BaseInput v-model="province" label="Province" /><BaseInput
          v-model="region"
          label="Region"
        /><label class="select-field"
          ><span>Experience level</span
          ><select v-model="experienceLevel">
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="EXPERIENCED">Experienced</option>
          </select></label
        ><label class="select-field"
          ><span>Farm notes (optional)</span
          ><textarea v-model="farmNotes" rows="3" maxlength="300" />
        </label>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BaseButton type="submit" :loading="farmMutation.isPending.value" :disabled="!isOnline"
          >Save farm profile</BaseButton
        >
      </form></BaseModal
    >
    <BaseModal
      :open="modal === 'address'"
      variant="sheet"
      title="Add delivery address"
      @close="modal = null"
      ><form class="modal-form" @submit.prevent="saveAddress">
        <BaseInput v-model="addressLabel" label="Address label" required /><BaseInput
          v-model="recipientName"
          label="Recipient name"
          required
        /><BaseInput
          v-model="addressMobile"
          label="Mobile number"
          type="tel"
          inputmode="tel"
          required
        /><BaseInput v-model="line1" label="Street and building" required /><BaseInput
          v-model="barangay"
          label="Barangay"
          required
        /><BaseInput v-model="cityMunicipality" label="City or municipality" required /><BaseInput
          v-model="addressProvince"
          label="Province"
          required
        /><BaseInput v-model="addressRegion" label="Region" required /><BaseInput
          v-model="postalCode"
          label="Postal code"
          inputmode="numeric"
          required
        /><BaseInput
          v-model="deliveryInstructions"
          label="Delivery instructions (optional)"
        /><label class="check-row"
          ><input v-model="makeDefault" type="checkbox" /><span>Use as default address</span></label
        >
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BaseButton type="submit" :loading="addressMutation.isPending.value" :disabled="!isOnline"
          >Add address</BaseButton
        >
      </form></BaseModal
    >
  </div>
</template>

<style scoped>
.profile-page__content,
.profile-section,
.modal-form {
  display: grid;
  gap: var(--space-4);
}
.profile-page__content {
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.profile-summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-block: var(--space-2);
}
.profile-summary > span {
  display: grid;
  width: 4rem;
  height: 4rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: linear-gradient(145deg, var(--color-brand-600), var(--color-aqua-600));
  font-weight: 800;
}
.profile-summary h1,
.profile-summary p,
.section-heading p,
.section-heading h2,
.address-card h3,
.address-card p,
.profile-section article > h3,
.profile-section article > p {
  margin: 0;
}
.profile-summary h1 {
  font-size: 1.125rem;
}
.profile-summary p,
.section-heading p,
.address-card p,
.profile-section article > p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}
.section-heading p {
  font-size: 0.7rem;
  text-transform: uppercase;
}
.section-heading h2 {
  margin-top: var(--space-1);
  font-size: 1.1rem;
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
.address-card {
  display: grid;
  gap: var(--space-2);
}
.address-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.address-actions {
  justify-content: flex-end !important;
}
.settings-card {
  display: grid;
  gap: var(--space-3);
}
.switch-row,
.check-row {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: 0.85rem;
  font-weight: 700;
}
.switch-row input,
.check-row input {
  width: 1.3rem;
  height: 1.3rem;
  accent-color: var(--color-brand-700);
}
.time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.select-field {
  display: grid;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 750;
}
select,
textarea {
  min-height: 3.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: white;
  font: inherit;
}
textarea {
  resize: vertical;
}
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--color-focus);
}
.form-error {
  margin: 0;
}
@media (max-width: 22rem) {
  .time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
