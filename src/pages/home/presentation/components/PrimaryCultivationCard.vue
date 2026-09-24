<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import type { CultivationSummary } from '@pages/cultivations/domain/cultivations.model'
import { ROUTE_NAMES } from '@router/route-names'

import { cultivationDayLabel, type FarmOverview } from '../../domain/home.model'
import FarmOverviewMetrics from './FarmOverviewMetrics.vue'

defineProps<{ cultivation: CultivationSummary; overview: FarmOverview | null }>()
</script>

<template>
  <BaseCard class="primary-cultivation" padding="lg" elevated>
    <div class="primary-cultivation__topline">
      <div>
        <p class="primary-cultivation__eyebrow">Active cultivation</p>
        <h2>{{ cultivation.name }}</h2>
        <p class="primary-cultivation__environment">
          {{ cultivation.species.commonName }} · {{ cultivation.environment.name }}
        </p>
      </div>
      <StatusChip :label="cultivationDayLabel(cultivation.dayNumber)" tone="success" />
    </div>
    <div
      class="primary-cultivation__progress"
      role="progressbar"
      aria-label="Cultivation progress"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="cultivation.progressPercent"
    >
      <span :style="{ width: `${cultivation.progressPercent}%` }" />
    </div>
    <FarmOverviewMetrics :overview="overview" />
    <BaseButton
      :to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId: cultivation.id } }"
      variant="secondary"
    >
      View cultivation
    </BaseButton>
  </BaseCard>
</template>

<style scoped>
.primary-cultivation {
  display: grid;
  gap: var(--space-4);
  overflow: hidden;
  background:
    radial-gradient(circle at 95% 0%, rgb(204 251 241 / 80%), transparent 8rem),
    var(--color-surface);
}
.primary-cultivation__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.primary-cultivation h2,
.primary-cultivation p {
  margin: 0;
}
.primary-cultivation__eyebrow {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.primary-cultivation h2 {
  margin-top: var(--space-1);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.primary-cultivation__environment {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.primary-cultivation__progress {
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-neutral-200);
}
.primary-cultivation__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-aqua-600);
}
</style>
