<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
  }>(),
  {
    label: 'Getting things ready…',
    compact: false,
  },
)
</script>

<template>
  <div class="loading-state" :class="{ 'loading-state--compact': compact }" role="status">
    <span class="loading-state__ring" aria-hidden="true" />
    <span>{{ label }}</span>
  </div>
</template>

<style scoped>
.loading-state {
  display: grid;
  min-height: 14rem;
  place-items: center;
  align-content: center;
  gap: var(--space-3);
  padding: var(--space-6);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
}

.loading-state--compact {
  min-height: auto;
  grid-template-columns: auto 1fr;
  justify-content: start;
  padding: var(--space-3);
  text-align: left;
}

.loading-state__ring {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-brand-100);
  border-top-color: var(--color-brand-700);
  border-radius: 50%;
  animation: loading-spin 750ms linear infinite;
}

.loading-state--compact .loading-state__ring {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

@keyframes loading-spin {
  to {
    rotate: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-state__ring {
    animation-duration: 1.6s;
  }
}
</style>
