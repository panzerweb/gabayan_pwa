import { flushPromises } from '@vue/test-utils'

import DimensionsStepView from '@pages/setup/presentation/views/DimensionsStepView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope, page } from '../../unit/marketplace/fixtures'
import {
  bangusPondSizing,
  inRangeEstimate,
  milkfish,
  pond,
  tilapia,
} from '../../unit/setup/fixtures'
import { labelled, submitButton } from '../cultivations/support'
import { mountInApp } from '../support/app'
import { seedDraft, storedDraft } from './support'

const repositories = vi.hoisted(() => ({
  setup: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/setup/data/setup.repository', () => ({
  get setupRepository() {
    return repositories.setup
  },
}))

beforeEach(() => {
  window.sessionStorage.clear()
  seedDraft({ speciesId: 'sp_tilapia', environmentId: 'env_pond', estimate: inRangeEstimate })
  repositories.setup = {
    listSpecies: vi.fn().mockResolvedValue(page([tilapia, milkfish])),
    listCultureEnvironments: vi.fn().mockResolvedValue(page([pond])),
    getSizingGuidance: vi.fn().mockResolvedValue(envelope(bangusPondSizing)),
  }
})

async function mountDimensions() {
  return mountInApp(DimensionsStepView, { name: ROUTE_NAMES.setupDimensions })
}

function sizingDialog(wrapper: Awaited<ReturnType<typeof mountDimensions>>['wrapper']) {
  return wrapper.find('[role="dialog"]')
}

function buttonNamed(
  wrapper: Awaited<ReturnType<typeof mountDimensions>>['wrapper'],
  name: string,
) {
  const found = wrapper.findAll('button').find((button) => button.text() === name)
  if (!found) throw new Error(`No button "${name}"`)
  return found
}

describe('DimensionsStepView', () => {
  it('opens the suggested size for the chosen fish the first time the step is reached', async () => {
    seedDraft({ speciesId: 'sp_milkfish', environmentId: 'env_pond' })
    const { wrapper } = await mountDimensions()
    await flushPromises()

    expect(repositories.setup.getSizingGuidance).toHaveBeenCalledWith('sp_milkfish', 'env_pond')
    const dialog = sizingDialog(wrapper)
    expect(dialog.exists()).toBe(true)
    expect(dialog.get('h2').text()).toBe('Suggested pond size for Milkfish (Bangus)')
    expect(dialog.text()).toContain('About 5,000 m² (0.5 ha)')
    expect(dialog.text()).toContain('At least 1.0–1.2 m')
    expect(dialog.text()).toContain('Demo figures, not yet reviewed')
  })

  it('closes the suggestion and opens it again from the step', async () => {
    const { wrapper } = await mountDimensions()
    await flushPromises()

    await buttonNamed(wrapper, 'Got it').trigger('click')
    expect(sizingDialog(wrapper).exists()).toBe(false)

    await buttonNamed(wrapper, 'See the suggested size and depth').trigger('click')
    await flushPromises()
    expect(sizingDialog(wrapper).exists()).toBe(true)
  })

  it('leaves the suggestion closed once measurements are saved', async () => {
    seedDraft({
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
    })
    const { wrapper } = await mountDimensions()
    await flushPromises()

    expect(sizingDialog(wrapper).exists()).toBe(false)
    expect(repositories.setup.getSizingGuidance).not.toHaveBeenCalled()
    expect(labelled(wrapper, 'Length').element).toHaveProperty('value', '5')
  })

  it('labels each measurement as a decimal input in meters', async () => {
    const { wrapper } = await mountDimensions()

    for (const label of ['Length', 'Width', 'Average water depth']) {
      expect(labelled(wrapper, label).attributes('inputmode')).toBe('decimal')
    }
    expect(wrapper.text()).toContain('Use the typical filled depth, not the full wall height.')
  })

  it('previews area and volume as the farmer types', async () => {
    const { wrapper } = await mountDimensions()

    await labelled(wrapper, 'Length').setValue('5')
    await labelled(wrapper, 'Width').setValue('4')
    await labelled(wrapper, 'Average water depth').setValue('1.5')

    expect(wrapper.text()).toContain('20 m²')
    expect(wrapper.text()).toContain('30 m³')
  })

  it('names each blank or zero measurement and stays on the step', async () => {
    const { wrapper, router } = await mountDimensions()
    await labelled(wrapper, 'Length').setValue('5')
    await labelled(wrapper, 'Average water depth').setValue('0')

    await submitButton(wrapper).trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter a width greater than 0.')
    expect(wrapper.text()).toContain('Enter a water depth greater than 0.')
    expect(wrapper.text()).not.toContain('Enter a length greater than 0.')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupDimensions)
  })

  it('saves the dimensions, drops the old estimate and moves to the fingerlings step', async () => {
    const { wrapper, router } = await mountDimensions()
    await labelled(wrapper, 'Length').setValue('6')
    await labelled(wrapper, 'Width').setValue('4')
    await labelled(wrapper, 'Average water depth').setValue('1.2')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupFingerlings)
    expect(storedDraft()).toMatchObject({
      dimensions: { lengthM: 6, widthM: 4, waterDepthM: 1.2 },
      estimate: null,
    })
  })
})
