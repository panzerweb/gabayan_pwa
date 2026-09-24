<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import { ROUTE_NAMES } from '@router/route-names'

import CultivationFeedingSummary from '../components/CultivationFeedingSummary.vue'
import CultivationHarvestSummary from '../components/CultivationHarvestSummary.vue'
import CultivationHero from '../components/CultivationHero.vue'
import CultivationRecordLinks from '../components/CultivationRecordLinks.vue'
import CultivationSectionTabs from '../components/CultivationSectionTabs.vue'
import CultivationSetupCard from '../components/CultivationSetupCard.vue'
import CultivationStockSummary from '../components/CultivationStockSummary.vue'
import CultivationSuppliesCard from '../components/CultivationSuppliesCard.vue'
import CultivationTimeline from '../components/CultivationTimeline.vue'
import { useCultivationDetail } from '../composables/useCultivationDetail'
import { useCultivationSection } from '../composables/useCultivationSection'
import { useCultivationTimeline } from '../composables/useCultivationTimeline'

const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { section, selectSection } = useCultivationSection(cultivationId)
const { cultivation, loading, loadFailed, refetch } = useCultivationDetail(cultivationId)
const timeline = useCultivationTimeline(
  cultivationId,
  computed(() => section.value === 'timeline'),
)
</script>

<template>
  <div>
    <AppHeader
      :title="cultivation?.name ?? 'Cultivation'"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivations }"
    />
    <main class="detail-page">
      <LoadingState v-if="loading" label="Loading cultivation…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="cultivation">
        <CultivationHero :cultivation="cultivation" />
        <CultivationSectionTabs
          :selected="section"
          :cultivation-id="cultivation.id"
          @select="selectSection"
        />

        <template v-if="section === 'overview'">
          <CultivationStockSummary :cultivation="cultivation" />
          <CultivationFeedingSummary :feeding="cultivation.feedingSummary" />
          <CultivationHarvestSummary :harvest="cultivation.harvestSummary" />
          <CultivationRecordLinks :cultivation-id="cultivation.id" />
          <CultivationSetupCard :cultivation="cultivation" />
          <CultivationSuppliesCard :cultivation="cultivation" />
          <p class="disclaimer">
            <strong>Estimate notice:</strong> {{ cultivation.recommendationDisclaimer }}
          </p>
        </template>

        <CultivationTimeline
          v-else
          :timeline="timeline.timeline.value"
          :loading="timeline.loading.value"
          :failed="timeline.loadFailed.value"
          @retry="timeline.refetch()"
        />
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
.disclaimer {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.75rem;
  line-height: 1.5;
}
</style>
