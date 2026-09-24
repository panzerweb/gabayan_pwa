<script setup lang="ts">
import { computed, toRef } from 'vue'

import BaseButton from '@components/ui/BaseButton.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { SAFETY_CHECK_OFFLINE_MESSAGE } from '../../domain/water-quality.model'
import { useSafetyCheck } from '../composables/useSafetyCheck'
import { useWaterThresholds } from '../composables/useWaterThresholds'
import WaterProvenanceNote from './WaterProvenanceNote.vue'
import WaterReadingsForm from './WaterReadingsForm.vue'
import WaterSafetyResultList from './WaterSafetyResultList.vue'

// A one-off water safety check for one species in one culture system: the readings form,
// then the per-reading result with its disclaimer. Nothing is saved; keeping a history is
// a Pro feature. Meant for reuse by any screen that knows the pairing.
const props = defineProps<{ speciesId: string; environmentId: string }>()

const speciesId = toRef(props, 'speciesId')
const environmentId = toRef(props, 'environmentId')
const { thresholdSet } = useWaterThresholds(speciesId, environmentId)
const { form, fieldErrors, formError, result, isOnline, checking, submit, reset } = useSafetyCheck(
  speciesId,
  environmentId,
)

const thresholds = computed(() => thresholdSet.value?.thresholds)
</script>

<template>
  <section class="safety-check" aria-label="Water safety check">
    <template v-if="result">
      <WaterSafetyResultList :check="result" />
      <WaterProvenanceNote
        :is-demo="result.isDemo"
        :disclaimer="result.disclaimer"
        :sources="thresholdSet?.sources"
      />
      <BaseButton variant="secondary" @click="reset()">Check new readings</BaseButton>
    </template>
    <template v-else>
      <p v-if="!isOnline" class="safety-check__offline" role="status">
        {{ SAFETY_CHECK_OFFLINE_MESSAGE }}
      </p>
      <WaterReadingsForm
        :form="form"
        :field-errors="fieldErrors"
        :thresholds="thresholds"
        :disabled="!isOnline"
        :checking="checking"
        @update:reading="(parameter, value) => (form[parameter] = value)"
        @submit="submit()"
      />
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    </template>
    <p class="safety-check__history">
      This check is not saved. Pro plans keep a history of your readings.
      <RouterLink :to="{ name: ROUTE_NAMES.plans }">Compare plans</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.safety-check {
  display: grid;
  gap: var(--space-4);
}
.safety-check__offline,
.safety-check__history {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
}
.safety-check__offline {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-warning-950);
  background: var(--color-warning-100);
}
.safety-check__history {
  color: var(--color-text-muted);
}
.safety-check__history a {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  color: var(--color-brand-700);
  font-weight: 700;
}
</style>
