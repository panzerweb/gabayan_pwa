<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'time' | 'date'
    name?: string
    placeholder?: string
    hint?: string
    error?: string | undefined
    disabled?: boolean
    required?: boolean
    inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
    suffix?: string
    autocomplete?: string
    min?: number
    max?: number
    step?: number | 'any'
    maxlength?: number
  }>(),
  {
    modelValue: '',
    type: 'text',
    disabled: false,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
const hintId = computed(() => (props.hint ? `${inputId}-hint` : undefined))
const errorId = computed(() => (props.error ? `${inputId}-error` : undefined))
const describedBy = computed(
  () => [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div class="field" :class="{ 'field--error': error, 'field--disabled': disabled }">
    <label class="field__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </label>
    <div class="field__control">
      <input
        :id="inputId"
        class="field__input"
        :value="modelValue"
        :name="name"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :inputmode="inputmode"
        :autocomplete="autocomplete"
        :min="min"
        :max="max"
        :step="step"
        :maxlength="maxlength"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="suffix" class="field__suffix">{{ suffix }}</span>
    </div>
    <p v-if="hint" :id="hintId" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: var(--space-2);
}

.field__label {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 750;
}

.field__required {
  color: var(--color-danger-700);
}

.field__control {
  display: flex;
  min-height: 3.25rem;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.field__control:focus-within {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 3px rgb(14 165 233 / 15%);
}

.field--error .field__control {
  border-color: var(--color-danger-700);
}

.field--disabled {
  opacity: 0.58;
}

.field__input {
  min-width: 0;
  flex: 1;
  align-self: stretch;
  padding: 0.75rem 0.875rem;
  border: 0;
  outline: 0;
  color: var(--color-text);
  background: transparent;
}

.field__input::placeholder {
  color: var(--color-text-subtle);
}

.field__suffix {
  padding-right: 0.875rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 650;
}

.field__hint,
.field__error {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
}

.field__hint {
  color: var(--color-text-muted);
}

.field__error {
  color: var(--color-danger-700);
  font-weight: 650;
}
</style>
