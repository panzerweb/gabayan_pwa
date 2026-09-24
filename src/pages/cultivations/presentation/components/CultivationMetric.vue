<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'

// One figure on the cultivation overview: what it is, its value, and a line of context.
defineProps<{ label: string; value: string; note: string }>()
</script>

<template>
  <BaseCard class="metric" padding="md">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small>{{ note }}</small>
  </BaseCard>
</template>

<style scoped>
.metric {
  display: grid;
  gap: var(--space-1);
}
span,
small {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
strong {
  font-size: 1rem;
}
</style>
