<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import AppHeader from '@components/navigation/AppHeader.vue'
import { ROUTE_NAMES } from '@router/route-names'

import type { FarmTask } from '../../domain/cultivations.model'
import FeedingCompletionSheet from '../components/FeedingCompletionSheet.vue'
import TaskCard from '../components/TaskCard.vue'
import { useCultivationTasks } from '../composables/useCultivationTasks'

const route = useRoute()
const cultivationId = computed(() => String(route.params.cultivationId))
const selectedTask = ref<FarmTask | null>(null)
const { tasks, loading, loadFailed, refetch } = useCultivationTasks(cultivationId)
</script>

<template>
  <div>
    <AppHeader
      title="Daily tasks"
      show-back
      :back-to="{ name: ROUTE_NAMES.cultivationDetail, params: { cultivationId } }"
    />
    <main class="tasks-page">
      <LoadingState v-if="loading" label="Loading tasks…" />
      <ErrorState v-else-if="loadFailed" @retry="refetch()" />
      <template v-else>
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          actionable
          @select="selectedTask = $event"
        />
        <EmptyState
          v-if="tasks.length === 0"
          title="No tasks scheduled"
          message="Guidance tasks for this cultivation will appear here."
        />
      </template>
    </main>
    <FeedingCompletionSheet
      :open="Boolean(selectedTask)"
      :task="selectedTask"
      @close="selectedTask = null"
    />
  </div>
</template>

<style scoped>
.tasks-page {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-7);
}
</style>
