<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import WaterLogPanel from '@pages/water-quality/presentation/components/WaterLogPanel.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { useCultivationDetail } from '../composables/useCultivationDetail'

// The saved water readings of this cultivation (Pro), with their trend and history.
const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { cultivation, loading, loadFailed, refetch } = useCultivationDetail(cultivationId)
const closed = computed(() => ['COMPLETED', 'CANCELLED'].includes(cultivation.value?.status ?? ''))
</script>

<template>
  <div>
    <AppHeader
      title="Water log"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId } }"
    />
    <main class="water-log-page">
      <LoadingState v-if="loading" label="Loading your cultivation…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="cultivation">
        <p class="water-log-page__context">
          {{ cultivation.name }} · {{ cultivation.species.commonName }} in a
          {{ cultivation.environment.name.toLowerCase() }}
        </p>
        <WaterLogPanel
          :cultivation-id="cultivationId"
          :species-id="cultivation.species.id"
          :environment-id="cultivation.environment.id"
          :closed="closed"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.water-log-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.water-log-page__context {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 650;
}
</style>
