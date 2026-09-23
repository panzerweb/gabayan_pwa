<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppBrand from '@/components/brand/AppBrand.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const session = useSessionStore()

onMounted(async () => {
  await session.restore()
  await router.replace(session.isAuthenticated ? session.suggestedRoute : '/welcome')
})
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
