import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import type { Dimensions, StockingEstimate } from '@/services/api'

interface SetupDraft {
  speciesId: string | null
  environmentId: string | null
  dimensions: Dimensions | null
  plannedFingerlings: number | null
  estimate: StockingEstimate | null
  acceptedAboveRangeWarning: boolean
  cultivationName: string
  stockedOn: string | null
}

const storageKey = 'gabayan.setup-draft.v1'

function emptyDraft(): SetupDraft {
  return {
    speciesId: null,
    environmentId: null,
    dimensions: null,
    plannedFingerlings: null,
    estimate: null,
    acceptedAboveRangeWarning: false,
    cultivationName: '',
    stockedOn: null,
  }
}

function loadDraft(): SetupDraft {
  try {
    const stored = window.sessionStorage.getItem(storageKey)
    return stored
      ? { ...emptyDraft(), ...(JSON.parse(stored) as Partial<SetupDraft>) }
      : emptyDraft()
  } catch {
    return emptyDraft()
  }
}

export const useSetupStore = defineStore('setup', () => {
  const draft = ref<SetupDraft>(loadDraft())

  watch(draft, (value) => window.sessionStorage.setItem(storageKey, JSON.stringify(value)), {
    deep: true,
  })

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

  function setEstimate(estimate: StockingEstimate) {
    draft.value.plannedFingerlings = estimate.plannedFingerlings
    draft.value.estimate = estimate
    draft.value.acceptedAboveRangeWarning = false
  }

  function reset() {
    draft.value = emptyDraft()
    window.sessionStorage.removeItem(storageKey)
  }

  return { draft, selectSpecies, selectEnvironment, setDimensions, setEstimate, reset }
})
