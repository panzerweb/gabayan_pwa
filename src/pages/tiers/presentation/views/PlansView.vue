<script setup lang="ts">
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { formatManilaDate } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import { cultureSystemUsageLabel } from '../../domain/tiers.model'
import PlanCard from '../components/PlanCard.vue'
import { usePlansScreen } from '../composables/usePlansScreen'

const {
  plans,
  accountTier,
  currentCode,
  pendingRequest,
  pendingPlanName,
  requiredPlanName,
  loading,
  loadFailed,
  retry,
  canRequest,
  request,
  requestingCode,
  formError,
  isOnline,
} = usePlansScreen()
</script>

<template>
  <div class="plans-page">
    <AppHeader
      title="Plans"
      subtitle="Culture systems and what each plan includes"
      show-back
      :back-to="{ name: ROUTE_NAMES.profile }"
    />
    <main class="plans-page__content">
      <LoadingState v-if="loading" label="Loading plans…" />
      <ErrorState
        v-else-if="loadFailed"
        message="We couldn’t load the plans. Check your connection and try again."
        @retry="retry()"
      />
      <template v-else-if="accountTier">
        <p v-if="requiredPlanName" class="plans-page__notice" role="status">
          <AppIcon name="info" :size="20" />
          <span>
            That screen is part of the {{ requiredPlanName }} plan. Your account is on
            {{ accountTier.plan.name }}.
          </span>
        </p>
        <section class="plans-page__summary" aria-label="Your plan">
          <h2>You’re on {{ accountTier.plan.name }}</h2>
          <p>{{ cultureSystemUsageLabel(accountTier) }}</p>
        </section>
        <p v-if="pendingRequest" class="plans-page__pending" role="status">
          <AppIcon name="info" :size="20" />
          <span>
            Your request for {{ pendingPlanName }} was sent on
            {{ formatManilaDate(pendingRequest.createdAt) }}. You stay on
            {{ accountTier.plan.name }} until it is reviewed.
          </span>
        </p>
        <div class="plans-page__list">
          <PlanCard
            v-for="plan in plans"
            :key="plan.code"
            :plan="plan"
            :current="plan.code === currentCode"
          >
            <template v-if="canRequest(plan)" #action>
              <BaseButton
                variant="secondary"
                :loading="requestingCode === plan.code"
                :disabled="Boolean(pendingRequest) || !isOnline || Boolean(requestingCode)"
                @click="request(plan)"
              >
                Request {{ plan.name }}
              </BaseButton>
            </template>
          </PlanCard>
        </div>
        <p v-if="!isOnline" class="form-error" role="status">
          You’re offline. Reconnect to send a plan request. It will not be queued.
        </p>
        <p v-else-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <p class="plans-page__footnote">
          Paid plans are not sold in the app yet. A request is reviewed by the Gabayan team and
          nothing is charged.
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.plans-page__content {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}

.plans-page__notice,
.plans-page__pending {
  display: flex;
  align-items: start;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.plans-page__notice {
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.plans-page__pending {
  color: var(--color-brand-950);
  background: var(--color-brand-50);
}

.plans-page__notice :deep(svg),
.plans-page__pending :deep(svg) {
  flex: none;
}

.plans-page__summary h2,
.plans-page__summary p {
  margin: 0;
}

.plans-page__summary h2 {
  font-size: 1.1rem;
}

.plans-page__summary p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.plans-page__list {
  display: grid;
  gap: var(--space-3);
}

.plans-page__footnote {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
