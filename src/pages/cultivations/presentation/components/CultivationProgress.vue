<script setup lang="ts">
// The share of the estimated grow-out already behind a cultivation, as the server reports it.
defineProps<{ percent: number }>()
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    aria-label="Cultivation progress"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percent"
  >
    <span :style="{ width: `${percent}%` }" />
  </div>
</template>

<style scoped>
.progress {
  height: 0.4rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-neutral-200);
}
.progress span {
  display: block;
  height: 100%;
  background: var(--color-aqua-600);
}
</style>
