import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import {
  emptySetupDraft,
  type Dimensions,
  type SetupDraft,
  type StockingEstimate,
} from '../../domain/setup.model'

export const SETUP_DRAFT_STORAGE_KEY = 'gabayan.setup-draft.v1'

function loadDraft(): SetupDraft {
  try {
    const stored = window.sessionStorage.getItem(SETUP_DRAFT_STORAGE_KEY)
    return stored
      ? { ...emptySetupDraft(), ...(JSON.parse(stored) as Partial<SetupDraft>) }
      : emptySetupDraft()
  } catch {
    return emptySetupDraft()
  }
}

// The wizard's answers. Mirrored to session storage so a reload keeps the farmer's place in
// the tab they are using; a changed answer clears whatever was derived from the old one.
export const useSetupStore = defineStore('setup', () => {
  const draft = ref<SetupDraft>(loadDraft())

  watch(
    draft,
    (value) => window.sessionStorage.setItem(SETUP_DRAFT_STORAGE_KEY, JSON.stringify(value)),
    { deep: true },
  )

  function selectSpecies(speciesId: string) {
    if (draft.value.speciesId !== speciesId) {
      draft.value.environmentId = null
      draft.value.estimate = null
    }
    draft.value.speciesId = speciesId
  }

  function selectEnvironment(environmentId: string) {
    if (draft.value.environmentId !== environmentId) draft.value.estimate = null
    draft.value.environmentId = environmentId
  }

  function setDimensions(dimensions: Dimensions) {
    draft.value.dimensions = dimensions
    draft.value.estimate = null
  }

  // A new estimate always asks for a fresh above-range confirmation.
  function setEstimate(estimate: StockingEstimate) {
    draft.value.plannedFingerlings = estimate.plannedFingerlings
    draft.value.estimate = estimate
    draft.value.acceptedAboveRangeWarning = false
  }

  function acceptAboveRangeWarning(accepted: boolean) {
    draft.value.acceptedAboveRangeWarning = accepted
  }

  function saveCultivationDetails(details: { cultivationName: string; stockedOn: string | null }) {
    draft.value.cultivationName = details.cultivationName
    draft.value.stockedOn = details.stockedOn
  }

  function reset() {
    draft.value = emptySetupDraft()
    window.sessionStorage.removeItem(SETUP_DRAFT_STORAGE_KEY)
  }

  return {
    draft,
    selectSpecies,
    selectEnvironment,
    setDimensions,
    setEstimate,
    acceptAboveRangeWarning,
    saveCultivationDetails,
    reset,
  }
})
