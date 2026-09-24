<script setup lang="ts">
import { toRef } from 'vue'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'

import { useWaterThresholds } from '../composables/useWaterThresholds'
import WaterProvenanceNote from './WaterProvenanceNote.vue'
import WaterRangeList from './WaterRangeList.vue'

// The suggested water ranges of one species in one culture system, with every loading,
// empty and error state. Meant for reuse by any screen that knows the pairing.
const props = defineProps<{ speciesId: string; environmentId: string }>()

const { thresholdSet, loading, loadFailed, incompatibleMessage, refetch } = useWaterThresholds(
  toRef(props, 'speciesId'),
  toRef(props, 'environmentId'),
)
</script>

<template>
  <section class="water-thresholds" aria-label="Water ranges">
    <LoadingState v-if="loading" label="Loading suggested water ranges…" />
    <p v-else-if="incompatibleMessage" class="water-thresholds__notice" role="alert">
      {{ incompatibleMessage }}
    </p>
    <ErrorState v-else-if="loadFailed" @retry="refetch()" />
    <EmptyState
      v-else-if="!thresholdSet?.thresholds.length"
      title="No water ranges yet"
      message="Ranges for this fish and culture system are still being prepared."
    />
    <template v-else>
      <WaterRangeList :thresholds="thresholdSet.thresholds" />
      <p class="water-thresholds__guidance">{{ thresholdSet.guidance }}</p>
      <WaterProvenanceNote
        :is-demo="thresholdSet.isDemo"
        :disclaimer="thresholdSet.disclaimer"
        :sources="thresholdSet.sources"
      />
    </template>
  </section>
</template>

<style scoped>
.water-thresholds {
  display: grid;
  gap: var(--space-3);
}
.water-thresholds__guidance,
.water-thresholds__notice {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
}
.water-thresholds__notice {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}
</style>
