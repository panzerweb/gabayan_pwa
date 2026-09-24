<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

import AppIcon from '@/components/ui/AppIcon.vue'
import { commerceQueryKeys, getCart } from '@/services/api'
import { useSessionStore } from '@stores/session.store'

const session = useSessionStore()
const query = useQuery({
  queryKey: commerceQueryKeys.cart,
  queryFn: () => getCart(session.accessToken!),
})
</script>

<template>
  <RouterLink
    class="cart-link"
    to="/app/cart"
    :aria-label="`Cart with ${query.data.value?.data.itemCount ?? 0} items`"
  >
    <AppIcon name="bag" />
    <span v-if="(query.data.value?.data.itemCount ?? 0) > 0" aria-hidden="true">
      {{ (query.data.value?.data.itemCount ?? 0) > 9 ? '9+' : query.data.value?.data.itemCount }}
    </span>
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
