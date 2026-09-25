<script setup lang="ts">
import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import {
  WATER_PARAMETERS,
  WATER_READING_FIELDS,
  formatThresholdRange,
  readingLabel,
  type WaterParameter,
  type WaterReadingsForm,
  type WaterThreshold,
} from '../../domain/water-quality.model'

// Seven labelled readings, each with its unit, an explanation and the suggested range when
// the ranges are known. Any field may stay blank; the parent owns the values and the submit.
// The default slot holds any further fields, shown above the submit button.
const props = withDefaults(
  defineProps<{
    form: WaterReadingsForm
    fieldErrors: Record<string, string>
    thresholds?: WaterThreshold[] | undefined
    disabled?: boolean
    checking?: boolean
    submitLabel?: string
  }>(),
  { thresholds: undefined, submitLabel: 'Check readings' },
)

const emit = defineEmits<{
  'update:reading': [parameter: WaterParameter, value: string]
  submit: []
}>()

function hintFor(parameter: WaterParameter) {
  const threshold = props.thresholds?.find((row) => row.parameter === parameter)
  return threshold ? `${threshold.explanation} Suggested: ${formatThresholdRange(threshold)}.` : ''
}
</script>

<template>
  <form class="water-readings" novalidate @submit.prevent="emit('submit')">
    <p class="water-readings__intro">
      Enter the readings you have from a test kit or meter. Leave the rest blank.
    </p>
    <BaseInput
      v-for="parameter in WATER_PARAMETERS"
      :key="parameter"
      :model-value="form[parameter]"
      :label="readingLabel(parameter)"
      :name="WATER_READING_FIELDS[parameter].field"
      :suffix="parameter === 'PH' ? '' : WATER_READING_FIELDS[parameter].unitLabel"
      :hint="hintFor(parameter)"
      :error="fieldErrors[`readings.${WATER_READING_FIELDS[parameter].field}`]"
      :disabled="disabled"
      inputmode="decimal"
      @update:model-value="emit('update:reading', parameter, $event)"
    />
    <p v-if="fieldErrors.readings" class="form-error" role="alert">
      {{ fieldErrors.readings }}
    </p>
    <slot />
    <BaseButton type="submit" :disabled="disabled" :loading="checking">
      {{ submitLabel }}
    </BaseButton>
  </form>
</template>

<style scoped>
.water-readings {
  display: grid;
  gap: var(--space-4);
}
.water-readings__intro {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
