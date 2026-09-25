<script setup lang="ts">
// The optional free-text notes every record form ends with.
withDefaults(defineProps<{ label?: string }>(), { label: 'Notes (optional)' })
const notes = defineModel<string>({ required: true })
</script>

<template>
  <label class="notes-field">
    <span>{{ label }}</span>
    <textarea v-model="notes" rows="3" maxlength="300" />
  </label>
</template>

<style scoped>
.notes-field {
  display: grid;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 750;
}
textarea {
  min-height: 5.5rem;
  resize: vertical;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font: inherit;
  font-weight: 400;
}
textarea:focus-visible {
  outline: 3px solid var(--color-focus);
}
</style>
