<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

import AppIcon from '@/components/ui/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    variant?: 'dialog' | 'sheet'
    closeLabel?: string
  }>(),
  {
    variant: 'dialog',
    closeLabel: 'Close',
  },
)

const emit = defineEmits<{
  close: []
}>()

const panel = ref<HTMLElement | null>(null)
const generatedId = useId()
const titleId = computed(() => `${generatedId}-title`)
const descriptionId = computed(() => `${generatedId}-description`)
let previouslyFocused: HTMLElement | null = null

function getFocusableElements() {
  if (!panel.value) return []
  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.body.classList.add('has-overlay')
      await nextTick()
      getFocusableElements()[0]?.focus()
    } else {
      document.body.classList.remove('has-overlay')
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
)

onBeforeUnmount(() => {
  document.body.classList.remove('has-overlay')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="overlay" :class="`overlay--${variant}`" @keydown="handleKeydown">
        <button
          class="overlay__backdrop"
          type="button"
          :aria-label="closeLabel"
          @click="emit('close')"
        />
        <section
          ref="panel"
          class="overlay__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
        >
          <span v-if="variant === 'sheet'" class="overlay__handle" aria-hidden="true" />
          <header class="overlay__header">
            <div>
              <h2 :id="titleId">{{ title }}</h2>
              <p v-if="description" :id="descriptionId">
                {{ description }}
              </p>
            </div>
            <button
              class="overlay__close"
              type="button"
              :aria-label="closeLabel"
              @click="emit('close')"
            >
              <AppIcon name="plus" class="overlay__close-icon" />
            </button>
          </header>
          <div class="overlay__body">
            <slot />
          </div>
          <footer v-if="$slots.actions" class="overlay__actions">
            <slot name="actions" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  z-index: 200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.overlay--sheet {
  align-items: end;
  padding: 0;
}

.overlay__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  border: 0;
  background: rgb(8 47 73 / 58%);
  cursor: default;
}

.overlay__panel {
  position: relative;
  width: min(100%, 28rem);
  max-height: min(80dvh, 44rem);
  overflow-y: auto;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xl);
}

.overlay--sheet .overlay__panel {
  width: min(100%, 32rem);
  max-height: 88dvh;
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.overlay__handle {
  display: block;
  width: 2.5rem;
  height: 0.25rem;
  margin: var(--space-2) auto 0;
  border-radius: 999px;
  background: var(--color-border-strong);
}

.overlay__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.overlay__header h2,
.overlay__header p {
  margin: 0;
}

.overlay__header h2 {
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

.overlay__header p {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.overlay__close {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--color-text-muted);
  background: var(--color-neutral-100);
  cursor: pointer;
}

.overlay__close:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.overlay__close-icon {
  rotate: 45deg;
}

.overlay__body {
  padding: var(--space-2) var(--space-5) var(--space-5);
}

.overlay__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5) var(--space-5);
  border-top: 1px solid var(--color-border);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 180ms ease;
}

.overlay-enter-active .overlay__panel,
.overlay-leave-active .overlay__panel {
  transition:
    translate 180ms ease,
    scale 180ms ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-from .overlay__panel,
.overlay-leave-to .overlay__panel {
  scale: 0.98;
  translate: 0 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .overlay-enter-active,
  .overlay-leave-active,
  .overlay-enter-active .overlay__panel,
  .overlay-leave-active .overlay__panel {
    transition: none;
  }
}
</style>
