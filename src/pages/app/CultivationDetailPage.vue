<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { getCultivation, getCultivationTimeline, operationalQueryKeys } from '@/services/api'
import { useSessionStore } from '@stores/session.store'
import { formatManilaDate, formatManilaTime, formatQuantity } from '@core/utils/format'

const route = useRoute()
const session = useSessionStore()
const cultivationId = computed(() => String(route.params.cultivationId))
const selectedTab = ref<'overview' | 'timeline'>('overview')
const detailQuery = useQuery({
  queryKey: computed(() => operationalQueryKeys.cultivation(cultivationId.value)),
  queryFn: () => getCultivation(cultivationId.value, session.accessToken!),
})
const timelineQuery = useQuery({
  queryKey: computed(() => operationalQueryKeys.timeline(cultivationId.value)),
  queryFn: () => getCultivationTimeline(cultivationId.value, session.accessToken!),
  enabled: computed(() => selectedTab.value === 'timeline'),
})
const cultivation = computed(() => detailQuery.data.value?.data)
</script>

<template>
  <div>
    <AppHeader :title="cultivation?.name ?? 'Cultivation'" show-back back-to="/app/cultivations" />
    <main class="detail-page">
      <LoadingState v-if="detailQuery.isPending.value" label="Loading cultivation…" />
      <ErrorState v-else-if="detailQuery.isError.value" @retry="detailQuery.refetch()" />
      <template v-else-if="cultivation">
        <section class="hero">
          <div>
            <StatusChip :label="cultivation.growthStage.name" tone="success" />
            <h1>Day {{ cultivation.dayNumber ?? '—' }}</h1>
            <p>{{ cultivation.species.commonName }} · {{ cultivation.environment.name }}</p>
          </div>
          <strong>{{ cultivation.progressPercent }}%</strong>
        </section>
        <nav class="tabs" aria-label="Cultivation sections">
          <button
            type="button"
            :aria-current="selectedTab === 'overview' ? 'page' : undefined"
            @click="selectedTab = 'overview'"
          >
            Overview
          </button>
          <button
            type="button"
            :aria-current="selectedTab === 'timeline' ? 'page' : undefined"
            @click="selectedTab = 'timeline'"
          >
            Timeline
          </button>
          <BaseButton variant="text" :to="`/app/cultivations/${cultivation.id}/tasks`"
            >Tasks</BaseButton
          >
        </nav>

        <template v-if="selectedTab === 'overview'">
          <section class="metrics" aria-label="Cultivation metrics">
            <BaseCard padding="md"
              ><span>Estimated live fish</span
              ><strong>{{ cultivation.estimatedLiveFish.toLocaleString() }}</strong
              ><small>{{ cultivation.recordedMortality }} mortality recorded</small></BaseCard
            >
            <BaseCard padding="md"
              ><span>Latest average weight</span
              ><strong>{{
                cultivation.latestGrowthMeasurement
                  ? formatQuantity(
                      cultivation.latestGrowthMeasurement.averageWeight.value,
                      cultivation.latestGrowthMeasurement.averageWeight.unit,
                    )
                  : 'Not recorded'
              }}</strong
              ><small>{{
                cultivation.latestGrowthMeasurement
                  ? formatManilaDate(cultivation.latestGrowthMeasurement.measuredOn)
                  : 'Add a sample later'
              }}</small></BaseCard
            >
            <BaseCard padding="md"
              ><span>Daily feed estimate</span
              ><strong>{{
                cultivation.feedingSummary
                  ? formatQuantity(
                      cultivation.feedingSummary.dailyFeed.value,
                      cultivation.feedingSummary.dailyFeed.unit,
                    )
                  : 'Not set'
              }}</strong
              ><small>{{
                cultivation.feedingSummary
                  ? `${cultivation.feedingSummary.feedingsPerDay} feedings per day`
                  : 'No active plan'
              }}</small></BaseCard
            >
            <BaseCard padding="md"
              ><span>Next feeding</span
              ><strong>{{
                cultivation.feedingSummary
                  ? formatManilaTime(cultivation.feedingSummary.nextFeedingAt)
                  : 'Not scheduled'
              }}</strong
              ><small>Asia/Manila time</small></BaseCard
            >
          </section>
          <section class="record-actions" aria-label="Cultivation records and harvest">
            <RouterLink :to="`/app/cultivations/${cultivation.id}/growth`">
              <span>Growth</span><strong>Measurements and chart</strong><small>›</small>
            </RouterLink>
            <RouterLink :to="`/app/cultivations/${cultivation.id}/records`">
              <span>Farm records</span><strong>Feeding, mortality, and water</strong
              ><small>›</small>
            </RouterLink>
            <RouterLink :to="`/app/cultivations/${cultivation.id}/harvest`">
              <span>Harvest</span><strong>Readiness and completion</strong><small>›</small>
            </RouterLink>
          </section>
          <BaseCard class="setup-card" padding="md">
            <h2>Culture setup</h2>
            <dl>
              <div>
                <dt>Dimensions</dt>
                <dd>
                  {{ cultivation.dimensions.lengthM }} × {{ cultivation.dimensions.widthM }} ×
                  {{ cultivation.dimensions.waterDepthM }} m
                </dd>
              </div>
              <div>
                <dt>Water volume estimate</dt>
                <dd>{{ cultivation.estimatedWaterVolumeM3 }} m³</dd>
              </div>
              <div>
                <dt>Stocked</dt>
                <dd>
                  {{
                    cultivation.stockedOn
                      ? formatManilaDate(cultivation.stockedOn)
                      : 'Not yet stocked'
                  }}
                </dd>
              </div>
            </dl>
          </BaseCard>
          <BaseCard class="supplies-card" padding="md">
            <div>
              <p>Optional farm supplies</p>
              <h2>Shop for this cultivation</h2>
            </div>
            <BaseButton
              :to="{
                path: '/app/marketplace',
                query: {
                  speciesId: cultivation.species.id,
                  environmentId: cultivation.environment.id,
                },
              }"
              variant="secondary"
            >
              Browse relevant supplies
            </BaseButton>
          </BaseCard>
          <p class="disclaimer">
            <strong>Estimate notice:</strong> {{ cultivation.recommendationDisclaimer }}
          </p>
        </template>

        <template v-else>
          <LoadingState v-if="timelineQuery.isPending.value" compact label="Loading timeline…" />
          <ErrorState v-else-if="timelineQuery.isError.value" @retry="timelineQuery.refetch()" />
          <ol v-else class="timeline">
            <li
              v-for="event in timelineQuery.data.value?.data.events"
              :key="event.id"
              :class="`timeline--${event.status.toLowerCase()}`"
            >
              <span aria-hidden="true" />
              <div>
                <StatusChip
                  :label="event.status"
                  :tone="
                    event.status === 'CURRENT'
                      ? 'info'
                      : event.status === 'COMPLETED'
                        ? 'success'
                        : 'neutral'
                  "
                />
                <h2>{{ event.label }}</h2>
                <p>{{ event.detail }}</p>
                <small>{{
                  event.occurredOn
                    ? formatManilaDate(event.occurredOn)
                    : event.estimatedOn
                      ? `Estimated ${formatManilaDate(event.estimatedOn)}`
                      : ''
                }}</small>
              </div>
            </li>
          </ol>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.hero h1,
.hero p {
  margin: 0;
}
.hero h1 {
  margin-top: var(--space-2);
  font-size: 1.75rem;
}
.hero p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.hero > strong {
  color: var(--color-aqua-700);
  font-size: 1.5rem;
}
.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.tabs button {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  font-weight: 750;
}
.tabs button[aria-current='page'] {
  color: var(--color-brand-800);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.metrics article {
  display: grid;
  gap: var(--space-1);
}
.metrics span,
.metrics small {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.metrics strong {
  font-size: 1rem;
}
.setup-card h2,
.setup-card dl,
.setup-card dt,
.setup-card dd {
  margin: 0;
}
.record-actions {
  display: grid;
  gap: var(--space-2);
}
.record-actions a {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-3);
  min-height: 4.5rem;
  align-content: center;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: inherit;
  background: var(--color-surface);
  text-decoration: none;
}
.record-actions a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.record-actions span,
.record-actions strong {
  grid-column: 1;
}
.record-actions span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.record-actions strong {
  font-size: 0.85rem;
}
.record-actions small {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  color: var(--color-brand-700);
  font-size: 1.5rem;
}
.setup-card h2 {
  font-size: 1rem;
}
.setup-card dl {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.setup-card dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.setup-card dt {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.setup-card dd {
  font-size: 0.75rem;
  font-weight: 750;
  text-align: right;
}
.disclaimer {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.75rem;
  line-height: 1.5;
}
.supplies-card {
  display: grid;
  gap: var(--space-3);
  background: linear-gradient(145deg, white, var(--color-brand-50));
}
.supplies-card p,
.supplies-card h2 {
  margin: 0;
}
.supplies-card p {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}
.supplies-card h2 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
.timeline {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.timeline li {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
}
.timeline li::before {
  position: absolute;
  top: 1rem;
  bottom: 0;
  left: 0.45rem;
  width: 2px;
  background: var(--color-border);
  content: '';
}
.timeline li:last-child::before {
  display: none;
}
.timeline li > span {
  z-index: 1;
  width: 1rem;
  height: 1rem;
  margin-top: 0.35rem;
  border: 3px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-border-strong);
  box-shadow: 0 0 0 1px var(--color-border-strong);
}
.timeline--current > span {
  background: var(--color-brand-600) !important;
}
.timeline h2,
.timeline p,
.timeline small {
  margin: 0;
}
.timeline h2 {
  margin-top: var(--space-2);
  font-size: 1rem;
}
.timeline p,
.timeline small {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
</style>
