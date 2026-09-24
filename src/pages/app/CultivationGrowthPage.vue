<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import GrowthChart from '@/components/cultivations/GrowthChart.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseModal from '@/components/overlays/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useOnlineStatus } from '@core/composables/useOnlineStatus'
import {
  ApiError,
  createGrowthMeasurement,
  listGrowthMeasurements,
  recordsQueryKeys,
} from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@stores/toast.store'
import { manilaDateToday } from '@core/utils/format'

const route = useRoute()
const session = useSessionStore()
const toast = useToastStore()
const queryClient = useQueryClient()
const { isOnline } = useOnlineStatus()
const cultivationId = computed(() => String(route.params.cultivationId))
const open = ref(false)
const measuredOn = ref(manilaDateToday())
const sampleSize = ref('10')
const averageWeight = ref('')
const notes = ref('')
const errorMessage = ref('')
const fieldError = ref('')
const idempotencyKey = ref(crypto.randomUUID())

const query = useQuery({
  queryKey: computed(() => recordsQueryKeys.growth(cultivationId.value)),
  queryFn: () => listGrowthMeasurements(cultivationId.value, session.accessToken!),
})

const mutation = useMutation({
  mutationFn: () =>
    createGrowthMeasurement(
      cultivationId.value,
      {
        measuredOn: measuredOn.value,
        numberOfFishSampled: Number(sampleSize.value),
        averageWeight: { value: Number(averageWeight.value), unit: 'G' },
        notes: notes.value.trim() || null,
      },
      session.accessToken!,
      idempotencyKey.value,
    ),
})

function startEntry() {
  measuredOn.value = manilaDateToday()
  sampleSize.value = '10'
  averageWeight.value = ''
  notes.value = ''
  errorMessage.value = ''
  fieldError.value = ''
  idempotencyKey.value = crypto.randomUUID()
  open.value = true
}

async function submit() {
  fieldError.value = ''
  errorMessage.value = ''
  if (!Number.isInteger(Number(sampleSize.value)) || Number(sampleSize.value) <= 0) {
    fieldError.value = 'Enter a whole-number sample size greater than 0.'
    return
  }
  if (!Number.isFinite(Number(averageWeight.value)) || Number(averageWeight.value) <= 0) {
    fieldError.value = 'Enter an average weight greater than 0.'
    return
  }
  if (!isOnline.value) {
    errorMessage.value = 'Reconnect before saving this growth record. It has not been queued.'
    return
  }
  try {
    await mutation.mutateAsync()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: recordsQueryKeys.growth(cultivationId.value) }),
      queryClient.invalidateQueries({ queryKey: ['cultivation', cultivationId.value] }),
      queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.feedingPlan(cultivationId.value),
      }),
      queryClient.invalidateQueries({ queryKey: recordsQueryKeys.readiness(cultivationId.value) }),
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] }),
    ])
    toast.show('Growth record saved.', 'success')
    open.value = false
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'We couldn’t save this growth record.'
  }
}
</script>

<template>
  <div>
    <AppHeader title="Growth records" show-back :back-to="`/app/cultivations/${cultivationId}`" />
    <main class="records-page">
      <section class="page-heading">
        <div>
          <p>Measured samples</p>
          <h1>Track average fish weight</h1>
        </div>
        <BaseButton size="sm" @click="startEntry">Add record</BaseButton>
      </section>
      <LoadingState v-if="query.isPending.value" label="Loading growth records…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <BaseCard v-else padding="md">
        <GrowthChart :measurements="query.data.value?.data ?? []" />
      </BaseCard>
      <p class="estimate-note">
        Growth samples update demo feeding and harvest estimates. They are not a scientific
        assessment for your farm.
      </p>
    </main>

    <BaseModal
      :open="open"
      variant="sheet"
      title="Add growth record"
      description="Use a representative sample and record the actual average."
      @close="open = false"
    >
      <form class="record-form" @submit.prevent="submit">
        <BaseInput v-model="measuredOn" label="Measurement date" type="date" required />
        <BaseInput
          v-model="sampleSize"
          label="Fish sampled"
          type="number"
          inputmode="numeric"
          :min="1"
          :step="1"
          required
        />
        <BaseInput
          v-model="averageWeight"
          label="Average fish weight"
          type="number"
          inputmode="decimal"
          suffix="g"
          :min="0.01"
          :step="0.01"
          :error="fieldError"
          required
        />
        <label class="text-field">
          <span>Notes (optional)</span>
          <textarea v-model="notes" rows="3" maxlength="300" />
        </label>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <BaseButton type="submit" :loading="mutation.isPending.value" :disabled="!isOnline">
          Save growth record
        </BaseButton>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.records-page,
.record-form {
  display: grid;
  gap: var(--space-4);
}
.records-page {
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}
.page-heading p,
.page-heading h1 {
  margin: 0;
}
.page-heading p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.page-heading h1 {
  margin-top: var(--space-1);
  font-size: 1.25rem;
}
.estimate-note,
.form-error {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
}
.estimate-note {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}
.form-error {
  color: var(--color-danger-700);
  font-weight: 700;
}
.text-field {
  display: grid;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 750;
}
textarea {
  resize: vertical;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font: inherit;
}
textarea:focus-visible {
  outline: 3px solid var(--color-focus);
}
</style>
