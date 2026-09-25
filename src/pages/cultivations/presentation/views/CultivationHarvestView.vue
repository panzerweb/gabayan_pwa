<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import { ROUTE_NAMES } from '@router/route-names'

import type { HarvestCompletion } from '../../domain/cultivations.model'
import HarvestCompletionSummary from '../components/HarvestCompletionSummary.vue'
import HarvestForm from '../components/HarvestForm.vue'
import HarvestMonitorCard from '../components/HarvestMonitorCard.vue'
import HarvestReadinessCard from '../components/HarvestReadinessCard.vue'
import { useHarvestReadiness } from '../composables/useHarvestReadiness'

const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { readiness, canRecord, loading, loadFailed, refetch } = useHarvestReadiness(cultivationId)
// The server's answer to this visit's harvest, shown in place of the form once recorded.
const completion = ref<HarvestCompletion | null>(null)
</script>

<template>
  <div>
    <AppHeader
      title="Harvest readiness"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId } }"
    />
    <main class="harvest-page">
      <HarvestCompletionSummary v-if="completion" :completion="completion" />
      <LoadingState v-else-if="loading" label="Checking harvest readiness…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="readiness">
        <HarvestReadinessCard :readiness="readiness" />
        <HarvestForm
          v-if="canRecord"
          :cultivation-id="cultivationId"
          @completed="completion = $event"
        />
        <HarvestMonitorCard v-else :cultivation-id="cultivationId" />
      </template>
    </main>
  </div>
</template>

<style scoped>
.harvest-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
</style>
