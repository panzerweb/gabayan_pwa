<script setup lang="ts">
import { toRef, useId, watch } from 'vue'

import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import { MORTALITY_REASONS } from '../../domain/cultivations.model'
import { useRecordMortality } from '../composables/useRecordMortality'
import RecordFormStatus from './RecordFormStatus.vue'
import RecordNotesField from './RecordNotesField.vue'

// The sheet a farmer records observed fish losses in.
const props = defineProps<{ cultivationId: string; open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const reasonId = useId()
const { form, fieldErrors, formError, isOnline, saving, begin, submit } = useRecordMortality(
  toRef(props, 'cultivationId'),
)

// Every opening is a new submission with its own Idempotency-Key.
watch(
  () => props.open,
  (open) => {
    if (open) begin()
  },
  { immediate: true },
)

async function save() {
  if (await submit()) emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    variant="sheet"
    title="Add mortality record"
    description="This updates estimated live fish and the feeding estimate."
    @close="emit('close')"
  >
    <form class="record-form" novalidate @submit.prevent="save">
      <BaseInput
        v-model="form.occurredOn"
        label="Date observed"
        type="date"
        :error="fieldErrors.occurredOn"
        required
      />
      <BaseInput
        v-model="form.fishCount"
        label="Number of fish"
        type="number"
        inputmode="numeric"
        :min="1"
        :step="1"
        :error="fieldErrors.fishCount"
        required
      />
      <div class="select-field">
        <label :for="reasonId">Likely reason</label>
        <select :id="reasonId" v-model="form.reason">
          <option v-for="reason in MORTALITY_REASONS" :key="reason.value" :value="reason.value">
            {{ reason.label }}
          </option>
        </select>
        <p v-if="fieldErrors.reason" class="select-field__error" role="alert">
          {{ fieldErrors.reason }}
        </p>
      </div>
      <RecordNotesField v-model="form.notes" />
      <RecordFormStatus :is-online="isOnline" record="mortality record" :error="formError" />
      <BaseButton type="submit" :loading="saving" :disabled="!isOnline">
        Save mortality record
      </BaseButton>
    </form>
  </BaseModal>
</template>

<style scoped>
.record-form,
.select-field {
  display: grid;
}
.record-form {
  gap: var(--space-4);
}
.select-field {
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 750;
}
select {
  min-height: 3.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font: inherit;
  font-weight: 400;
}
select:focus-visible {
  outline: 3px solid var(--color-focus);
}
.select-field__error {
  margin: 0;
  color: var(--color-danger-700);
  font-size: 0.75rem;
}
</style>
