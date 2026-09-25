<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import { ROUTE_NAMES } from '@router/route-names'

import FeedConversionCard from '../components/FeedConversionCard.vue'
import { useCultivationDetail } from '../composables/useCultivationDetail'
import { useFeedConversion } from '../composables/useFeedConversion'

// The feed conversion ratio of this cultivation (Pro), worked out by the server from its
// feeding, growth and mortality records.
const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const { cultivation } = useCultivationDetail(cultivationId)
const { conversion, loading, loadFailed, requiredTier, refetch } = useFeedConversion(cultivationId)
</script>

<template>
  <div>
    <AppHeader
      title="Feed conversion"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId } }"
    />
    <main class="fcr-page">
      <p v-if="cultivation" class="fcr-page__context">{{ cultivation.name }}</p>
      <EmptyState
        v-if="requiredTier"
        title="Feed conversion is part of Pro"
        message="Pro works out how much feed went into each kilogram your fish gained, from the records you already keep."
        action-label="See plans"
        :action-to="{ name: ROUTE_NAMES.plans, query: { required: requiredTier } }"
      />
      <LoadingState v-else-if="loading" label="Working out your feed conversion…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <FeedConversionCard v-else-if="conversion" :conversion="conversion" />
    </main>
  </div>
</template>

<style scoped>
.fcr-page {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
.fcr-page__context {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 650;
}
</style>
