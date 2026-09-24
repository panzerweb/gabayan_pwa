import { flushPromises, type VueWrapper } from '@vue/test-utils'

import ChoosePlanView from '@pages/tiers/presentation/views/ChoosePlanView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { meta, pageInfo, plans, proRequest } from '../../unit/tiers/fixtures'
import { apiError, goOffline, mountInApp, refusingRepository } from '../support/app'

const repository = vi.hoisted(() => ({ current: {} as Record<string, ReturnType<typeof vi.fn>> }))

vi.mock('@pages/tiers/data/tiers.repository', () => ({
  get tiersRepository() {
    return repository.current
  },
}))

beforeEach(() => {
  repository.current = refusingRepository([
    'listPlans',
    'getAccountTier',
    'createUpgradeRequest',
  ] as const)
  repository.current.listPlans!.mockResolvedValue({ data: plans, page: pageInfo, meta })
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function open() {
  const mounted = await mountInApp(ChoosePlanView, { name: ROUTE_NAMES.setupPlan })
  await flushPromises()
  return mounted
}

function continueButton(wrapper: VueWrapper) {
  return wrapper.get('.setup-flow-actions button')
}

function radio(wrapper: VueWrapper, planName: string) {
  const label = wrapper.findAll('label').find((item) => item.text().startsWith(planName))
  if (!label) throw new Error(`No plan ${planName}`)
  return wrapper.get(`[id="${label.attributes('for')}"]`)
}

describe('ChoosePlanView', () => {
  it('lists the three plans as one choice with Free already chosen', async () => {
    const { wrapper } = await open()

    expect(wrapper.get('[role="radiogroup"]').attributes('aria-label')).toBe('Plans')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3)
    expect((radio(wrapper, 'Free').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.text()).toContain('Pricing coming soon')
    expect(continueButton(wrapper).text()).toBe('Continue with Free')
  })

  it('continues to setup on Free without sending anything', async () => {
    const { wrapper, router } = await open()

    await continueButton(wrapper).trigger('click')
    await flushPromises()

    expect(repository.current.createUpgradeRequest).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupIntro)
  })

  it('records a Pro request and continues on Free', async () => {
    repository.current.createUpgradeRequest!.mockResolvedValue({ data: proRequest, meta })
    const { wrapper, router, toast } = await open()

    await radio(wrapper, 'Pro').setValue(true)
    expect(continueButton(wrapper).text()).toBe('Request Pro and continue')
    await continueButton(wrapper).trigger('click')
    await flushPromises()

    expect(repository.current.createUpgradeRequest).toHaveBeenCalledWith(
      { requestedTier: 'PRO' },
      'access_1',
    )
    expect(toast.messages[0]?.message).toBe(
      'Pro request sent. You stay on Free until it is reviewed.',
    )
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupIntro)
  })

  it('stays on the step with the reason when a request is refused', async () => {
    repository.current.createUpgradeRequest!.mockRejectedValue(
      apiError(409, 'CONFLICT', 'Your plan request is still being reviewed.'),
    )
    const { wrapper, router } = await open()

    await radio(wrapper, 'Organization').setValue(true)
    await continueButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Your plan request is still being reviewed.')
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupPlan)
  })

  it('sends nothing while offline, but still lets the farmer go on with Free', async () => {
    goOffline()
    const { wrapper, router } = await open()

    await radio(wrapper, 'Pro').setValue(true)
    expect(wrapper.text()).toContain('You’re offline. Reconnect to send a plan request')
    await continueButton(wrapper).trigger('click')
    await flushPromises()
    expect(repository.current.createUpgradeRequest).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupPlan)

    await radio(wrapper, 'Free').setValue(true)
    await continueButton(wrapper).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupIntro)
  })

  it('offers a retry when the plans cannot be read and never blocks continuing on Free', async () => {
    repository.current.listPlans!.mockRejectedValue(new TypeError('Failed to fetch'))
    const { wrapper, router } = await open()

    expect(wrapper.text()).toContain('We couldn’t load the plans.')
    expect(continueButton(wrapper).text()).toBe('Continue with Free')
    await continueButton(wrapper).trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.setupIntro)
  })
})
