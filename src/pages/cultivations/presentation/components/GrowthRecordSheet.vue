<script setup lang="ts">
import { toRef, watch } from 'vue'

import BaseModal from '@components/overlays/BaseModal.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import { useRecordGrowth } from '../composables/useRecordGrowth'
import RecordFormStatus from './RecordFormStatus.vue'
import RecordNotesField from './RecordNotesField.vue'

// The sheet a farmer records a weighed growth sample in.
const props = defineProps<{ cultivationId: string; open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { form, fieldErrors, formError, isOnline, saving, begin, submit } = useRecordGrowth(
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
    title="Add growth record"
    description="Use a representative sample and record the actual average."
    @close="emit('close')"
  >
    <form class="record-form" novalidate @submit.prevent="save">
      <BaseInput
        v-model="form.measuredOn"
        label="Measurement date"
        type="date"
        :error="fieldErrors.measuredOn"
        required
      />
      <BaseInput
        v-model="form.numberOfFishSampled"
        label="Fish sampled"
        type="number"
        inputmode="numeric"
        :min="1"
        :step="1"
        :error="fieldErrors.numberOfFishSampled"
        required
      />
      <BaseInput
        v-model="form.averageWeight"
        label="Average fish weight"
        type="number"
        inputmode="decimal"
        suffix="g"
        :min="0.01"
        :step="0.01"
        :error="fieldErrors.averageWeight"
        required
      />
      <RecordNotesField v-model="form.notes" />
      <RecordFormStatus :is-online="isOnline" record="growth record" :error="formError" />
      <BaseButton type="submit" :loading="saving" :disabled="!isOnline">
        Save growth record
      </BaseButton>
    </form>
  </BaseModal>
</template>

<style scoped>
.record-form {
  display: grid;
  gap: var(--space-4);
}
</style>
