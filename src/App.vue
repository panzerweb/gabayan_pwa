<script setup lang="ts">
import OnlineStatus from '@/components/feedback/OnlineStatus.vue'
import PwaUpdatePrompt from '@/components/feedback/PwaUpdatePrompt.vue'
import ToastViewport from '@/components/feedback/ToastViewport.vue'
</script>

<template>
  <OnlineStatus />
  <RouterView />
  <PwaUpdatePrompt />
  <ToastViewport />
</template>
