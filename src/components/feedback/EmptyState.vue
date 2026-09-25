<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    icon?: AppIconName
    actionLabel?: string
    actionTo?: RouteLocationRaw
  }>(),
  {
    icon: 'fish',
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <section class="empty-state">
    <span class="empty-state__visual" aria-hidden="true">
      <AppIcon :name="icon" :size="34" />
    </span>
    <div>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
    </div>
    <BaseButton v-if="actionLabel && actionTo" :to="actionTo" @click="emit('action')">
      {{ actionLabel }}
    </BaseButton>
    <BaseButton v-else-if="actionLabel" @click="emit('action')">{{ actionLabel }}</BaseButton>
  </section>
</template>

<style scoped>
.empty-state {
  display: grid;
  place-items: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-5);
  text-align: center;
}

.empty-state__visual {
  display: grid;
  width: 5rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  color: var(--color-brand-700);
  background:
    radial-gradient(circle at 68% 28%, rgb(255 255 255 / 80%) 0 0.6rem, transparent 0.65rem),
    var(--color-brand-100);
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

p {
  max-width: 27rem;
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  line-height: 1.6;
}
</style>
