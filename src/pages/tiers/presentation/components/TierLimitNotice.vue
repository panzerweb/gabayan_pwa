<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

// Explains a cultivation the plan has no room for, in the server's words, and points to the
// plans. Meant for any screen that creates a cultivation.
defineProps<{
  message: string
}>()
</script>

<template>
  <div class="tier-limit-notice" role="alert">
    <p class="tier-limit-notice__message">
      <AppIcon name="warning" :size="20" />
      <span>{{ message }}</span>
    </p>
    <p class="tier-limit-notice__hint">
      Your plan decides how many culture systems can be active at once. A harvested cultivation no
      longer counts.
    </p>
    <BaseButton variant="secondary" :to="{ name: ROUTE_NAMES.plans }">See plans</BaseButton>
  </div>
</template>

<style scoped>
.tier-limit-notice {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-warning-200);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.tier-limit-notice p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.tier-limit-notice__message {
  display: flex;
  align-items: start;
  gap: var(--space-2);
  font-weight: 700;
}

.tier-limit-notice__message :deep(svg) {
  flex: none;
}
</style>
