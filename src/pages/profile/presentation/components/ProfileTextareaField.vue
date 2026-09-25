<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    error?: string | undefined
    maxlength?: number
    rows?: number
  }>(),
  {
    rows: 3,
  },
)

const model = defineModel<string>({ required: true })

const textareaId = useId()
const errorId = computed(() => (props.error ? `${textareaId}-error` : undefined))
</script>

<template>
  <div class="textarea-field">
    <label :for="textareaId">{{ label }}</label>
    <textarea
      :id="textareaId"
      v-model="model"
      :rows="rows"
      :maxlength="maxlength"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="errorId"
    />
    <p v-if="error" :id="errorId" class="field-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.textarea-field {
  display: grid;
  gap: var(--space-2);
}
label {
  font-size: 0.875rem;
  font-weight: 750;
}
textarea {
  min-height: 3.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: white;
  font: inherit;
  resize: vertical;
}
textarea:focus-visible {
  outline: 3px solid var(--color-focus);
}
.field-error {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.8rem;
}
</style>
