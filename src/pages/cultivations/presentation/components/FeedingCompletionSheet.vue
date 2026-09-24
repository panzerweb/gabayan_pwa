<script setup lang="ts">
import { watch } from 'vue'

import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import type { FarmTask } from '../../domain/cultivations.model'
import { useCompleteTask } from '../composables/useCompleteTask'

// The sheet a farmer records a feeding in, opened from a task card on Home or the task list.
const props = defineProps<{ task: FarmTask | null; open: boolean }>()
const emit = defineEmits<{ close: []; completed: [] }>()

const { amount, notes, unit, amountError, formError, isOnline, saving, begin, submit } =
  useCompleteTask()

// Every opening is a new submission with its own Idempotency-Key.
watch(
  () => [props.open, props.task] as const,
  ([open, task]) => {
    if (open && task) begin(task)
  },
  { immediate: true },
)

async function save() {
  if (!(await submit())) return
  emit('completed')
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    variant="sheet"
    title="Record feeding"
    :description="task ? `Complete ${task.title.toLowerCase()} for this cultivation.` : ''"
    @close="emit('close')"
  >
    <form class="feeding-form" @submit.prevent="save">
      <BaseInput
        v-model="amount"
        label="Actual amount given"
        type="number"
        inputmode="decimal"
        :suffix="unit.toLowerCase()"
        :step="0.01"
        :min="0.01"
        :error="amountError"
        required
      />
      <label class="feeding-form__notes">
        <span>Notes (optional)</span>
        <textarea
          v-model="notes"
          rows="3"
          maxlength="300"
          placeholder="Example: Fish responded normally"
        />
      </label>
      <p class="feeding-form__estimate">
        The planned amount is a demo estimate. Adjust only from your actual observation and local
        guidance.
      </p>
      <p v-if="!isOnline" class="feeding-form__offline" role="status">
        You are offline. Reconnect to save this feeding; it will not be queued.
      </p>
      <p v-if="formError" class="feeding-form__error" role="alert">{{ formError }}</p>
      <BaseButton type="submit" :loading="saving" :disabled="!isOnline">
        Save feeding record
      </BaseButton>
    </form>
  </BaseModal>
</template>

<style scoped>
.feeding-form {
  display: grid;
  gap: var(--space-4);
}

.feeding-form__notes {
  display: grid;
  gap: var(--space-2);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 750;
}

textarea {
  min-height: 5.5rem;
  resize: vertical;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font: inherit;
}

textarea:focus-visible {
  outline: 3px solid rgb(14 165 233 / 15%);
  border-color: var(--color-brand-600);
}

.feeding-form__estimate,
.feeding-form__offline,
.feeding-form__error {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
}

.feeding-form__estimate {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}

.feeding-form__offline {
  color: var(--color-text-muted);
}

.feeding-form__error {
  color: var(--color-danger-700);
  font-weight: 700;
}
</style>
