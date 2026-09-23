<script setup lang="ts">
import ErrorState from '@/components/feedback/ErrorState.vue'
import AppBrand from '@/components/brand/AppBrand.vue'

function retry() {
  window.location.reload()
}
</script>

<template>
  <main class="offline-page app-frame">
    <AppBrand />
    <ErrorState
      title="You’re offline"
      message="Previously opened guidance remains available. Reconnect to load fresh information."
      retry-label="Try reconnecting"
      @retry="retry"
    />
  </main>
</template>

<style scoped>
.offline-page {
  display: grid;
  min-height: 100dvh;
  grid-template-rows: auto 1fr;
  padding: calc(var(--space-5) + env(safe-area-inset-top)) var(--space-5)
    calc(var(--space-5) + env(safe-area-inset-bottom));
  background: var(--color-surface);
}
</style>
