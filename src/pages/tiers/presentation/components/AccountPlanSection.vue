<script setup lang="ts">
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { ROUTE_NAMES } from '@router/route-names'

import {
  cultureSystemLimitLabel,
  cultureSystemUsageLabel,
  planPriceLabel,
  tierName,
} from '../../domain/tiers.model'
import { useAccountTier } from '../composables/useAccountTier'

// The account's plan inside Profile: its limit, how much of it is in use, any request
// waiting for review, and the way to the plans.
const { accountTier, loading, loadFailed, refetch } = useAccountTier()
</script>

<template>
  <section id="plan" class="account-plan" aria-labelledby="account-plan-title">
    <div class="account-plan__heading">
      <p>Plan</p>
      <h2 id="account-plan-title">Your plan</h2>
    </div>
    <LoadingState v-if="loading" compact label="Loading your plan…" />
    <ErrorState
      v-else-if="loadFailed"
      message="We couldn’t load your plan. Check your connection and try again."
      @retry="refetch()"
    />
    <BaseCard v-else-if="accountTier" padding="md">
      <div class="account-plan__body">
        <div class="account-plan__name">
          <strong>{{ accountTier.plan.name }}</strong>
          <span>{{ planPriceLabel(accountTier.plan) }}</span>
        </div>
        <dl class="account-plan__facts">
          <div>
            <dt>Limit</dt>
            <dd>{{ cultureSystemLimitLabel(accountTier.plan.cultureSystemLimit) }}</dd>
          </div>
          <div>
            <dt>In use</dt>
            <dd>{{ cultureSystemUsageLabel(accountTier) }}</dd>
          </div>
        </dl>
        <p v-if="accountTier.remainingCultureSystems === 0" class="account-plan__full">
          Every culture system on this plan is in use. Harvest one, or ask for a bigger plan to add
          another.
        </p>
        <StatusChip
          v-if="accountTier.pendingUpgradeRequest"
          :label="`${tierName(accountTier.pendingUpgradeRequest.requestedTier)} request pending`"
          tone="info"
        />
        <BaseButton variant="secondary" :to="{ name: ROUTE_NAMES.plans }">See plans</BaseButton>
      </div>
    </BaseCard>
  </section>
</template>

<style scoped>
.account-plan,
.account-plan__body {
  display: grid;
  gap: var(--space-4);
}

.account-plan__body {
  gap: var(--space-3);
  justify-items: start;
}

.account-plan__heading p,
.account-plan__heading h2 {
  margin: 0;
}

.account-plan__heading p {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.5;
  text-transform: uppercase;
}

.account-plan__heading h2 {
  margin-top: var(--space-1);
  font-size: 1.1rem;
}

.account-plan__name {
  display: grid;
  gap: var(--space-1);
}

.account-plan__name strong {
  font-size: 1rem;
}

.account-plan__name span {
  color: var(--color-brand-800);
  font-size: 0.875rem;
  font-weight: 700;
}

.account-plan__facts {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  font-size: 0.8125rem;
}

.account-plan__facts div {
  display: flex;
  gap: var(--space-2);
}

.account-plan__facts dt {
  min-width: 4rem;
  color: var(--color-text-muted);
}

.account-plan__facts dd {
  margin: 0;
  font-weight: 700;
}

.account-plan__full {
  margin: 0;
  color: var(--color-warning-950);
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
