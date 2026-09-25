<script setup lang="ts">
import type { GuidanceMessage } from '../../domain/cultivations.model'

// One piece of the server's conditional water guidance with its disclaimer. Caution and
// action notes share the warning colour; the severity is also carried by the title.
defineProps<{ guidance: GuidanceMessage }>()
</script>

<template>
  <aside :class="['guidance', `guidance--${guidance.severity.toLowerCase()}`]">
    <strong>{{ guidance.title }}</strong>
    <span>{{ guidance.message }}</span>
    <small>{{ guidance.disclaimer }}</small>
  </aside>
</template>

<style scoped>
.guidance {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  line-height: 1.45;
}
.guidance--info {
  color: var(--color-brand-900);
  background: var(--color-brand-50);
}
.guidance--caution,
.guidance--action {
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}
small {
  opacity: 0.8;
}
</style>
