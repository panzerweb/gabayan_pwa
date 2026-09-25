import { computed, reactive, ref } from 'vue'

import { calculateRectangularArea, calculateRectangularVolume } from '@core/utils/geometry'

import {
  dimensionsFormErrors,
  dimensionsFormFrom,
  dimensionsFrom,
  parseMeters,
  type FormErrors,
} from '../../domain/setup.model'
import { useSetupStore } from '../stores/setup.store'

// The culture-area measurements. Area and volume preview locally as the farmer types; the
// authoritative figures come back with the stocking estimate.
export function useDimensionsForm() {
  const setup = useSetupStore()
  const form = reactive(dimensionsFormFrom(setup.draft.dimensions))
  const fieldErrors = ref<FormErrors>({})

  const lengthM = computed(() => parseMeters(form.lengthM) ?? Number.NaN)
  const widthM = computed(() => parseMeters(form.widthM) ?? Number.NaN)
  const waterDepthM = computed(() => parseMeters(form.waterDepthM) ?? Number.NaN)

  // True once valid dimensions are saved to the draft.
  function submit(): boolean {
    fieldErrors.value = dimensionsFormErrors(form)
    const dimensions = dimensionsFrom(form)
    if (!dimensions) return false
    setup.setDimensions(dimensions)
    return true
  }

  return {
    form,
    fieldErrors,
    surfaceArea: computed(() => calculateRectangularArea(lengthM.value, widthM.value)),
    waterVolume: computed(() =>
      calculateRectangularVolume(lengthM.value, widthM.value, waterDepthM.value),
    ),
    submit,
  }
}
