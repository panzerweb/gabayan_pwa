<script setup lang="ts">
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseButton from '@components/ui/BaseButton.vue'

import PlanCard from '../components/PlanCard.vue'
import { useChoosePlan } from '../composables/useChoosePlan'

const {
  plans,
  loading,
  loadFailed,
  refetch,
  selectedCode,
  select,
  continueLabel,
  submitting,
  formError,
  isOnline,
  submit,
} = useChoosePlan()
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>Choose your plan</h2>
      <p>
        Every account starts on Free. Pro and Organization are not sold in the app yet: choosing one
        sends a request, and you continue on Free while it is reviewed. Nothing is charged.
      </p>
    </div>
    <LoadingState v-if="loading" label="Loading plans…" />
    <ErrorState
      v-else-if="loadFailed"
      message="We couldn’t load the plans. Try again, or continue on Free and compare plans later in Profile."
      @retry="refetch()"
    />
    <div v-else class="setup-flow-list" role="radiogroup" aria-label="Plans">
      <PlanCard
        v-for="plan in plans"
        :key="plan.code"
        :plan="plan"
        selectable
        name="onboarding-plan"
        :selected="selectedCode === plan.code"
        @select="select(plan.code)"
      />
    </div>
    <p v-if="!isOnline && selectedCode !== 'FREE'" class="form-error" role="status">
      You’re offline. Reconnect to send a plan request, or continue on Free.
    </p>
    <p v-else-if="formError" class="form-error" role="alert">{{ formError }}</p>
    <div class="setup-flow-actions">
      <BaseButton :loading="submitting" @click="submit()">{{ continueLabel }}</BaseButton>
    </div>
  </section>
</template>
