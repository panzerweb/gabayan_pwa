import { computed, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'

import { clampQuantity, presetQuantityFrom } from '../../domain/marketplace.model'

// Applies the quantity a "Buy now" link put in the route query once the product's order
// limit is known, so the preset never exceeds what one order may hold. Changes the farmer
// makes afterwards are left alone.
export function useQuantityPreset(quantity: Ref<number>, maximum: Ref<number | undefined>) {
  const route = useRoute()
  const presetQuantity = computed(() => presetQuantityFrom(route.query))

  watch(
    [presetQuantity, maximum],
    ([preset, limit]) => {
      if (preset === null || limit === undefined) return
      quantity.value = clampQuantity(preset, limit)
    },
    { immediate: true },
  )

  return {
    presetQuantity: computed(() =>
      presetQuantity.value === null || maximum.value === undefined
        ? null
        : clampQuantity(presetQuantity.value, maximum.value),
    ),
  }
}
