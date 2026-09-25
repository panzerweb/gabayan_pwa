<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import WeatherAlertsCard from '@pages/weather-alerts/presentation/components/WeatherAlertsCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import EducationalTipCard from '../components/EducationalTipCard.vue'
import HomeGreeting from '../components/HomeGreeting.vue'
import HomeTaskList from '../components/HomeTaskList.vue'
import PrimaryCultivationCard from '../components/PrimaryCultivationCard.vue'
import { useHomeDashboard } from '../composables/useHomeDashboard'

const { dashboard, headline, unreadCount, loading, loadFailed, refetch } = useHomeDashboard()
</script>

<template>
  <div class="home-page">
    <AppHeader show-brand :notification-count="unreadCount" />
    <main class="home-page__content">
      <LoadingState v-if="loading" label="Loading today’s guidance…" />
      <ErrorState
        v-else-if="loadFailed"
        message="We couldn’t load your dashboard. Check your connection and try again."
        @retry="refetch()"
      />
      <template v-else-if="dashboard">
        <HomeGreeting :name="dashboard.greetingName" :headline="headline" />
        <BaseCard v-if="!dashboard.primaryCultivation" padding="none">
          <EmptyState
            title="Start your first cultivation"
            message="Complete the guided setup to receive a demo stocking estimate and create your cultivation plan."
            action-label="Start cultivation setup"
            :action-to="{ name: ROUTE_NAMES.setupIntro }"
          />
        </BaseCard>
        <template v-else>
          <PrimaryCultivationCard
            :cultivation="dashboard.primaryCultivation"
            :overview="dashboard.farmOverview"
          />
          <HomeTaskList :tasks="dashboard.tasks" :summary="dashboard.taskSummary" />
        </template>
        <WeatherAlertsCard />
        <EducationalTipCard v-if="dashboard.primaryCultivation" :tip="dashboard.tip" />
      </template>
    </main>
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
</style>
