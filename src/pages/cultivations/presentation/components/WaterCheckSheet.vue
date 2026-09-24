<script setup lang="ts">
import { toRef, watch } from 'vue'

import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import { useRecordWaterCheck } from '../composables/useRecordWaterCheck'
import RecordFormStatus from './RecordFormStatus.vue'
import RecordNotesField from './RecordNotesField.vue'

// The sheet a farmer records what the water and fish look like in. The guidance that comes
// back stays conditional; nothing here prescribes a water change.
const props = defineProps<{ cultivationId: string; open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { form, fieldErrors, formError, isOnline, saving, begin, submit } = useRecordWaterCheck(
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
    title="Add water check"
    description="Describe what you observed. Guidance remains conditional."
    @close="emit('close')"
  >
    <form class="record-form" novalidate @submit.prevent="save">
      <BaseInput
        v-model="form.checkedOn"
        label="Check date"
        type="date"
        :error="fieldErrors.checkedAt"
        required
      />
      <BaseInput
        v-model="form.clarity"
        label="Water clarity"
        hint="How clear or coloured the water looks, for example clear or slightly green."
        :error="fieldErrors.clarity"
        required
      />
      <BaseInput v-model="form.odor" label="Odor" :error="fieldErrors.odor" required />
      <BaseInput
        v-model="form.fishBehavior"
        label="Fish behavior"
        hint="Whether the fish swim and feed as usual."
        :error="fieldErrors.fishBehavior"
        required
      />
      <label class="check-field">
        <input v-model="form.unusualChanges" type="checkbox" />
        <span>I noticed an unusual change</span>
      </label>
      <BaseInput
        v-model="form.actionTaken"
        label="Action taken (optional)"
        :error="fieldErrors.actionTaken"
      />
      <RecordNotesField v-model="form.notes" />
      <RecordFormStatus :is-online="isOnline" record="water check" :error="formError" />
      <BaseButton type="submit" :loading="saving" :disabled="!isOnline">
        Save water check
      </BaseButton>
    </form>
  </BaseModal>
</template>

<style scoped>
.record-form {
  display: grid;
  gap: var(--space-4);
}
.check-field {
  display: flex;
  min-height: 3rem;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.875rem;
  font-weight: 700;
}
.check-field input {
  width: 1.25rem;
  height: 1.25rem;
}
.check-field input:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
