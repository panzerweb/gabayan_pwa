<script setup lang="ts">
import { toRef } from 'vue'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { formatManilaTime, formatQuantity } from '@core/utils/format'
import FeedGuideCard from '@pages/feeds/presentation/components/FeedGuideCard.vue'

import { useCultivationDetail } from '../composables/useCultivationDetail'
import { useFeedingPlan } from '../composables/useFeedingPlan'

// Today's demo feeding plan with the numbers it was worked out from and its estimate notice,
// followed by the feed that suits the cultivation's current growth stage.
const props = defineProps<{ cultivationId: string }>()

const cultivationId = toRef(props, 'cultivationId')
const { plan, loading, loadFailed, refetch } = useFeedingPlan(cultivationId)
const { cultivation } = useCultivationDetail(cultivationId)
</script>

<template>
  <div class="feeding-plan">
    <LoadingState v-if="loading" label="Loading feeding plan…" />
    <ErrorState v-else-if="loadFailed" @retry="refetch()" />
    <BaseCard v-else-if="plan" class="plan-card" padding="lg">
      <p>{{ plan.isDemo ? 'Daily demo estimate' : 'Daily estimate' }}</p>
      <h1>{{ formatQuantity(plan.dailyTotal.value, plan.dailyTotal.unit) }}</h1>
      <dl>
        <div>
          <dt>Estimated live fish</dt>
          <dd>{{ formatQuantity(plan.estimatedLiveFish, 'COUNT') }}</dd>
        </div>
        <div>
          <dt>Average weight basis</dt>
          <dd>
            {{
              formatQuantity(plan.estimatedAverageWeight.value, plan.estimatedAverageWeight.unit)
            }}
          </dd>
        </div>
        <div>
          <dt>{{ plan.isDemo ? 'Demo feed rate' : 'Feed rate' }}</dt>
          <dd>{{ formatQuantity(plan.feedRatePercent, 'PERCENT') }} of body weight</dd>
        </div>
      </dl>
      <ul>
        <li v-for="feeding in plan.feedings" :key="feeding.scheduledAt">
          <span>{{ feeding.label }} · {{ formatManilaTime(feeding.scheduledAt) }}</span>
          <strong>
            {{ formatQuantity(feeding.recommendedAmount.value, feeding.recommendedAmount.unit) }}
          </strong>
        </li>
      </ul>
      <p>{{ plan.explanation }}</p>
      <aside class="estimate-note">
        <strong>Estimate notice</strong>
        <span>{{ plan.disclaimer }}</span>
        <small>Rule {{ plan.ruleVersion }}</small>
      </aside>
    </BaseCard>
    <FeedGuideCard
      v-if="cultivation"
      :species-id="cultivation.species.id"
      :growth-stage-code="cultivation.growthStage.code"
      :cultivation-id="cultivation.id"
    />
  </div>
</template>

<style scoped>
.feeding-plan {
  display: grid;
  gap: var(--space-4);
}
.plan-card {
  display: grid;
  gap: var(--space-4);
}
.plan-card p,
.plan-card h1,
.plan-card dl {
  margin: 0;
}
.plan-card > p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.plan-card h1 {
  color: var(--color-brand-800);
  font-size: 2rem;
}
dl,
ul {
  display: grid;
  gap: var(--space-2);
}
dl div,
li {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
dt {
  color: var(--color-text-muted);
}
dd {
  margin: 0;
  font-weight: 750;
  text-align: right;
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.estimate-note {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.75rem;
  line-height: 1.45;
}
.estimate-note small {
  opacity: 0.8;
}
</style>
