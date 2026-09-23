<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    rounded?: boolean
  }>(),
  {
    width: '100%',
    height: '1rem',
    rounded: false,
  },
)
</script>

<template>
  <span
    class="skeleton"
    :class="{ 'skeleton--rounded': rounded }"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton {
  display: block;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-neutral-100);
}

.skeleton::after {
  display: block;
  width: 55%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 75%), transparent);
  content: '';
  animation: shimmer 1.25s ease-in-out infinite;
}

.skeleton--rounded {
  border-radius: 999px;
}

@keyframes shimmer {
  from {
    translate: -120% 0;
  }
  to {
    translate: 220% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}
</style>
