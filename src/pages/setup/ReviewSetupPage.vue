<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { ApiError, createCultivation } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const session = useSessionStore()
const router = useRouter()
const { isOnline } = useOnlineStatus()
const estimate = computed(() => setup.draft.estimate)
const cultivationName = ref(setup.draft.cultivationName)
const stockedOn = ref(setup.draft.stockedOn ?? '')
const aboveRangeReason = ref('')
const formError = ref('')
const idempotencyKey = crypto.randomUUID()

const mutation = useMutation({
  mutationFn: () => {
    const token = session.accessToken
    const value = estimate.value
    if (!token || !value) throw new Error('Your setup is incomplete.')
    setup.draft.cultivationName = cultivationName.value.trim()
    setup.draft.stockedOn = stockedOn.value || null
    return createCultivation(
      {
        ...(cultivationName.value.trim() ? { name: cultivationName.value.trim() } : {}),
        estimateId: value.estimateId,
        speciesId: value.species.id,
        environmentId: value.environment.id,
        dimensions: value.dimensions,
        initialFingerlings: value.plannedFingerlings,
        stockedOn: stockedOn.value || null,
        ...(value.status === 'ABOVE_RANGE'
          ? {
              acceptedAboveRangeWarning: setup.draft.acceptedAboveRangeWarning,
              aboveRangeReason: aboveRangeReason.value.trim() || null,
            }
          : {}),
      },
      token,
      idempotencyKey,
    )
  },
})

async function submit() {
  formError.value = ''
  if (!isOnline.value) {
    formError.value = 'Reconnect before creating this cultivation. Your setup draft is still saved.'
    return
  }
  try {
    const response = await mutation.mutateAsync()
    session.markCultivationCreated()
    await router.replace(`/setup/success/${response.data.id}`)
  } catch (error) {
    formError.value =
      error instanceof ApiError
        ? error.message
        : 'We couldn’t create the cultivation. Please try again.'
  }
}

onMounted(() => {
  if (!estimate.value) router.replace('/setup/fingerlings')
})
</script>

<template>
  <section v-if="estimate" class="setup-flow-page review-page">
    <div class="setup-flow-intro">
      <h2>Review your cultivation</h2>
      <p>
        Check your answers before creating the plan. You can return to any step to make changes.
      </p>
    </div>
    <BaseCard class="review-list" padding="none">
      <div>
        <span>Species</span><strong>{{ estimate.species.commonName }}</strong
        ><RouterLink to="/setup/species">Edit</RouterLink>
      </div>
      <div>
        <span>Environment</span><strong>{{ estimate.environment.name }}</strong
        ><RouterLink to="/setup/environment">Edit</RouterLink>
      </div>
      <div>
        <span>Dimensions</span
        ><strong
          >{{ estimate.dimensions.lengthM }} × {{ estimate.dimensions.widthM }} ×
          {{ estimate.dimensions.waterDepthM }} m</strong
        ><RouterLink to="/setup/dimensions">Edit</RouterLink>
      </div>
      <div>
        <span>Fingerlings</span><strong>{{ estimate.plannedFingerlings.toLocaleString() }}</strong
        ><RouterLink to="/setup/fingerlings">Edit</RouterLink>
      </div>
      <div>
        <span>Estimate</span><strong>{{ estimate.status.replace('_', ' ') }}</strong
        ><RouterLink to="/setup/stocking-result">View</RouterLink>
      </div>
    </BaseCard>
    <div class="review-page__fields">
      <BaseInput
        v-model="cultivationName"
        label="Cultivation name (optional)"
        placeholder="Generated automatically if blank"
        :maxlength="100"
      />
      <BaseInput
        v-model="stockedOn"
        label="Stocking date (optional)"
        type="date"
        hint="Leave blank if you are still planning."
      />
      <BaseInput
        v-if="estimate.status === 'ABOVE_RANGE'"
        v-model="aboveRangeReason"
        label="Reason for continuing (optional)"
        placeholder="Add a note for your records"
      />
    </div>
    <p class="review-page__disclaimer">{{ estimate.disclaimer }}</p>
    <p v-if="!isOnline" class="form-error" role="status">
      You’re offline. Reconnect before creating this cultivation.
    </p>
    <p v-else-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <div class="setup-flow-actions">
      <BaseButton :loading="mutation.isPending.value" :disabled="!isOnline" @click="submit">
        Create cultivation
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
.review-list {
  margin-top: var(--space-6);
  overflow: hidden;
}

.review-list > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.review-list > div:last-child {
  border-bottom: 0;
}
.review-list span {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.review-list strong {
  grid-column: 1;
  font-size: 0.875rem;
}
.review-list a {
  grid-row: 1 / span 2;
  grid-column: 2;
  align-self: center;
  color: var(--color-brand-700);
  font-size: 0.75rem;
  font-weight: 750;
}

.review-page__fields {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.review-page__disclaimer {
  margin: var(--space-4) 0;
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.5;
}
</style>
