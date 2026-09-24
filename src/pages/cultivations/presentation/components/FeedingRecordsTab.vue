<script setup lang="ts">
import { toRef } from 'vue'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import { formatManilaDate, formatManilaTime, formatQuantity } from '@core/utils/format'

import { useFeedingRecords } from '../composables/useFeedingRecords'
import RecordCard from './RecordCard.vue'

// Feedings saved from completed feeding tasks. There is no form here: a feeding is recorded
// by completing its task.
const props = defineProps<{ cultivationId: string }>()

const { records, loading, loadFailed, refetch } = useFeedingRecords(toRef(props, 'cultivationId'))
</script>

<template>
  <LoadingState v-if="loading" label="Loading feeding records…" />
  <ErrorState v-else-if="loadFailed" @retry="refetch()" />
  <EmptyState
    v-else-if="!records.length"
    title="No feeding records"
    message="Complete a feeding task to add the first record."
  />
  <template v-else>
    <RecordCard
      v-for="record in records"
      :key="record.id"
      :footer="`${formatManilaDate(record.fedAt)} · ${record.recordedBy.fullName}`"
    >
      <template #heading>
        <strong>{{ formatQuantity(record.amount.value, record.amount.unit) }}</strong>
        <span>{{ formatManilaTime(record.fedAt) }}</span>
      </template>
      <p>{{ record.notes || 'No notes recorded.' }}</p>
    </RecordCard>
  </template>
</template>
