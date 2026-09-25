<script setup lang="ts">
import { ref, toRef } from 'vue'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import StatusChip from '@components/ui/StatusChip.vue'
import { formatManilaDate, formatQuantity } from '@core/utils/format'

import { mortalityReasonLabel } from '../../domain/cultivations.model'
import { useMortalityRecords } from '../composables/useMortalityRecords'
import MortalityRecordSheet from './MortalityRecordSheet.vue'
import RecordCard from './RecordCard.vue'
import RecordSectionHeading from './RecordSectionHeading.vue'

// Recorded losses, which keep the live-fish estimate auditable, with the form to add one.
const props = defineProps<{ cultivationId: string }>()

const { records, loading, loadFailed, refetch } = useMortalityRecords(toRef(props, 'cultivationId'))
const adding = ref(false)
</script>

<template>
  <RecordSectionHeading
    title="Mortality records"
    description="Keep the stock estimate auditable."
    @add="adding = true"
  />
  <LoadingState v-if="loading" label="Loading mortality…" />
  <ErrorState v-else-if="loadFailed" @retry="refetch()" />
  <EmptyState
    v-else-if="!records.length"
    title="No mortality recorded"
    message="Add a record only when a loss is observed."
  />
  <template v-else>
    <RecordCard
      v-for="record in records"
      :key="record.id"
      :footer="`${formatManilaDate(record.occurredOn)} · ${record.recordedBy.fullName}`"
    >
      <template #heading>
        <strong>{{ formatQuantity(record.fishCount, 'COUNT') }} fish</strong>
        <StatusChip :label="mortalityReasonLabel(record.reason)" tone="warning" icon="warning" />
      </template>
      <p>{{ record.notes || 'No notes recorded.' }}</p>
    </RecordCard>
  </template>

  <MortalityRecordSheet :cultivation-id="cultivationId" :open="adding" @close="adding = false" />
</template>
