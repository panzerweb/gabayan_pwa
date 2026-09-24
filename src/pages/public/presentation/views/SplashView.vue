<script setup lang="ts">
import AppBrand from '@components/brand/AppBrand.vue'
import LoadingState from '@components/feedback/LoadingState.vue'

import { useSplashRedirect } from '../composables/useSplashRedirect'

useSplashRedirect()
</script>

<template>
  <main class="splash-page app-frame">
    <AppBrand />
    <LoadingState label="Preparing your Gabayan experience…" />
  </main>
</template>

<style scoped>
.splash-page {
  display: grid;
  min-height: 100dvh;
  place-content: center;
  justify-items: center;
  gap: var(--space-6);
  background:
    radial-gradient(circle at 50% 38%, var(--color-aqua-100), transparent 12rem),
    var(--color-surface);
}
</style>
