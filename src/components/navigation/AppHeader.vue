<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import AppBrand from '@/components/brand/AppBrand.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { ROUTE_NAMES } from '@router/route-names'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showBrand?: boolean
    showBack?: boolean
    backTo?: RouteLocationRaw
    notificationCount?: number
  }>(),
  {
    showBrand: false,
    showBack: false,
    backTo: () => ({ name: ROUTE_NAMES.splash }),
  },
)
</script>

<template>
  <header class="app-header">
    <div class="app-header__leading">
      <RouterLink v-if="showBack" class="app-header__icon-button" :to="backTo" aria-label="Go back">
        <AppIcon name="arrow-left" />
      </RouterLink>
      <AppBrand v-if="showBrand" />
      <div v-if="title" class="app-header__titles">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <div class="app-header__trailing">
      <slot name="trailing">
        <RouterLink
          v-if="notificationCount !== undefined"
          class="app-header__icon-button"
          :to="{ name: ROUTE_NAMES.notifications }"
          :aria-label="
            notificationCount > 0 ? `${notificationCount} unread notifications` : 'Notifications'
          "
        >
          <AppIcon name="bell" />
          <span v-if="notificationCount > 0" class="app-header__badge" aria-hidden="true">
            {{ notificationCount > 9 ? '9+' : notificationCount }}
          </span>
        </RouterLink>
      </slot>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: calc(var(--space-3) + env(safe-area-inset-top)) var(--space-5) var(--space-3);
  background: var(--color-surface);
}

.app-header__leading,
.app-header__trailing {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--space-3);
}

.app-header__titles {
  min-width: 0;
}

.app-header__titles h1,
.app-header__titles p {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__titles h1 {
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.app-header__titles p {
  margin-top: 0.125rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.app-header__icon-button {
  position: relative;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text);
  background: var(--color-surface);
  text-decoration: none;
}

.app-header__icon-button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.app-header__badge {
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  display: grid;
  min-width: 1.15rem;
  height: 1.15rem;
  place-items: center;
  padding-inline: 0.2rem;
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  color: white;
  background: var(--color-danger-700);
  font-size: 0.6rem;
  font-weight: 800;
}
</style>
