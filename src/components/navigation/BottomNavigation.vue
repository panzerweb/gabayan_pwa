<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import { PRIMARY_DESTINATIONS } from '@core/navigation'
</script>

<template>
  <nav class="bottom-navigation" aria-label="Primary navigation">
    <RouterLink
      v-for="item in PRIMARY_DESTINATIONS"
      :key="item.routeName"
      class="bottom-navigation__item"
      :to="{ name: item.routeName }"
    >
      <AppIcon :name="item.icon" :size="23" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-navigation {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-height: calc(4.5rem + env(safe-area-inset-bottom));
  padding: var(--space-2) var(--space-2) env(safe-area-inset-bottom);
  border-top: 1px solid var(--color-border);
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 -0.5rem 1.5rem rgb(8 47 73 / 6%);
  backdrop-filter: blur(0.75rem);
}

.bottom-navigation__item {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 3.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border-radius: var(--radius-md);
  color: var(--color-text-subtle);
  font-size: 0.6875rem;
  font-weight: 700;
  text-decoration: none;
}

.bottom-navigation__item::before {
  position: absolute;
  top: 0.2rem;
  width: 1.6rem;
  height: 0.2rem;
  border-radius: 999px;
  background: transparent;
  content: '';
}

.bottom-navigation__item.router-link-active {
  color: var(--color-brand-700);
  background: var(--color-brand-50);
}

.bottom-navigation__item.router-link-active::before {
  background: var(--color-aqua-600);
}

.bottom-navigation__item:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: -2px;
}
</style>
