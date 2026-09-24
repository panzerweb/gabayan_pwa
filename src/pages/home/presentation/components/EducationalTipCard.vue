<script setup lang="ts">
import { computed } from 'vue'

import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'

import { tipSourceDisplay, type EducationalTip } from '../../domain/home.model'

// General learning guidance, always shown with its review status and disclaimer.
const props = defineProps<{ tip: EducationalTip }>()

const source = computed(() => tipSourceDisplay(props.tip))
</script>

<template>
  <BaseCard class="tip-card" padding="md">
    <div class="tip-card__heading">
      <p class="tip-card__eyebrow">Today’s learning tip</p>
      <StatusChip :label="source.label" :tone="source.tone" :icon="source.icon" />
    </div>
    <h2>{{ tip.title }}</h2>
    <p>{{ tip.message }}</p>
    <small v-if="tip.disclaimer">{{ tip.disclaimer }}</small>
  </BaseCard>
</template>

<style scoped>
.tip-card {
  display: grid;
  gap: var(--space-2);
  border-color: var(--color-warning-200);
  background: #fffdf5;
}
.tip-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.tip-card h2,
.tip-card p,
.tip-card small {
  margin: 0;
}
.tip-card__eyebrow {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.tip-card h2 {
  margin-top: var(--space-1);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.tip-card p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}
.tip-card small {
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.45;
}
</style>
