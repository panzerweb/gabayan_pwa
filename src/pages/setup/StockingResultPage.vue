<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { createStockingEstimate } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const session = useSessionStore()
const router = useRouter()
const formError = ref('')
const estimate = computed(() => setup.draft.estimate)

const content = computed(() => {
  if (estimate.value?.status === 'BELOW_RANGE') {
    return {
      title: 'Your plan is below the demo range',
      message: 'A lower count may use less of the estimated culture-area capacity.',
      tone: 'info',
    } as const
  }
  if (estimate.value?.status === 'ABOVE_RANGE') {
    return {
      title: 'Your plan is above the demo range',
      message: 'A higher count may increase oxygen, feeding, and water-management demands.',
      tone: 'warning',
    } as const
  }
  return {
    title: 'Your plan is within the demo range',
    message: 'The planned count falls within this prototype profile’s estimated range.',
    tone: 'success',
  } as const
})

const mutation = useMutation({
  mutationFn: (plannedFingerlings: number) => {
    const token = session.accessToken
    const draft = setup.draft
    if (!token || !draft.speciesId || !draft.environmentId || !draft.dimensions) {
      throw new Error('Setup details are incomplete.')
    }
    return createStockingEstimate(
      {
        speciesId: draft.speciesId,
        environmentId: draft.environmentId,
        dimensions: draft.dimensions,
        plannedFingerlings,
      },
      token,
    )
  },
})

async function useSuggestedCount() {
  if (!estimate.value) return
  formError.value = ''
  try {
    const response = await mutation.mutateAsync(estimate.value.suggestedFingerlings)
    setup.setEstimate(response.data)
  } catch {
    formError.value = 'We couldn’t update the estimate. Please try again.'
  }
}

onMounted(() => {
  if (!estimate.value) router.replace('/setup/fingerlings')
})
</script>

<template>
  <section v-if="estimate" class="setup-flow-page result-page">
    <div class="result-page__icon" :class="`result-page__icon--${content.tone}`" aria-hidden="true">
      <AppIcon
        :name="
          content.tone === 'warning' ? 'warning' : content.tone === 'success' ? 'check' : 'info'
        "
        :size="34"
      />
    </div>
    <div class="setup-flow-intro">
      <h2>{{ content.title }}</h2>
      <p>{{ content.message }}</p>
    </div>
    <BaseCard class="result-card" padding="lg">
      <div>
        <span>Your plan</span
        ><strong>{{ estimate.plannedFingerlings.toLocaleString() }} fish</strong>
      </div>
      <div>
        <span>Estimated range</span
        ><strong
          >{{ estimate.recommendedMinimum.toLocaleString() }}–{{
            estimate.recommendedMaximum.toLocaleString()
          }}
          fish</strong
        >
      </div>
      <div>
        <span>Estimated water volume</span><strong>{{ estimate.estimatedWaterVolumeM3 }} m³</strong>
      </div>
    </BaseCard>
    <p class="result-page__basis">{{ estimate.basis.explanation }}</p>
    <p class="result-page__disclaimer">
      <AppIcon name="info" :size="18" />{{ estimate.disclaimer }}
    </p>
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <label v-if="estimate.status === 'ABOVE_RANGE'" class="checkbox-row result-page__confirmation">
      <input v-model="setup.draft.acceptedAboveRangeWarning" type="checkbox" />
      <span
        >I understand this plan is above the demo range and want to review it before creating the
        cultivation.</span
      >
    </label>
    <div class="setup-flow-actions">
      <BaseButton
        to="/setup/review"
        :disabled="estimate.status === 'ABOVE_RANGE' && !setup.draft.acceptedAboveRangeWarning"
      >
        Review cultivation
      </BaseButton>
      <BaseButton
        v-if="estimate.status !== 'RECOMMENDED'"
        variant="secondary"
        :loading="mutation.isPending.value"
        @click="useSuggestedCount"
      >
        Use suggested {{ estimate.suggestedFingerlings.toLocaleString() }}
      </BaseButton>
      <BaseButton to="/setup/fingerlings" variant="text">Change fingerling count</BaseButton>
    </div>
  </section>
</template>

<style scoped>
.result-page__icon {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  place-items: center;
  margin-bottom: var(--space-4);
  border-radius: 50%;
  color: var(--color-success-800);
  background: var(--color-success-100);
}

.result-page__icon--warning {
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.result-page__icon--info {
  color: var(--color-brand-800);
  background: var(--color-brand-100);
}

.result-card {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.result-card div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.result-card span {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.result-card strong {
  font-size: 0.875rem;
  text-align: right;
}

.result-page__basis {
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.result-page__disclaimer {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.6875rem;
  line-height: 1.5;
}

.result-page__confirmation {
  margin-top: var(--space-5);
}
</style>
