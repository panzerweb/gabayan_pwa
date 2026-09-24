import { flushPromises } from '@vue/test-utils'

import StockingResultView from '@pages/setup/presentation/views/StockingResultView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { aboveRangeEstimate, belowRangeEstimate, inRangeEstimate } from '../../unit/setup/fixtures'
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

const draft = {
  speciesId: 'sp_tilapia',
  environmentId: 'env_pond',
  dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
}

beforeEach(() => {
  window.sessionStorage.clear()
  repositories.setup = {
    createStockingEstimate: vi.fn().mockResolvedValue(envelope(inRangeEstimate)),
  }
})

async function mountResult(estimate: typeof inRangeEstimate) {
  seedDraft({ ...draft, estimate, plannedFingerlings: estimate.plannedFingerlings })
  return mountInApp(StockingResultView, { name: ROUTE_NAMES.setupStockingResult })
}

function reviewButton(wrapper: Awaited<ReturnType<typeof mountResult>>['wrapper']) {
  return wrapper.findAll('.button').find((button) => button.text() === 'Review cultivation')
}

describe('StockingResultView', () => {
  it('shows the server’s range, basis, demo label and disclaimer', async () => {
    const { wrapper } = await mountResult(inRangeEstimate)

    expect(wrapper.get('h2').text()).toBe('Your plan is within the demo range')
    expect(wrapper.text()).toContain('450–550 fish')
    expect(wrapper.text()).toContain('30 m³')
    expect(wrapper.text()).toContain('Demo density range for this prototype profile.')
    expect(wrapper.text()).toContain('Demo estimate.')
    expect(wrapper.text()).toContain(inRangeEstimate.disclaimer)
    expect(wrapper.text()).toContain('Rule version demo-2026-09')
    expect(wrapper.text()).not.toContain('Use suggested')
  })

  it('holds an above-range plan back from review until the warning is confirmed', async () => {
    const { wrapper } = await mountResult(aboveRangeEstimate)

    expect(wrapper.get('h2').text()).toBe('Your plan is above the demo range')
    expect(reviewButton(wrapper)?.attributes('disabled')).toBeDefined()

    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(reviewButton(wrapper)?.attributes('href')).toBe('/setup/review')
    expect(storedDraft().acceptedAboveRangeWarning).toBe(true)
  })

  it('re-estimates with the suggested count and shows the new result', async () => {
    const { wrapper } = await mountResult(belowRangeEstimate)

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Use suggested 500')
      ?.trigger('click')
    await flushPromises()

    expect(repositories.setup.createStockingEstimate).toHaveBeenCalledWith(
      { ...draft, plannedFingerlings: 500 },
      'access_1',
    )
    expect(wrapper.get('h2').text()).toBe('Your plan is within the demo range')
  })
})
