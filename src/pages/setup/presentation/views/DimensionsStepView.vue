<script setup lang="ts">
import { useRouter } from 'vue-router'

import BaseButton from '@components/ui/BaseButton.vue'
import BaseInput from '@components/ui/BaseInput.vue'
import { ROUTE_NAMES } from '@router/route-names'

import DimensionDiagram from '../components/DimensionDiagram.vue'
import { useDimensionsForm } from '../composables/useDimensionsForm'

const router = useRouter()
const { form, fieldErrors, surfaceArea, waterVolume, submit } = useDimensionsForm()

async function continueToFingerlings() {
  if (submit()) await router.push({ name: ROUTE_NAMES.setupFingerlings })
}
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>Measure your culture area</h2>
      <p>Use the internal water dimensions in meters. You can update them before saving.</p>
    </div>
    <DimensionDiagram />
    <form class="dimension-form" novalidate @submit.prevent="continueToFingerlings">
      <div class="dimension-form__row">
        <BaseInput
          v-model="form.lengthM"
          label="Length"
          type="number"
          inputmode="decimal"
          suffix="m"
          :min="0.01"
          step="any"
          :error="fieldErrors.lengthM"
          required
        />
        <BaseInput
          v-model="form.widthM"
          label="Width"
          type="number"
          inputmode="decimal"
          suffix="m"
          :min="0.01"
          step="any"
          :error="fieldErrors.widthM"
          required
        />
      </div>
      <BaseInput
        v-model="form.waterDepthM"
        label="Average water depth"
        type="number"
        inputmode="decimal"
        suffix="m"
        :min="0.01"
        step="any"
        hint="Use the typical filled depth, not the full wall height."
        :error="fieldErrors.waterDepthM"
        required
      />
      <div v-if="surfaceArea && waterVolume" class="dimension-summary" aria-live="polite">
        <div>
          <span>Surface area</span><strong>{{ surfaceArea }} m²</strong>
        </div>
        <div>
          <span>Estimated volume</span><strong>{{ waterVolume }} m³</strong>
        </div>
      </div>
      <div class="setup-flow-actions"><BaseButton type="submit">Continue</BaseButton></div>
    </form>
  </section>
</template>

<style scoped>
.dimension-form {
  display: grid;
  gap: var(--space-4);
}

.dimension-form__row,
.dimension-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.dimension-summary {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-brand-50);
}

.dimension-summary div {
  display: grid;
  gap: var(--space-1);
}
.dimension-summary span {
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}
.dimension-summary strong {
  font-size: 0.9375rem;
}
</style>
