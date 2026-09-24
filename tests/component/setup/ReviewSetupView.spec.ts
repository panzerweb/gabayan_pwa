import { flushPromises } from '@vue/test-utils'

import ReviewSetupView from '@pages/setup/presentation/views/ReviewSetupView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001Detail } from '../../unit/cultivations/fixtures'
import { envelope } from '../../unit/marketplace/fixtures'
import { aboveRangeEstimate, inRangeEstimate } from '../../unit/setup/fixtures'
import { labelled } from '../cultivations/support'
import { apiError, goOffline, mountInApp } from '../support/app'
import { seedDraft } from './support'

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
  repositories.setup = {
    createCultivation: vi.fn().mockResolvedValue(envelope(batch001Detail)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function mountReview(estimate = inRangeEstimate) {
  seedDraft({ estimate, acceptedAboveRangeWarning: true })
  return mountInApp(ReviewSetupView, { name: ROUTE_NAMES.setupReview })
}

function createButton(wrapper: Awaited<ReturnType<typeof mountReview>>['wrapper']) {
  return wrapper.get('.setup-flow-actions button')
}

describe('ReviewSetupView', () => {
  it('summarises each answer with a link back to the step that changes it', async () => {
    const { wrapper } = await mountReview()

    const links = wrapper.findAll('.review-list a').map((link) => link.attributes('href'))
    expect(links).toEqual([
      '/setup/species',
      '/setup/environment',
      '/setup/dimensions',
      '/setup/fingerlings',
      '/setup/stocking-result',
    ])
    expect(wrapper.text()).toContain('5 × 4 × 1.5 m')
    expect(wrapper.text()).toContain('Within the demo range')
  })

  it('labels the optional details, asking for a reason only on an above-range plan', async () => {
    const inRange = await mountReview()
    expect(labelled(inRange.wrapper, 'Stocking date (optional)').attributes('type')).toBe('date')
    expect(inRange.wrapper.text()).not.toContain('Reason for continuing (optional)')
    inRange.wrapper.unmount()

    const aboveRange = await mountReview(aboveRangeEstimate)
    expect(labelled(aboveRange.wrapper, 'Reason for continuing (optional)').element.tagName).toBe(
      'INPUT',
    )
  })

  it('creates the cultivation with the typed name', async () => {
    const { wrapper, router } = await mountReview()
    await labelled(wrapper, 'Cultivation name (optional)').setValue('Pond A')

    await createButton(wrapper).trigger('click')
    await flushPromises()

    expect(repositories.setup.createCultivation?.mock.calls[0]?.[0]).toMatchObject({
      name: 'Pond A',
    })
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupSuccess)
  })

  it('explains a cultivation the plan has no room for and points to the plans', async () => {
    const message =
      'Your Free plan covers 1 active culture system. Harvest or close one, or ask for a bigger plan.'
    repositories.setup.createCultivation!.mockRejectedValue(
      apiError(403, 'TIER_LIMIT_REACHED', message),
    )
    const { wrapper, router } = await mountReview()

    await createButton(wrapper).trigger('click')
    await flushPromises()

    const notice = wrapper.get('.tier-limit-notice')
    expect(notice.attributes('role')).toBe('alert')
    expect(notice.text()).toContain(message)
    expect(notice.get('a').attributes('href')).toBe('/app/plans')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupReview)
  })

  it('keeps any other refusal as a plain message without the plans', async () => {
    repositories.setup.createCultivation!.mockRejectedValue(
      apiError(409, 'CONFLICT', 'The stocking estimate expired. Request a new estimate.'),
    )
    const { wrapper } = await mountReview()

    await createButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.find('.tier-limit-notice').exists()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'The stocking estimate expired. Request a new estimate.',
    )
  })

  it('disables creation offline and says it will not be queued', async () => {
    goOffline()
    const { wrapper } = await mountReview()
    await flushPromises()

    expect(createButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain(
      'You’re offline. Reconnect before creating this cultivation. It will not be queued.',
    )
  })
})
