import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import {
  SETUP_DRAFT_STORAGE_KEY,
  useSetupStore,
} from '@pages/setup/presentation/stores/setup.store'

import { aboveRangeEstimate, inRangeEstimate } from './fixtures'

function stored() {
  return JSON.parse(window.sessionStorage.getItem(SETUP_DRAFT_STORAGE_KEY) ?? 'null')
}

beforeEach(() => {
  window.sessionStorage.clear()
  setActivePinia(createPinia())
})

describe('setup store', () => {
  it('keeps the draft in session storage as the farmer answers', async () => {
    const setup = useSetupStore()

    setup.selectSpecies('sp_tilapia')
    await nextTick()

    expect(stored()).toMatchObject({ speciesId: 'sp_tilapia', environmentId: null })
  })

  it('resumes a draft left in session storage by a reload', () => {
    window.sessionStorage.setItem(
      SETUP_DRAFT_STORAGE_KEY,
      JSON.stringify({ speciesId: 'sp_tilapia', environmentId: 'env_pond' }),
    )

    const setup = useSetupStore()

    expect(setup.draft).toMatchObject({
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: null,
      acceptedAboveRangeWarning: false,
    })
  })

  it('starts afresh when the stored draft cannot be read', () => {
    window.sessionStorage.setItem(SETUP_DRAFT_STORAGE_KEY, '{not json')

    expect(useSetupStore().draft.speciesId).toBeNull()
  })

  it('clears the environment and estimate when a different species is chosen', () => {
    const setup = useSetupStore()
    setup.selectSpecies('sp_tilapia')
    setup.selectEnvironment('env_pond')
    setup.setEstimate(inRangeEstimate)

    setup.selectSpecies('sp_tilapia')
    expect(setup.draft.estimate).not.toBeNull()

    setup.selectSpecies('sp_milkfish')
    expect(setup.draft).toMatchObject({ environmentId: null, estimate: null })
  })

  it('drops the estimate when the dimensions change', () => {
    const setup = useSetupStore()
    setup.setEstimate(inRangeEstimate)

    setup.setDimensions({ lengthM: 6, widthM: 4, waterDepthM: 1.5 })

    expect(setup.draft.estimate).toBeNull()
  })

  it('asks for a fresh above-range confirmation with every new estimate', () => {
    const setup = useSetupStore()
    setup.setEstimate(aboveRangeEstimate)
    setup.acceptAboveRangeWarning(true)

    setup.setEstimate(aboveRangeEstimate)

    expect(setup.draft.acceptedAboveRangeWarning).toBe(false)
    expect(setup.draft.plannedFingerlings).toBe(800)
  })

  it('forgets the draft once reset', async () => {
    const setup = useSetupStore()
    setup.selectSpecies('sp_tilapia')
    await nextTick()

    setup.reset()
    await nextTick()

    expect(setup.draft.speciesId).toBeNull()
    expect(stored()?.speciesId ?? null).toBeNull()
  })
})
