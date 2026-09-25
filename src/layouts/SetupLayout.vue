<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/navigation/AppHeader.vue'
import SetupProgress from '@/components/navigation/SetupProgress.vue'
import { ROUTE_NAMES } from '@router/route-names'

const route = useRoute()

const title = computed(() => String(route.meta.title ?? 'Set up your cultivation'))
const backTo = computed(() => ({ name: route.meta.backTo ?? ROUTE_NAMES.setupIntro }))
const showBack = computed(() => Boolean(route.meta.backTo))
const showProgress = computed(() => typeof route.meta.setupStep === 'number')
const currentStep = computed(() => Number(route.meta.setupStep ?? 1))
const totalSteps = computed(() => Number(route.meta.setupTotal ?? 4))
</script>

<template>
  <div class="setup-layout app-frame" :class="{ 'setup-layout--with-progress': showProgress }">
    <a class="skip-link" href="#setup-content">Skip to content</a>
    <AppHeader :title="title" :show-back="showBack" :back-to="backTo" />
    <div v-if="showProgress" class="setup-layout__progress">
      <SetupProgress :current="currentStep" :total="totalSteps" />
    </div>
    <main id="setup-content" class="setup-layout__content" tabindex="-1">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.setup-layout {
  display: grid;
  min-height: 100dvh;
  grid-template-rows: auto 1fr;
  background: var(--color-surface);
}

.setup-layout--with-progress {
  grid-template-rows: auto auto 1fr;
}

.setup-layout__progress {
  padding: var(--space-2) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.setup-layout__content {
  min-width: 0;
  background: var(--color-background);
}
</style>
