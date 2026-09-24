<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import TierLimitNotice from '@pages/tiers/presentation/components/TierLimitNotice.vue'

import SetupReviewList from '../components/SetupReviewList.vue'
import { useCreateCultivation } from '../composables/useCreateCultivation'

const { estimate, form, fieldErrors, formError, limitReached, isOnline, creating, submit } =
  useCreateCultivation()
</script>

<template>
  <section v-if="estimate" class="setup-flow-page review-page">
    <div class="setup-flow-intro">
      <h2>Review your cultivation</h2>
      <p>
        Check your answers before creating the plan. You can return to any step to make changes.
      </p>
    </div>
    <SetupReviewList :estimate="estimate" />
    <div class="review-page__fields">
      <BaseInput
        v-model="form.cultivationName"
        label="Cultivation name (optional)"
        placeholder="Generated automatically if blank"
        :maxlength="100"
        :error="fieldErrors.name"
      />
      <BaseInput
        v-model="form.stockedOn"
        label="Stocking date (optional)"
        type="date"
        hint="Leave blank if you are still planning."
        :error="fieldErrors.stockedOn"
      />
      <BaseInput
        v-if="estimate.status === 'ABOVE_RANGE'"
        v-model="form.aboveRangeReason"
        label="Reason for continuing (optional)"
        placeholder="Add a note for your records"
        :error="fieldErrors.aboveRangeReason"
      />
    </div>
    <p class="review-page__disclaimer">{{ estimate.disclaimer }}</p>
    <p v-if="!isOnline" class="form-error" role="status">
      You’re offline. Reconnect before creating this cultivation. It will not be queued.
    </p>
    <TierLimitNotice v-else-if="limitReached" :message="formError" />
    <p v-else-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <div class="setup-flow-actions">
      <BaseButton :loading="creating" :disabled="!isOnline" @click="submit()">
        Create cultivation
      </BaseButton>
    </div>
  </section>
</template>

<style scoped>
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
