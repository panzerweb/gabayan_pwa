<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useToastStore, type ToastTone } from '@stores/toast.store'

import AppIcon, { type AppIconName } from '../ui/AppIcon.vue'

const toastStore = useToastStore()
const { messages } = storeToRefs(toastStore)

const toastIcons: Record<ToastTone, AppIconName> = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'warning',
}
</script>

<template>
  <div class="toast-viewport" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="message in messages"
        :key="message.id"
        class="toast-message"
        :class="`toast-message--${message.tone}`"
        role="status"
      >
        <AppIcon :name="toastIcons[message.tone]" :size="19" />
        <span>{{ message.message }}</span>
        <button type="button" aria-label="Dismiss message" @click="toastStore.dismiss(message.id)">
          <AppIcon name="plus" class="toast-message__close" :size="18" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-viewport {
  position: fixed;
  z-index: 240;
  right: var(--space-4);
  bottom: calc(5.5rem + env(safe-area-inset-bottom));
  left: var(--space-4);
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  pointer-events: none;
}

.toast-message {
  display: grid;
  grid-template-columns: auto 1fr auto;
  width: min(100%, 28rem);
  align-items: center;
  gap: var(--space-3);
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  font-size: 0.875rem;
  font-weight: 650;
  pointer-events: auto;
}

.toast-message--success {
  border-color: var(--color-success-200);
}

.toast-message--warning {
  border-color: var(--color-warning-200);
}

.toast-message--danger {
  border-color: var(--color-danger-200);
}

.toast-message > svg {
  color: var(--color-brand-700);
}

.toast-message--success > svg {
  color: var(--color-success-700);
}

.toast-message--warning > svg {
  color: var(--color-warning-700);
}

.toast-message--danger > svg {
  color: var(--color-danger-700);
}

.toast-message button {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
}

.toast-message button:focus-visible {
  outline: 3px solid var(--color-focus);
}

.toast-message__close {
  rotate: 45deg;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    translate 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  translate: 0 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
