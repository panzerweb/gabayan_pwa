import { flushPromises } from '@vue/test-utils'

import DimensionsStepView from '@pages/setup/presentation/views/DimensionsStepView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { inRangeEstimate } from '../../unit/setup/fixtures'
import { labelled, submitButton } from '../cultivations/support'
import { mountInApp } from '../support/app'
import { seedDraft, storedDraft } from './support'

beforeEach(() => {
  window.sessionStorage.clear()
  seedDraft({ speciesId: 'sp_tilapia', environmentId: 'env_pond', estimate: inRangeEstimate })
})

async function mountDimensions() {
  return mountInApp(DimensionsStepView, { name: ROUTE_NAMES.setupDimensions })
}

describe('DimensionsStepView', () => {
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
