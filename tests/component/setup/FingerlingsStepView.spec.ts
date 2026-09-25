import { flushPromises } from '@vue/test-utils'

import FingerlingsStepView from '@pages/setup/presentation/views/FingerlingsStepView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { aboveRangeEstimate } from '../../unit/setup/fixtures'
import { labelled } from '../cultivations/support'
import { apiError, goOffline, mountInApp } from '../support/app'
import { seedDraft, storedDraft } from './support'

const repositories = vi.hoisted(() => ({
  setup: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/setup/data/setup.repository', () => ({
  get setupRepository() {
    return repositories.setup
  },
}))

const dimensions = { lengthM: 5, widthM: 4, waterDepthM: 1.5 }

beforeEach(() => {
  window.sessionStorage.clear()
  seedDraft({ speciesId: 'sp_tilapia', environmentId: 'env_pond', dimensions })
  repositories.setup = {
    createStockingEstimate: vi.fn().mockResolvedValue(envelope(aboveRangeEstimate)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function submitCount(count: string) {
  const mounted = await mountInApp(FingerlingsStepView, { name: ROUTE_NAMES.setupFingerlings })
  await labelled(mounted.wrapper, 'Planned fingerlings').setValue(count)
  await mounted.wrapper.get('form').trigger('submit')
  await flushPromises()
  return mounted
}

describe('FingerlingsStepView', () => {
  it('labels the count as a whole-number input', async () => {
    const { wrapper } = await mountInApp(FingerlingsStepView, {
      name: ROUTE_NAMES.setupFingerlings,
    })

    expect(labelled(wrapper, 'Planned fingerlings').attributes('inputmode')).toBe('numeric')
  })

  it('refuses a fractional count without asking the server', async () => {
    const { wrapper } = await submitCount('12.5')

    expect(wrapper.text()).toContain('Enter a whole number greater than 0.')
    expect(repositories.setup.createStockingEstimate).not.toHaveBeenCalled()
  })

  it('asks the server for the estimate and opens the result with it', async () => {
    const { router } = await submitCount('800')

    expect(repositories.setup.createStockingEstimate).toHaveBeenCalledWith(
      { speciesId: 'sp_tilapia', environmentId: 'env_pond', dimensions, plannedFingerlings: 800 },
      'access_1',
    )
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupStockingResult)
    expect(storedDraft()).toMatchObject({
      plannedFingerlings: 800,
      estimate: { status: 'ABOVE_RANGE' },
    })
  })

  it('shows the server’s field message beside the count', async () => {
    repositories.setup.createStockingEstimate = vi.fn().mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Check the highlighted fields.', {
        plannedFingerlings: ['Enter no more than 100,000 fingerlings.'],
      }),
    )
    const { wrapper, router } = await submitCount('500000')

    expect(wrapper.text()).toContain('Enter no more than 100,000 fingerlings.')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupFingerlings)
  })

  it('asks for a connection instead of sending while offline', async () => {
    goOffline()
    const { wrapper } = await submitCount('500')

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Reconnect before requesting a new stocking estimate.',
    )
    expect(repositories.setup.createStockingEstimate).not.toHaveBeenCalled()
  })
})
