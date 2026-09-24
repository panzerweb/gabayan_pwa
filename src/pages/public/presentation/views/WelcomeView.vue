<script setup lang="ts">
import WelcomeHero from '../components/WelcomeHero.vue'
import WelcomeIntro from '../components/WelcomeIntro.vue'
</script>

<template>
  <div class="welcome-page">
    <WelcomeHero />
    <WelcomeIntro />
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: 100dvh;
  background: var(--color-surface);
}
</style>
