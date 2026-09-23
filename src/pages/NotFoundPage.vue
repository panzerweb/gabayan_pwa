<script setup lang="ts">
import AppBrand from '@/components/brand/AppBrand.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <main class="not-found">
    <AppBrand />
    <div>
      <p class="not-found__code">404</p>
      <h1>This page swam away</h1>
      <p>Let's guide you back to a familiar place.</p>
    </div>
    <BaseButton to="/welcome">Return to welcome</BaseButton>
  </main>
</template>

<style scoped>
.not-found {
  display: flex;
  min-height: 100dvh;
  width: min(100%, 32rem);
  flex-direction: column;
  justify-content: center;
  gap: var(--space-6);
  margin-inline: auto;
  padding: var(--space-5);
}

.not-found__code {
  margin: 0;
  color: var(--color-aqua-700);
  font-size: 0.875rem;
  font-weight: 800;
}

h1 {
  margin: var(--space-2) 0;
  font-size: 2rem;
}

div > p:last-child {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
