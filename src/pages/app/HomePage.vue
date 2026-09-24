<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import type { FarmTask } from '@pages/cultivations/domain/cultivations.model'
import FeedingCompletionSheet from '@pages/cultivations/presentation/components/FeedingCompletionSheet.vue'
import TaskCard from '@pages/cultivations/presentation/components/TaskCard.vue'
import { getHomeDashboard, operationalQueryKeys } from '@/services/api'
import { useSessionStore } from '@stores/session.store'
import { formatQuantity, manilaDateToday } from '@core/utils/format'

const session = useSessionStore()
const today = manilaDateToday()
const selectedTask = ref<FarmTask | null>(null)
const query = useQuery({
  queryKey: operationalQueryKeys.home(today),
  queryFn: () => getHomeDashboard(today, session.accessToken!),
})
const dashboard = computed(() => query.data.value?.data)
const tasksLeft = computed(() => {
  const summary = dashboard.value?.taskSummary
  return summary ? Math.max(summary.total - summary.completed, 0) : 0
})
</script>

<template>
  <div class="home-page">
    <AppHeader show-brand :notification-count="dashboard?.unreadNotificationCount ?? 0" />
    <main class="home-page__content">
      <LoadingState v-if="query.isPending.value" label="Loading today’s guidance…" />
      <ErrorState
        v-else-if="query.isError.value"
        message="We couldn’t load your dashboard. Check your connection and try again."
        @retry="query.refetch()"
      />
      <template v-else-if="dashboard">
        <section class="home-page__greeting">
          <p>Good day, {{ dashboard.greetingName }}</p>
          <h1>
            {{ dashboard.primaryCultivation ? 'Here’s today’s farm plan.' : 'Ready when you are.' }}
          </h1>
        </section>

        <BaseCard v-if="!dashboard.primaryCultivation" padding="none">
          <EmptyState
            title="Start your first cultivation"
            message="Complete the guided setup to receive a demo stocking estimate and create your cultivation plan."
            action-label="Start cultivation setup"
            action-to="/setup"
          />
        </BaseCard>

        <template v-else>
          <BaseCard class="cultivation-summary" padding="lg" elevated>
            <div class="cultivation-summary__topline">
              <div>
                <p class="eyebrow">Active cultivation</p>
                <h2>{{ dashboard.primaryCultivation.name }}</h2>
                <p class="cultivation-summary__environment">
                  {{ dashboard.primaryCultivation.species.commonName }} ·
                  {{ dashboard.primaryCultivation.environment.name }}
                </p>
              </div>
              <StatusChip
                :label="
                  dashboard.primaryCultivation.dayNumber
                    ? `Day ${dashboard.primaryCultivation.dayNumber}`
                    : 'Planning'
                "
                tone="success"
              />
            </div>
            <div
              class="progress"
              role="progressbar"
              aria-label="Cultivation progress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="dashboard.primaryCultivation.progressPercent"
            >
              <span :style="{ width: `${dashboard.primaryCultivation.progressPercent}%` }" />
            </div>
            <div class="cultivation-summary__metrics">
              <div>
                <span>Average weight</span>
                <strong v-if="dashboard.farmOverview?.estimatedAverageWeight">
                  {{
                    formatQuantity(
                      dashboard.farmOverview.estimatedAverageWeight.value,
                      dashboard.farmOverview.estimatedAverageWeight.unit,
                    )
                  }}
                </strong>
                <strong v-else>Not recorded</strong>
              </div>
              <div>
                <span>Est. harvest</span>
                <strong>{{ dashboard.farmOverview?.daysUntilHarvest ?? '—' }} days</strong>
              </div>
            </div>
            <BaseButton
              :to="`/app/cultivations/${dashboard.primaryCultivation.id}`"
              variant="secondary"
            >
              View cultivation
            </BaseButton>
          </BaseCard>

          <section class="home-section" aria-labelledby="today-heading">
            <div class="home-section__heading">
              <div>
                <p class="eyebrow">Daily guidance</p>
                <h2 id="today-heading">Today’s tasks</h2>
              </div>
              <span
                >{{ dashboard.taskSummary.completed }} of
                {{ dashboard.taskSummary.total }} done</span
              >
            </div>
            <p v-if="tasksLeft === 0" class="all-done" role="status">
              All planned tasks are complete for today.
            </p>
            <TaskCard
              v-for="task in dashboard.tasks"
              :key="task.id"
              :task="task"
              actionable
              @select="selectedTask = $event"
            />
            <BaseCard v-if="dashboard.tasks.length === 0" padding="md">
              <p class="quiet-copy">No tasks are scheduled for today.</p>
            </BaseCard>
          </section>

          <BaseCard class="tip-card" padding="md">
            <div class="tip-card__heading">
              <p class="eyebrow">Today’s learning tip</p>
              <StatusChip
                :label="
                  dashboard.tip.sourceStatus === 'DEMO'
                    ? 'Demo guidance'
                    : dashboard.tip.sourceStatus
                "
                tone="warning"
              />
            </div>
            <h2>{{ dashboard.tip.title }}</h2>
            <p>{{ dashboard.tip.message }}</p>
            <small v-if="dashboard.tip.disclaimer">{{ dashboard.tip.disclaimer }}</small>
          </BaseCard>
        </template>
      </template>
    </main>
    <FeedingCompletionSheet
      :open="Boolean(selectedTask)"
      :task="selectedTask"
      @close="selectedTask = null"
    />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100%;
}
.home-page__content {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.home-page__greeting p,
.home-page__greeting h1,
.eyebrow {
  margin: 0;
}
.home-page__greeting p,
.eyebrow {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.home-page__greeting h1 {
  margin-top: var(--space-1);
  font-size: clamp(1.7rem, 7vw, 2rem);
  line-height: 1.14;
  letter-spacing: -0.04em;
}
.cultivation-summary {
  display: grid;
  gap: var(--space-4);
  overflow: hidden;
  background:
    radial-gradient(circle at 95% 0%, rgb(204 251 241 / 80%), transparent 8rem),
    var(--color-surface);
}
.cultivation-summary__topline,
.home-section__heading,
.tip-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.cultivation-summary h2,
.cultivation-summary__environment,
.home-section h2,
.tip-card h2,
.tip-card p,
.tip-card small {
  margin: 0;
}
.cultivation-summary h2,
.home-section h2,
.tip-card h2 {
  margin-top: var(--space-1);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.cultivation-summary__environment {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.progress {
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-neutral-200);
}
.progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-aqua-600);
}
.cultivation-summary__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.cultivation-summary__metrics div {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-brand-50);
}
.cultivation-summary__metrics span {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.cultivation-summary__metrics strong {
  font-size: 0.875rem;
}
.home-section {
  display: grid;
  gap: var(--space-3);
}
.home-section__heading > span {
  color: var(--color-brand-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.all-done,
.quiet-copy {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.all-done {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-success-800);
  background: var(--color-success-100);
  font-weight: 700;
}
.tip-card {
  display: grid;
  gap: var(--space-2);
  border-color: var(--color-warning-200);
  background: #fffdf5;
}
.tip-card p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}
.tip-card small {
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.45;
}
</style>
