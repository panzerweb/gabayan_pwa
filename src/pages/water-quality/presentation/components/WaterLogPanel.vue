<script setup lang="ts">
import { computed, ref, toRef } from 'vue'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { useWaterLogs } from '../composables/useWaterLogs'
import { useWaterThresholds } from '../composables/useWaterThresholds'
import WaterLogHistory from './WaterLogHistory.vue'
import WaterLogSheet from './WaterLogSheet.vue'
import WaterLogTrend from './WaterLogTrend.vue'
import WaterProvenanceNote from './WaterProvenanceNote.vue'

// A cultivation's saved water readings (Pro): the button to log new ones, the trend of each
// parameter and the history, with the provenance of the ranges they were compared with.
// Meant for reuse by any screen that knows the cultivation and its pairing. `closed` is a
// harvested or cancelled cultivation, whose history stays readable but takes no new reading.
const props = defineProps<{
  cultivationId: string
  speciesId: string
  environmentId: string
  closed?: boolean
}>()

const { logs, loading, loadFailed, requiredTier, refetch } = useWaterLogs(
  toRef(props, 'cultivationId'),
)
const { thresholdSet } = useWaterThresholds(
  toRef(props, 'speciesId'),
  toRef(props, 'environmentId'),
)
const adding = ref(false)

const latest = computed(() => logs.value[0] ?? null)
const thresholds = computed(() => thresholdSet.value?.thresholds)
</script>

<template>
  <section class="water-log" aria-label="Water log">
    <EmptyState
      v-if="requiredTier"
      title="Saved water readings are part of Pro"
      message="Your plan includes the one-off safety check. Pro keeps every reading with its history and trend."
      icon="droplet"
      action-label="See plans"
      :action-to="{ name: ROUTE_NAMES.plans, query: { required: requiredTier } }"
    />
    <template v-else>
      <div class="water-log__actions">
        <BaseButton :disabled="closed" @click="adding = true">Log a reading</BaseButton>
        <p v-if="closed" class="water-log__closed">
          This cultivation is closed, so it takes no new readings. Its history stays here.
        </p>
      </div>
      <LoadingState v-if="loading" label="Loading your water readings…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <EmptyState
        v-else-if="!logs.length"
        title="No readings saved yet"
        message="Log what your test kit or meter shows. Each reading is kept with the range it was compared with."
        icon="droplet"
      />
      <template v-else>
        <WaterLogTrend :key="cultivationId" :logs="logs" />
        <WaterLogHistory :logs="logs" />
        <WaterProvenanceNote
          v-if="latest"
          :is-demo="latest.isDemo"
          :disclaimer="latest.disclaimer"
          :sources="thresholdSet?.sources"
        />
      </template>
    </template>

    <WaterLogSheet
      :cultivation-id="cultivationId"
      :open="adding"
      :thresholds="thresholds"
      @close="adding = false"
    />
  </section>
</template>

<style scoped>
.water-log {
  display: grid;
  gap: var(--space-5);
}
.water-log__actions {
  display: grid;
  gap: var(--space-2);
}
.water-log__closed {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
</style>
