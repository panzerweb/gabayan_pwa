<script setup lang="ts">
import BottomNavigation from '@/components/navigation/BottomNavigation.vue'

function focusContent() {
  document.getElementById('app-content')?.focus()
}
</script>

<template>
  <div class="authenticated-layout app-frame">
    <a class="skip-link" href="#app-content" @click.prevent="focusContent">Skip to content</a>
    <main id="app-content" class="authenticated-layout__content" tabindex="-1">
      <RouterView />
    </main>
    <BottomNavigation />
  </div>
</template>

<style scoped>
.authenticated-layout {
  display: grid;
  height: 100dvh;
  grid-template-rows: minmax(0, 1fr) auto;
  background: var(--color-background);
}

.authenticated-layout__content {
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
</style>
