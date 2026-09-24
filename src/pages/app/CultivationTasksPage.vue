<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'

import FeedingCompletionSheet from '@/components/cultivations/FeedingCompletionSheet.vue'
import TaskCard from '@/components/cultivations/TaskCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import AppHeader from '@/components/navigation/AppHeader.vue'
import { listTasks, operationalQueryKeys, type FarmTask } from '@/services/api'
import { useSessionStore } from '@stores/session.store'

const route = useRoute()
const session = useSessionStore()
const cultivationId = computed(() => String(route.params.cultivationId))
const selectedTask = ref<FarmTask | null>(null)
const query = useQuery({
  queryKey: computed(() => operationalQueryKeys.tasks(cultivationId.value)),
  queryFn: () => listTasks(session.accessToken!, { cultivationId: cultivationId.value }),
})
</script>

<template>
  <div>
    <AppHeader title="Daily tasks" show-back :back-to="`/app/cultivations/${cultivationId}`" />
    <main class="tasks-page">
      <LoadingState v-if="query.isPending.value" label="Loading tasks…" />
      <ErrorState v-else-if="query.isError.value" @retry="query.refetch()" />
      <template v-else>
        <TaskCard
          v-for="task in query.data.value?.data"
          :key="task.id"
          :task="task"
          actionable
          @select="selectedTask = $event"
        />
        <EmptyState
          v-if="query.data.value?.data.length === 0"
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
