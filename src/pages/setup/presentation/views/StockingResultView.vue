<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { formatQuantity } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import StockingResultSummary from '../components/StockingResultSummary.vue'
import { useStockingEstimate } from '../composables/useStockingEstimate'

const {
  estimate,
  content,
  acceptedAboveRangeWarning,
  canReview,
  formError,
  estimating,
  applySuggestedCount,
} = useStockingEstimate()
</script>

<template>
  <section v-if="estimate && content" class="setup-flow-page result-page">
    <div class="result-page__icon" :class="`result-page__icon--${content.tone}`" aria-hidden="true">
      <AppIcon :name="content.icon" :size="34" />
    </div>
    <div class="setup-flow-intro">
      <h2>{{ content.title }}</h2>
      <p>{{ content.message }}</p>
    </div>
    <StockingResultSummary :estimate="estimate" />
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <label v-if="estimate.status === 'ABOVE_RANGE'" class="checkbox-row result-page__confirmation">
      <input v-model="acceptedAboveRangeWarning" type="checkbox" />
      <span
        >I understand this plan is above the demo range and want to review it before creating the
        cultivation.</span
      >
    </label>
    <div class="setup-flow-actions">
      <BaseButton :to="{ name: ROUTE_NAMES.setupReview }" :disabled="!canReview">
        Review cultivation
      </BaseButton>
      <BaseButton
        v-if="estimate.status !== 'RECOMMENDED'"
        variant="secondary"
        :loading="estimating"
        @click="applySuggestedCount()"
      >
        Use suggested {{ formatQuantity(estimate.suggestedFingerlings, 'COUNT') }}
      </BaseButton>
      <BaseButton :to="{ name: ROUTE_NAMES.setupFingerlings }" variant="text">
        Change fingerling count
      </BaseButton>
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

.result-page__confirmation {
  margin-top: var(--space-5);
}
</style>
