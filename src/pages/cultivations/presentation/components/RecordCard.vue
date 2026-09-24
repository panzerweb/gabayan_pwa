<script setup lang="ts">
import BaseCard from '@components/ui/BaseCard.vue'

// One saved record in a farm records list: its headline and status on top, then the
// observation, and the date and recorder underneath.
defineProps<{ footer: string }>()
</script>

<template>
  <BaseCard class="record-card" padding="md">
    <div class="record-card__heading"><slot name="heading" /></div>
    <slot />
    <small>{{ footer }}</small>
  </BaseCard>
</template>

<style scoped>
.record-card {
  display: grid;
  gap: var(--space-2);
}
.record-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.record-card :slotted(p),
small {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
