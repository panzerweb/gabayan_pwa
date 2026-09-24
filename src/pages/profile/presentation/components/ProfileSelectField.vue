<script setup lang="ts" generic="T extends string">
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  options: readonly { value: T; label: string }[]
  error?: string | undefined
}>()

const model = defineModel<T>({ required: true })

const selectId = useId()
const errorId = computed(() => (props.error ? `${selectId}-error` : undefined))
</script>

<template>
  <div class="select-field">
    <label :for="selectId">{{ label }}</label>
    <select
      :id="selectId"
      v-model="model"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="errorId"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" :id="errorId" class="field-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.select-field {
  display: grid;
  gap: var(--space-2);
}
label {
  font-size: 0.875rem;
  font-weight: 750;
}
select {
  min-height: 3.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: white;
  font: inherit;
}
select:focus-visible {
  outline: 3px solid var(--color-focus);
}
.field-error {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.8rem;
}
</style>
