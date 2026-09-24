<script setup lang="ts">
import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import CultivationCard from '../components/CultivationCard.vue'
import CultivationFilterTabs from '../components/CultivationFilterTabs.vue'
import { useCultivations } from '../composables/useCultivations'

const { cultivations, view, selectView, loading, loadFailed, refetch } = useCultivations()
</script>

<template>
  <div class="section-page">
    <AppHeader title="Cultivations" subtitle="Your grow-out cycles" />
    <main class="section-page__content">
      <CultivationFilterTabs :selected="view" @select="selectView" />
      <LoadingState v-if="loading" label="Loading cultivations…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else>
        <CultivationCard
          v-for="cultivation in cultivations"
          :key="cultivation.id"
          :cultivation="cultivation"
        />
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
            :action-to="{ name: ROUTE_NAMES.setupIntro }"
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
</style>
