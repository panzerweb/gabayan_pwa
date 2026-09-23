<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
    elevated?: boolean
  }>(),
  {
    padding: 'md',
    elevated: false,
  },
)
</script>

<template>
  <section class="card" :class="[`card--${padding}`, { 'card--elevated': elevated }]">
    <slot />
  </section>
</template>

<style scoped>
.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.card--sm {
  padding: var(--space-3);
}

.card--md {
  padding: var(--space-4);
}

.card--lg {
  padding: var(--space-5);
}

.card--elevated {
  border-color: transparent;
  box-shadow: var(--shadow-sm);
}
</style>
