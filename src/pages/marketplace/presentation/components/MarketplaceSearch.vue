<script setup lang="ts">
import AppIcon from '@components/ui/AppIcon.vue'

const search = defineModel<string>({ required: true })

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <form class="search" role="search" @submit.prevent="emit('submit')">
    <AppIcon name="search" :size="20" aria-hidden="true" />
    <label class="sr-only" for="marketplace-search">Search marketplace</label>
    <input
      id="marketplace-search"
      v-model="search"
      type="search"
      enterkeyhint="search"
      placeholder="Search feed, aeration, tools…"
    />
    <button type="submit">Search</button>
  </form>
</template>

<style scoped>
.search {
  display: grid;
  min-height: 3.25rem;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  padding-left: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.search:focus-within {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 3px rgb(14 165 233 / 15%);
}
.search input {
  min-width: 0;
  align-self: stretch;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
}
.search button {
  min-height: 2.75rem;
  align-self: stretch;
  padding-inline: var(--space-3);
  border: 0;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: white;
  background: var(--color-brand-700);
  font-weight: 750;
}
.search button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
