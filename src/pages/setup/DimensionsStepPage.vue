<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useSetupStore } from '@/stores/setup'
import { calculateRectangularArea, calculateRectangularVolume } from '@core/utils/geometry'
import { zodFieldErrors } from '@core/utils/validation'

const dimensionSchema = z.object({
  lengthM: z.number().positive('Enter a length greater than 0.').max(10000),
  widthM: z.number().positive('Enter a width greater than 0.').max(10000),
  waterDepthM: z.number().positive('Enter a water depth greater than 0.').max(10000),
})

const setup = useSetupStore()
const router = useRouter()
const lengthM = ref(setup.draft.dimensions?.lengthM.toString() ?? '')
const widthM = ref(setup.draft.dimensions?.widthM.toString() ?? '')
const waterDepthM = ref(setup.draft.dimensions?.waterDepthM.toString() ?? '')
const fieldErrors = ref<Record<string, string>>({})

const numericDimensions = computed(() => ({
  lengthM: Number(lengthM.value),
  widthM: Number(widthM.value),
  waterDepthM: Number(waterDepthM.value),
}))
const surfaceArea = computed(() =>
  calculateRectangularArea(numericDimensions.value.lengthM, numericDimensions.value.widthM),
)
const waterVolume = computed(() =>
  calculateRectangularVolume(
    numericDimensions.value.lengthM,
    numericDimensions.value.widthM,
    numericDimensions.value.waterDepthM,
  ),
)

async function submit() {
  fieldErrors.value = {}
  const parsed = dimensionSchema.safeParse(numericDimensions.value)
  if (!parsed.success) {
    fieldErrors.value = zodFieldErrors(parsed.error)
    return
  }
  setup.setDimensions(parsed.data)
  await router.push('/setup/fingerlings')
}
</script>

<template>
  <section class="setup-flow-page">
    <div class="setup-flow-intro">
      <h2>Measure your culture area</h2>
      <p>Use the internal water dimensions in meters. You can update them before saving.</p>
    </div>
    <div class="dimension-diagram" aria-label="Rectangular culture area measurement diagram">
      <div class="dimension-diagram__water">
        <span class="dimension-diagram__length">Length</span>
        <span class="dimension-diagram__width">Width</span>
        <span class="dimension-diagram__depth">Water depth</span>
      </div>
    </div>
    <form class="dimension-form" novalidate @submit.prevent="submit">
      <div class="dimension-form__row">
        <BaseInput
          v-model="lengthM"
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
          v-model="widthM"
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
        v-model="waterDepthM"
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
.dimension-diagram {
  padding: var(--space-7) var(--space-5);
}

.dimension-diagram__water {
  position: relative;
  height: 7.5rem;
  transform: skewY(-5deg);
  border: 2px solid var(--color-brand-600);
  border-radius: var(--radius-md);
  background: linear-gradient(160deg, rgb(186 230 253 / 45%), rgb(45 212 191 / 35%));
}

.dimension-diagram__water span {
  position: absolute;
  transform: skewY(5deg);
  color: var(--color-brand-800);
  font-size: 0.6875rem;
  font-weight: 800;
}

.dimension-diagram__length {
  right: 35%;
  bottom: -1.4rem;
}
.dimension-diagram__width {
  top: 45%;
  left: -1.2rem;
  rotate: -90deg;
}
.dimension-diagram__depth {
  top: 45%;
  right: -2.1rem;
  rotate: 90deg;
}

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
