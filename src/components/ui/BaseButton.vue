<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'text'
    to?: RouteLocationRaw
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    disabled: false,
    loading: false,
    type: 'button',
  },
)
</script>

<template>
  <RouterLink v-if="to && !disabled" class="button" :class="`button--${variant}`" :to="to">
    <slot />
  </RouterLink>
  <button
    v-else
    class="button"
    :class="`button--${variant}`"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span v-if="loading" class="button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  min-height: 3.25rem;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0.75rem 1.25rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 750;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.button:active:not(:disabled) {
  transform: translateY(1px);
}

.button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.button--primary {
  color: white;
  background: var(--color-brand-700);
  box-shadow: var(--shadow-sm);
}

.button--primary:hover:not(:disabled) {
  background: var(--color-brand-800);
}

.button--secondary {
  color: var(--color-brand-800);
  border-color: var(--color-brand-200);
  background: white;
}

.button--secondary:hover:not(:disabled) {
  background: var(--color-brand-50);
}

.button--text {
  min-height: 2.75rem;
  color: var(--color-brand-800);
  background: transparent;
}

.button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button,
  .button__spinner {
    transition: none;
    animation: none;
  }
}
</style>
