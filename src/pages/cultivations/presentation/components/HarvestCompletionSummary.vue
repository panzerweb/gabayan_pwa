<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { formatManilaDate, formatPhp, formatQuantity } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import type { HarvestCompletion } from '../../domain/cultivations.model'

// What the server recorded when the harvest closed the cultivation. Every figure is the
// server's; revenue is an estimate that subtracts no expenses.
defineProps<{ completion: HarvestCompletion }>()
</script>

<template>
  <section class="completion-heading">
    <span aria-hidden="true"><AppIcon name="check" /></span>
    <p>Cultivation completed</p>
    <h1>{{ completion.cultivation.name }}</h1>
    <small>{{ formatManilaDate(completion.harvest.harvestDate) }}</small>
  </section>
  <BaseCard class="summary-card" padding="lg">
    <h2>Harvest summary</h2>
    <dl>
      <div>
        <dt>Fish harvested</dt>
        <dd>{{ formatQuantity(completion.summary.fishHarvested, 'COUNT') }}</dd>
      </div>
      <div>
        <dt>Total harvest</dt>
        <dd>
          {{
            formatQuantity(
              completion.summary.totalHarvestWeight.value,
              completion.summary.totalHarvestWeight.unit,
            )
          }}
        </dd>
      </div>
      <div>
        <dt>Recorded mortality</dt>
        <dd>{{ formatQuantity(completion.summary.recordedMortality, 'COUNT') }}</dd>
      </div>
      <div>
        <dt>Recorded survival</dt>
        <dd>{{ formatQuantity(completion.summary.survivalRatePercent, 'PERCENT') }}</dd>
      </div>
      <div>
        <dt>Culture duration</dt>
        <dd>{{ completion.summary.cultureDurationDays }} days</dd>
      </div>
      <div>
        <dt>Estimated revenue</dt>
        <dd>{{ formatPhp(completion.summary.estimatedRevenue.amountMinor) }}</dd>
      </div>
    </dl>
    <p>
      This summary is based on your recorded values. Revenue is an estimate and does not subtract
      expenses.
    </p>
  </BaseCard>
  <BaseButton :to="{ name: ROUTE_NAMES.cultivations, query: { view: 'completed' } }">
    View completed cultivations
  </BaseButton>
</template>

<style scoped>
.completion-heading {
  display: grid;
  justify-items: center;
  text-align: center;
}
.completion-heading > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: var(--color-success-700);
}
.completion-heading p,
.completion-heading h1,
.completion-heading small {
  margin: 0;
}
.completion-heading p {
  margin-top: var(--space-3);
  color: var(--color-success-800);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}
.completion-heading h1 {
  margin-top: var(--space-1);
  font-size: 1.5rem;
}
.completion-heading small {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
}
.summary-card {
  display: grid;
  gap: var(--space-4);
}
.summary-card h2 {
  margin: 0;
  font-size: 1.1rem;
}
.summary-card dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin: 0;
}
.summary-card dt {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.summary-card dd {
  margin: var(--space-1) 0 0;
  font-weight: 800;
}
.summary-card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
