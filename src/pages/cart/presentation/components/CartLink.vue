<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { useCartBadge } from '../composables/useCartBadge'

// The cart icon with its item badge, for the marketplace and orders headers.
const { label, count } = useCartBadge()
</script>

<template>
  <RouterLink class="cart-link" :to="{ name: ROUTE_NAMES.cart }" :aria-label="label">
    <AppIcon name="bag" />
    <span v-if="count" aria-hidden="true">{{ count }}</span>
  </RouterLink>
</template>

<style scoped>
.cart-link {
  position: relative;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text);
  background: var(--color-surface);
}
.cart-link > span {
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
.cart-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
