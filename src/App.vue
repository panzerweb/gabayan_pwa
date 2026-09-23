<script setup lang="ts">
import OnlineStatus from '@/components/feedback/OnlineStatus.vue'
import PwaUpdatePrompt from '@/components/feedback/PwaUpdatePrompt.vue'
import ToastViewport from '@/components/feedback/ToastViewport.vue'
import { SplashScreen } from '@capacitor/splash-screen'
import { onMounted } from 'vue'

onMounted(async () => {
  // Hide the splash screen as soon as Vue finishes loading the DOM
  await SplashScreen.hide()
})
</script>

<template>
  <OnlineStatus />
  <RouterView />
  <PwaUpdatePrompt />
  <ToastViewport />
</template>
