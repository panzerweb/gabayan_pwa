<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description: string
    selected?: boolean
    disabled?: boolean
    meta?: string
  }>(),
  { selected: false, disabled: false },
)

const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    class="selectable-card"
    :class="{ 'selectable-card--selected': selected }"
    type="button"
    role="radio"
    :aria-checked="selected"
    :disabled="disabled"
    @click="emit('select')"
  >
    <span class="selectable-card__indicator" aria-hidden="true" />
    <span class="selectable-card__content">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
      <small v-if="meta">{{ meta }}</small>
    </span>
  </button>
</template>

<style scoped>
.selectable-card {
  display: grid;
  min-height: 5rem;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
}

.selectable-card--selected {
  border-color: var(--color-brand-600);
  background: var(--color-brand-50);
  box-shadow: 0 0 0 2px rgb(2 132 199 / 12%);
}

.selectable-card:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.selectable-card:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.selectable-card__indicator {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
}

.selectable-card--selected .selectable-card__indicator {
  border: 0.35rem solid var(--color-brand-700);
  background: white;
}

.selectable-card__content {
  display: grid;
  gap: var(--space-1);
}

.selectable-card__content strong {
  font-size: 0.9375rem;
}

.selectable-card__content > span {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.selectable-card__content small {
  margin-top: var(--space-1);
  color: var(--color-aqua-700);
  font-size: 0.6875rem;
  font-weight: 750;
}
</style>
