<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

import BaseButton from '@/components/ui/BaseButton.vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

function close() {
  needRefresh.value = false
}
</script>

<template>
  <aside v-if="needRefresh" class="update-card" role="status" aria-live="polite">
    <div>
      <strong>A fresh version is ready</strong>
      <p>Update when you're ready to continue with the latest Gabayan experience.</p>
    </div>
    <div class="update-card__actions">
      <BaseButton variant="text" @click="close">Later</BaseButton>
      <BaseButton @click="updateServiceWorker(true)">Update</BaseButton>
    </div>
  </aside>
</template>

<style scoped>
.update-card {
  position: fixed;
  z-index: 120;
  right: var(--space-4);
  bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  left: var(--space-4);
  display: grid;
  gap: var(--space-4);
  max-width: 28rem;
  margin-inline: auto;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: white;
  box-shadow: var(--shadow-lg);
}

.update-card p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.update-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
