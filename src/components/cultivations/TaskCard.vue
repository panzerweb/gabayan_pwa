<script setup lang="ts">
import { computed } from 'vue'

import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import type { FarmTask } from '@/services/api'
import { formatManilaTime, formatQuantity } from '@/utils/format'

const props = defineProps<{ task: FarmTask; actionable?: boolean }>()
const emit = defineEmits<{ select: [task: FarmTask] }>()

const icon = computed<AppIconName>(() => {
  if (props.task.status === 'COMPLETED') return 'check'
  if (props.task.type === 'WATER_CHECK') return 'droplet'
  return 'fish'
})
const statusTone = computed(() =>
  props.task.status === 'COMPLETED'
    ? 'success'
    : props.task.status === 'MISSED'
      ? 'danger'
      : 'info',
)
</script>

<template>
  <BaseCard
    class="task-card"
    padding="md"
    :class="{ 'task-card--complete': task.status === 'COMPLETED' }"
  >
    <span class="task-card__icon" aria-hidden="true"><AppIcon :name="icon" /></span>
    <div class="task-card__body">
      <div class="task-card__topline">
        <h3>{{ task.title }}</h3>
        <StatusChip
          :label="task.status === 'COMPLETED' ? 'Done' : task.status"
          :tone="statusTone"
        />
      </div>
      <p>{{ task.instruction }}</p>
      <p class="task-card__meta">
        {{ formatManilaTime(task.scheduledAt) }}
        <template v-if="task.recommendedAmount">
          · {{ formatQuantity(task.recommendedAmount.value, task.recommendedAmount.unit) }} planned
        </template>
      </p>
      <BaseButton
        v-if="actionable && task.type === 'FEEDING' && task.status !== 'COMPLETED'"
        variant="secondary"
        @click="emit('select', task)"
      >
        Record feeding
      </BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.task-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: var(--space-3);
}

.task-card--complete {
  background: var(--color-neutral-50);
}

.task-card__icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--color-brand-700);
  background: var(--color-brand-100);
}

.task-card--complete .task-card__icon {
  color: var(--color-success-800);
  background: var(--color-success-100);
}

.task-card__body,
.task-card__topline {
  min-width: 0;
}

.task-card__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

h3,
p {
  margin: 0;
}

h3 {
  font-size: 0.9375rem;
}

p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}

.task-card__meta {
  color: var(--color-brand-800);
  font-weight: 700;
}

.button {
  width: 100%;
  margin-top: var(--space-3);
}
</style>
