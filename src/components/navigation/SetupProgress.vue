<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  total: number
}>()

const progress = computed(() => Math.min(100, Math.max(0, (props.current / props.total) * 100)))
</script>

<template>
  <div class="setup-progress">
    <div class="setup-progress__labels">
      <span>Step {{ current }} of {{ total }}</span>
      <span>{{ Math.round(progress) }}%</span>
    </div>
    <div
      class="setup-progress__track"
      role="progressbar"
      :aria-valuenow="current"
      aria-valuemin="1"
      :aria-valuemax="total"
      :aria-label="`Setup progress: step ${current} of ${total}`"
    >
      <span :style="{ width: `${progress}%` }" />
    </div>
  </div>
</template>

<style scoped>
.setup-progress {
  display: grid;
  gap: var(--space-2);
}

.setup-progress__labels {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.setup-progress__track {
  height: 0.375rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-brand-100);
}

.setup-progress__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-brand-600), var(--color-aqua-600));
  transition: width 240ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .setup-progress__track span {
    transition: none;
  }
}
</style>
