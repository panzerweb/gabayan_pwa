<script setup lang="ts">
import { formatThresholdRange, type WaterThreshold } from '../../domain/water-quality.model'

// The suggested range of each water parameter, with a plain explanation and where the
// figure comes from.
defineProps<{ thresholds: WaterThreshold[] }>()
</script>

<template>
  <ul class="water-ranges" aria-label="Suggested water ranges">
    <li v-for="threshold in thresholds" :key="threshold.parameter" class="water-range">
      <div class="water-range__heading">
        <strong>{{ threshold.name }}</strong>
        <span class="water-range__value">{{ formatThresholdRange(threshold) }}</span>
      </div>
      <p class="water-range__explanation">{{ threshold.explanation }}</p>
      <p class="water-range__basis">{{ threshold.basis }}</p>
    </li>
  </ul>
</template>

<style scoped>
.water-ranges {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.water-range {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.water-range__heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2);
}
.water-range__value {
  color: var(--color-brand-800);
  font-weight: 750;
}
.water-range__explanation,
.water-range__basis {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
}
.water-range__basis {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}
</style>
