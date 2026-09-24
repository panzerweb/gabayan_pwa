<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'

// Product photos are not served yet, so the gallery shows the supplies illustration. It
// is decorative: the product's name and description carry the information.
</script>

<template>
  <div class="product-gallery" aria-hidden="true"><AppIcon name="bag" :size="56" /></div>
</template>

<style scoped>
.product-gallery {
  display: grid;
  min-height: 15rem;
  place-items: center;
  border-radius: var(--radius-xl);
  color: var(--color-brand-700);
  background:
    radial-gradient(circle at 72% 22%, rgb(255 255 255 / 85%) 0 2rem, transparent 2.05rem),
    linear-gradient(145deg, var(--color-brand-100), var(--color-aqua-100));
}
</style>
