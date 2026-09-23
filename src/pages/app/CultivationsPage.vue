<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { listCultivations, operationalQueryKeys } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import { formatManilaTime } from '@/utils/format'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()
const query = useQuery({
  queryKey: operationalQueryKeys.cultivations,
  queryFn: () => listCultivations(session.accessToken!, 100),
})
const view = computed<'all' | 'active' | 'completed'>(() => {
  const value = String(route.query.view ?? 'all')
  return value === 'active' || value === 'completed' ? value : 'all'
})
const cultivations = computed(() => {
  const records = query.data.value?.data ?? []
  if (view.value === 'completed') return records.filter((record) => record.status === 'COMPLETED')
  if (view.value === 'active')
    return records.filter((record) => !['COMPLETED', 'CANCELLED'].includes(record.status))
  return records
})

function chooseView(nextView: 'all' | 'active' | 'completed') {
  router.replace({ query: nextView === 'all' ? {} : { view: nextView } })
}
</script>

<template>
  <div class="section-page">
    <AppHeader title="Cultivations" subtitle="Your grow-out cycles" />
    <main class="section-page__content">
      <nav class="filters" aria-label="Filter cultivations">
        <button
          v-for="option in ['all', 'active', 'completed'] as const"
          :key="option"
          type="button"
          :aria-current="view === option ? 'page' : undefined"
          @click="chooseView(option)"
        >
          {{ option[0]?.toUpperCase() + option.slice(1) }}
        </button>
      </nav>
      <LoadingState v-if="query.isPending.value" label="Loading cultivations…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else>
        <RouterLink
          v-for="cultivation in cultivations"
          :key="cultivation.id"
          class="cultivation-link"
          :to="`/app/cultivations/${cultivation.id}`"
        >
          <BaseCard class="active-cultivation" padding="lg">
            <div class="active-cultivation__heading">
              <div>
                <StatusChip :label="cultivation.status.replace('_', ' ')" tone="success" />
                <h2>{{ cultivation.name }}</h2>
                <p>{{ cultivation.species.commonName }} · {{ cultivation.environment.name }}</p>
              </div>
              <span aria-hidden="true">›</span>
            </div>
            <div
              class="progress"
              role="progressbar"
              aria-label="Cultivation progress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="cultivation.progressPercent"
            >
              <span :style="{ width: `${cultivation.progressPercent}%` }" />
            </div>
            <dl>
              <div>
                <dt>Live fish estimate</dt>
                <dd>{{ cultivation.estimatedLiveFish.toLocaleString() }}</dd>
              </div>
              <div>
                <dt>Next task</dt>
                <dd>
                  {{
                    cultivation.nextTaskAt
                      ? formatManilaTime(cultivation.nextTaskAt)
                      : 'None scheduled'
                  }}
                </dd>
              </div>
            </dl>
          </BaseCard>
        </RouterLink>
        <BaseCard v-if="cultivations.length === 0" padding="none">
          <EmptyState
            v-if="view === 'completed'"
            title="No completed cultivations"
            message="A cultivation will appear here after a harvest is recorded."
          />
          <EmptyState
            v-else
            title="No cultivations here"
            message="Start a guided setup to create your first cultivation plan."
            action-label="Start cultivation"
            action-to="/setup"
          />
        </BaseCard>
      </template>
    </main>
  </div>
</template>

<style scoped>
.section-page__content {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.cultivation-link {
  color: inherit;
  text-decoration: none;
}
.filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-neutral-100);
}
.filters button {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  font-weight: 750;
}
.filters button[aria-current='page'] {
  color: var(--color-brand-800);
  background: white;
  box-shadow: var(--shadow-sm);
}
.cultivation-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: var(--radius-lg);
}
.active-cultivation {
  display: grid;
  gap: var(--space-4);
  border-color: var(--color-brand-200);
  background: linear-gradient(145deg, var(--color-surface), var(--color-brand-50));
}
.active-cultivation__heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.active-cultivation__heading > span {
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
.progress {
  height: 0.4rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-neutral-200);
}
.progress span {
  display: block;
  height: 100%;
  background: var(--color-aqua-600);
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
