<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'
import StatusChip from '@components/ui/StatusChip.vue'

defineProps<{ why: string }>()
</script>

<template>
  <BaseCard class="recommendation" padding="md">
    <StatusChip label="Suggested for your setup" tone="success" />
    <h2>Why this may help</h2>
    <p>{{ why }}</p>
    <small>Optional equipment recommendation. Confirm actual site needs before purchasing.</small>
  </BaseCard>
</template>

<style scoped>
.recommendation {
  display: grid;
  gap: var(--space-2);
  border-color: var(--color-success-200);
  background: #f7fff9;
}
.recommendation h2,
.recommendation p,
.recommendation small {
  margin: 0;
}
.recommendation h2 {
  font-size: 1rem;
}
.recommendation p {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
}
.recommendation small {
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  line-height: 1.55;
}
</style>
