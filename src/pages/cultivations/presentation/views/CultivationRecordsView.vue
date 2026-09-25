<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@components/navigation/AppHeader.vue'
import { ROUTE_NAMES } from '@router/route-names'

import FeedingPlanTab from '../components/FeedingPlanTab.vue'
import FeedingRecordsTab from '../components/FeedingRecordsTab.vue'
import MortalityRecordsTab from '../components/MortalityRecordsTab.vue'
import RecordsTabs from '../components/RecordsTabs.vue'
import WaterChecksTab from '../components/WaterChecksTab.vue'
import { useRecordsTab } from '../composables/useRecordsTab'

const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { tab, selectTab } = useRecordsTab(cultivationId)
</script>

<template>
  <div>
    <AppHeader
      title="Farm records"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId } }"
    />
    <main class="records-page">
      <RecordsTabs :selected="tab" @select="selectTab" />
      <FeedingRecordsTab v-if="tab === 'feeding'" :cultivation-id="cultivationId" />
      <MortalityRecordsTab v-else-if="tab === 'mortality'" :cultivation-id="cultivationId" />
      <WaterChecksTab v-else-if="tab === 'water'" :cultivation-id="cultivationId" />
      <FeedingPlanTab v-else :cultivation-id="cultivationId" />
    </main>
  </div>
</template>

<style scoped>
.records-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
</style>
