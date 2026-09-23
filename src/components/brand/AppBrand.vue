<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
    inverse?: boolean
  }>(),
  {
    compact: false,
    inverse: false,
  },
)
</script>

<template>
  <div class="brand" :class="{ 'brand--compact': compact, 'brand--inverse': inverse }">
    <span class="brand__mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path d="M7 28c8-10 18-14 30-10 2 .7 4 1 6 1-4 8-10 12-18 12-7 0-13-1-18-3Z" />
        <path d="M10 21c6-8 15-11 25-8 4 1 7 3 9 6-7 0-10 3-14 6-6 5-14 5-20-4Z" />
        <circle cx="17" cy="18" r="1.7" />
      </svg>
    </span>
    <span v-if="!compact" class="brand__name">Gabayan</span>
  </div>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-brand-800);
}

.brand--inverse {
  color: white;
}

.brand__mark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: var(--radius-lg);
  color: white;
  background: var(--color-brand-800);
  box-shadow: var(--shadow-sm);
}

.brand--inverse .brand__mark {
  color: var(--color-brand-800);
  background: white;
}

.brand__mark svg {
  width: 2rem;
  fill: currentColor;
}

.brand__mark svg path:first-child {
  opacity: 0.6;
}

.brand__name {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
</style>
