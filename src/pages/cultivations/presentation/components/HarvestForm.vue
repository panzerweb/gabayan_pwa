<script setup lang="ts">
import { toRef } from 'vue'

import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import BaseInput from '@components/ui/BaseInput.vue'

import type { HarvestCompletion } from '../../domain/cultivations.model'
import { useCompleteHarvest } from '../composables/useCompleteHarvest'
import RecordFormStatus from './RecordFormStatus.vue'
import RecordNotesField from './RecordNotesField.vue'

// The measured harvest that closes a cultivation. Emits the server's completion once saved.
const props = defineProps<{ cultivationId: string }>()
const emit = defineEmits<{ completed: [completion: HarvestCompletion] }>()

const { form, fieldErrors, formError, isOnline, saving, submit } = useCompleteHarvest(
  toRef(props, 'cultivationId'),
)

async function save() {
  const completion = await submit()
  if (completion) emit('completed', completion)
}
</script>

<template>
  <BaseCard class="harvest-form-card" padding="lg">
    <h2>Record completed harvest</h2>
    <p>Only submit after the harvest has happened. This closes the cultivation.</p>
    <form novalidate @submit.prevent="save">
      <BaseInput
        v-model="form.harvestDate"
        label="Harvest date"
        type="date"
        :error="fieldErrors.harvestDate"
        required
      />
      <BaseInput
        v-model="form.numberHarvested"
        label="Fish harvested"
        type="number"
        inputmode="numeric"
        :min="1"
        :step="1"
        :error="fieldErrors.numberHarvested"
        required
      />
      <BaseInput
        v-model="form.totalHarvestWeight"
        label="Total harvest weight"
        type="number"
        inputmode="decimal"
        suffix="kg"
        :min="0.01"
        :step="0.01"
        :error="fieldErrors.totalHarvestWeight"
        required
      />
      <BaseInput
        v-model="form.averageFishWeight"
        label="Average fish weight"
        type="number"
        inputmode="decimal"
        suffix="g"
        :min="0.01"
        :step="0.01"
        :error="fieldErrors.averageFishWeight"
        required
      />
      <BaseInput
        v-model="form.sellingPricePerKg"
        label="Selling price per kg"
        type="number"
        inputmode="decimal"
        suffix="PHP"
        :min="0"
        :step="0.01"
        :error="fieldErrors.sellingPricePerKg"
        required
      />
      <RecordNotesField v-model="form.notes" />
      <RecordFormStatus :is-online="isOnline" record="harvest" :error="formError" />
      <BaseButton type="submit" :loading="saving" :disabled="!isOnline">
        Complete cultivation
      </BaseButton>
    </form>
  </BaseCard>
</template>

<style scoped>
.harvest-form-card,
form {
  display: grid;
  gap: var(--space-4);
}
h2,
p {
  margin: 0;
}
p {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
