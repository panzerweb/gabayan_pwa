<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isOnline = ref(true)

function updateStatus() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  updateStatus()
  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateStatus)
  window.removeEventListener('offline', updateStatus)
})
</script>

<template>
  <div v-if="!isOnline" class="offline-banner" role="status">
    You're offline. Some information may be out of date, and changes are temporarily disabled.
  </div>
</template>

<style scoped>
.offline-banner {
  position: relative;
  z-index: 100;
  padding: calc(var(--space-2) + env(safe-area-inset-top)) var(--space-4) var(--space-2);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.8125rem;
  font-weight: 650;
  text-align: center;
}
</style>
