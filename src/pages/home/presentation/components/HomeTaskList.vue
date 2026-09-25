<script setup lang="ts">
import { computed, ref } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'
import type { FarmTask } from '@pages/cultivations/domain/cultivations.model'
import FeedingCompletionSheet from '@pages/cultivations/presentation/components/FeedingCompletionSheet.vue'
import TaskCard from '@pages/cultivations/presentation/components/TaskCard.vue'

import { tasksRemaining, type TaskSummary } from '../../domain/home.model'

// Today's tasks with their progress; an open feeding task opens the completion sheet.
const props = defineProps<{ tasks: FarmTask[]; summary: TaskSummary }>()

const selectedTask = ref<FarmTask | null>(null)
const allDone = computed(() => tasksRemaining(props.summary) === 0)
</script>

<template>
  <section class="home-tasks" aria-labelledby="today-heading">
    <div class="home-tasks__heading">
      <div>
        <p class="home-tasks__eyebrow">Daily guidance</p>
        <h2 id="today-heading">Today’s tasks</h2>
      </div>
      <span>{{ summary.completed }} of {{ summary.total }} done</span>
    </div>
    <p v-if="allDone" class="home-tasks__all-done" role="status">
      All planned tasks are complete for today.
    </p>
    <TaskCard
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      actionable
      @select="selectedTask = $event"
    />
    <BaseCard v-if="tasks.length === 0" padding="md">
      <p class="home-tasks__quiet">No tasks are scheduled for today.</p>
    </BaseCard>
    <FeedingCompletionSheet
      :open="Boolean(selectedTask)"
      :task="selectedTask"
      @close="selectedTask = null"
    />
  </section>
</template>

<style scoped>
.home-tasks {
  display: grid;
  gap: var(--space-3);
}
.home-tasks__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.home-tasks__heading > span {
  color: var(--color-brand-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.home-tasks h2,
.home-tasks p {
  margin: 0;
}
.home-tasks__eyebrow {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.home-tasks h2 {
  margin-top: var(--space-1);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.home-tasks__all-done,
.home-tasks__quiet {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.home-tasks__all-done {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-success-800);
  background: var(--color-success-100);
  font-weight: 700;
}
</style>
