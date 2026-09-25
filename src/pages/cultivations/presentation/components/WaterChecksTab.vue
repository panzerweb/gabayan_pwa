<script setup lang="ts">
import { ref, toRef } from 'vue'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate } from '@core/utils/format'

import { waterCheckDisplay } from '../../domain/cultivations.model'
import { useWaterChecks } from '../composables/useWaterChecks'
import RecordCard from './RecordCard.vue'
import RecordSectionHeading from './RecordSectionHeading.vue'
import WaterCheckSheet from './WaterCheckSheet.vue'
import WaterGuidanceNote from './WaterGuidanceNote.vue'

// Recorded water observations with the server's conditional guidance, and the form to add one.
const props = defineProps<{ cultivationId: string }>()

const { checks, loading, loadFailed, refetch } = useWaterChecks(toRef(props, 'cultivationId'))
const adding = ref(false)
</script>

<template>
  <RecordSectionHeading
    title="Water checks"
    description="Record observations before taking major action."
    @add="adding = true"
  />
  <LoadingState v-if="loading" label="Loading water checks…" />
  <ErrorState v-else-if="loadFailed" @retry="refetch()" />
  <EmptyState
    v-else-if="!checks.length"
    title="No water checks"
    message="Record the visible condition and fish behavior."
  />
  <template v-else>
    <RecordCard
      v-for="check in checks"
      :key="check.id"
      :footer="`${formatManilaDate(check.checkedAt)} · ${check.recordedBy.fullName}`"
    >
      <template #heading>
        <strong>{{ check.observation.clarity || 'Clarity not noted' }}</strong>
        <StatusChip v-bind="waterCheckDisplay(check.observation)" />
      </template>
      <p>{{ check.observation.fishBehavior }} · {{ check.observation.odor }}</p>
      <WaterGuidanceNote
        v-for="guidance in check.guidance"
        :key="guidance.title"
        :guidance="guidance"
      />
    </RecordCard>
  </template>

  <WaterCheckSheet :cultivation-id="cultivationId" :open="adding" @close="adding = false" />
</template>
