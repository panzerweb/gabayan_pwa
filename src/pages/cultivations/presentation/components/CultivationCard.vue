<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaTime } from '@core/utils/format'
import { ROUTE_NAMES } from '@router/route-names'

import { cultivationStatusDisplay, type CultivationSummary } from '../../domain/cultivations.model'
import CultivationProgress from './CultivationProgress.vue'

// One cultivation in the list, linking to its detail.
const props = defineProps<{ cultivation: CultivationSummary }>()

const status = computed(() => cultivationStatusDisplay(props.cultivation.status))
const liveFish = computed(() => props.cultivation.estimatedLiveFish.toLocaleString('en-PH'))
</script>

<template>
  <RouterLink
    class="cultivation-link"
    :to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId: cultivation.id } }"
  >
    <BaseCard class="cultivation-card" padding="lg">
      <div class="cultivation-card__heading">
        <div>
          <StatusChip :label="status.label" :tone="status.tone" :icon="status.icon" />
          <h2>{{ cultivation.name }}</h2>
          <p>{{ cultivation.species.commonName }} · {{ cultivation.environment.name }}</p>
        </div>
        <span aria-hidden="true">›</span>
      </div>
      <CultivationProgress :percent="cultivation.progressPercent" />
      <dl>
        <div>
          <dt>Live fish estimate</dt>
          <dd>{{ liveFish }}</dd>
        </div>
        <div>
          <dt>Next task</dt>
          <dd>
            {{
              cultivation.nextTaskAt ? formatManilaTime(cultivation.nextTaskAt) : 'None scheduled'
            }}
          </dd>
        </div>
      </dl>
    </BaseCard>
  </RouterLink>
</template>

<style scoped>
.cultivation-link {
  color: inherit;
  text-decoration: none;
}
.cultivation-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: var(--radius-lg);
}
.cultivation-card {
  display: grid;
  gap: var(--space-4);
  border-color: var(--color-brand-200);
  background: linear-gradient(145deg, var(--color-surface), var(--color-brand-50));
}
.cultivation-card__heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.cultivation-card__heading > span {
  color: var(--color-brand-700);
  font-size: 1.75rem;
}
h2,
p,
dl,
dt,
dd {
  margin: 0;
}
h2 {
  margin-top: var(--space-3);
  font-size: 1.25rem;
}
p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
dt {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
dd {
  margin-top: var(--space-1);
  font-size: 0.8125rem;
  font-weight: 750;
}
</style>
