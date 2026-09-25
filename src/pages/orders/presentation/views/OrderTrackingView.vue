<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import { ROUTE_NAMES } from '@router/route-names'

import TrackingSummary from '../components/TrackingSummary.vue'
import TrackingTimeline from '../components/TrackingTimeline.vue'
import { useOrderTracking } from '../composables/useOrderTracking'

const route = useRoute()
const orderId = computed(() => String(route.params.orderId))

const { tracking, loading, loadFailed, refetch } = useOrderTracking(orderId)
</script>

<template>
  <div>
    <AppHeader
      title="Track order"
      show-back
      :back-to="{ name: ROUTE_NAMES.orderDetail, params: { orderId } }"
    />
    <main class="tracking-page">
      <LoadingState v-if="loading" label="Loading delivery progress…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else-if="tracking">
        <TrackingSummary :tracking="tracking" />
        <TrackingTimeline v-if="tracking.events.length" :events="tracking.events" />
        <EmptyState
          v-else
          icon="truck"
          title="No delivery updates yet"
          message="Updates appear here as soon as the seller prepares your order."
        />
        <p class="delivery-note">Delivery updates come from the courier and may change.</p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.tracking-page {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.delivery-note {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: 0.7rem;
  text-align: center;
}
</style>
