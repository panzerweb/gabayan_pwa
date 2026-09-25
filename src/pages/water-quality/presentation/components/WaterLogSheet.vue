<script setup lang="ts">
import { toRef, watch } from 'vue'

import BaseModal from '@components/overlays/BaseModal.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import {
  WATER_LOG_NOTES_LIMIT,
  WATER_LOG_OFFLINE_MESSAGE,
  type WaterThreshold,
} from '../../domain/water-quality.model'
import { useSaveWaterLog } from '../composables/useSaveWaterLog'
import WaterReadingsForm from './WaterReadingsForm.vue'

// The sheet a Pro farmer saves a set of water readings in. Each opening is a new submission
// with its own Idempotency-Key.
const props = defineProps<{
  cultivationId: string
  open: boolean
  thresholds?: WaterThreshold[] | undefined
}>()
const emit = defineEmits<{ close: [] }>()

const { form, notes, fieldErrors, formError, isOnline, saving, begin, submit } = useSaveWaterLog(
  toRef(props, 'cultivationId'),
)

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
    title="Log water readings"
    description="Save what your test kit or meter shows now. Each reading is compared with the suggested range."
    @close="emit('close')"
  >
    <p v-if="!isOnline" class="water-log-sheet__offline" role="status">
      {{ WATER_LOG_OFFLINE_MESSAGE }}
    </p>
    <WaterReadingsForm
      :form="form"
      :field-errors="fieldErrors"
      :thresholds="thresholds"
      :disabled="!isOnline"
      :checking="saving"
      submit-label="Save reading"
      @update:reading="(parameter, value) => (form[parameter] = value)"
      @submit="save()"
    >
      <BaseInput
        v-model="notes"
        label="Notes (optional)"
        name="notes"
        hint="What you saw at the pond, such as water colour or how the fish behaved."
        :error="fieldErrors.notes"
        :maxlength="WATER_LOG_NOTES_LIMIT"
        :disabled="!isOnline"
      />
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    </WaterReadingsForm>
  </BaseModal>
</template>

<style scoped>
.water-log-sheet__offline {
  margin: 0 0 var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
