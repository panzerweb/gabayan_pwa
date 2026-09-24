import { flushPromises, type VueWrapper } from '@vue/test-utils'

import PlansView from '@pages/tiers/presentation/views/PlansView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { accountTier, meta, pageInfo, plans, proPlan, proRequest } from '../../unit/tiers/fixtures'
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
  repository.current.getAccountTier!.mockResolvedValue({ data: accountTier(), meta })
})

function requestButton(wrapper: VueWrapper, planName: string) {
  const found = wrapper.findAll('button').find((item) => item.text() === `Request ${planName}`)
  if (!found) throw new Error(`No request button for ${planName}`)
  return found
}

async function open(query: Record<string, string> = {}) {
  const mounted = await mountInApp(PlansView, { name: ROUTE_NAMES.plans, query })
  await flushPromises()
  return mounted
}

describe('PlansView', () => {
  it('shows each plan with its price, limit and contents, and marks the current one', async () => {
    const { wrapper } = await open()

    const cards = wrapper.findAll('article')
    expect(cards).toHaveLength(3)
    expect(cards[0]!.text()).toContain('Current plan')
    expect(cards[0]!.text()).toContain('₱0.00 / month')
    expect(cards[0]!.text()).toContain('1 culture system')
    expect(cards[1]!.text()).toContain('Pricing coming soon')
    expect(cards[1]!.text()).toContain('Up to 10 culture systems')
    expect(cards[1]!.text()).toContain('Saved water readings with history')
    expect(cards[2]!.text()).toContain('₱4,999.00 / month')
    expect(wrapper.text()).toContain('You’re on Free')
    expect(wrapper.text()).toContain('1 of 1 culture system in use')
  })

  it('offers only the plans above the current one', async () => {
    repository.current.getAccountTier!.mockResolvedValue({
      data: accountTier({ plan: proPlan, remainingCultureSystems: 9 }),
      meta,
    })
    const { wrapper } = await open()

    const labels = wrapper.findAll('button').map((item) => item.text())
    expect(labels).toEqual(['Request Organization'])
  })

  it('explains which plan a guarded screen needs', async () => {
    const { wrapper } = await open({ required: 'PRO' })

    expect(wrapper.get('[role="status"]').text()).toContain(
      'That screen is part of the Pro plan. Your account is on Free.',
    )
  })

  it('says nothing about a required plan the account already has', async () => {
    const { wrapper } = await open({ required: 'FREE' })

    expect(wrapper.text()).not.toContain('That screen is part of')
  })

  it('sends a request, says the plan stays until review, and reads the tier again', async () => {
    repository.current.createUpgradeRequest!.mockResolvedValue({ data: proRequest, meta })
    const { wrapper, toast } = await open()
    repository.current.getAccountTier!.mockResolvedValue({
      data: accountTier({ pendingUpgradeRequest: proRequest }),
      meta,
    })

    await requestButton(wrapper, 'Pro').trigger('click')
    await flushPromises()

    expect(repository.current.createUpgradeRequest).toHaveBeenCalledWith(
      { requestedTier: 'PRO' },
      'access_1',
    )
    expect(toast.messages[0]?.message).toBe(
      'Pro request sent. You stay on Free until it is reviewed.',
    )
    expect(wrapper.text()).toContain('Your request for Pro was sent on Sep 23, 2026.')
  })

  it('rests every request while one is waiting for review', async () => {
    repository.current.getAccountTier!.mockResolvedValue({
      data: accountTier({ pendingUpgradeRequest: proRequest }),
      meta,
    })
    const { wrapper } = await open()

    expect(requestButton(wrapper, 'Pro').attributes('disabled')).toBeDefined()
    expect(requestButton(wrapper, 'Organization').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('You stay on Free until it is reviewed.')
  })

  it('shows the server sentence when a request is refused', async () => {
    repository.current.createUpgradeRequest!.mockRejectedValue(
      apiError(409, 'CONFLICT', 'Your plan request is still being reviewed.'),
    )
    const { wrapper } = await open()

    await requestButton(wrapper, 'Organization').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Your plan request is still being reviewed.')
  })

  it('keeps requests off while offline and says why', async () => {
    goOffline()
    const { wrapper } = await open()

    expect(requestButton(wrapper, 'Pro').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('You’re offline. Reconnect to send a plan request.')
  })

  it('offers a retry when the plans cannot be read', async () => {
    repository.current.listPlans!.mockRejectedValue(new TypeError('Failed to fetch'))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('We couldn’t load the plans.')
    repository.current.listPlans!.mockResolvedValue({ data: plans, page: pageInfo, meta })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(3)
  })
})
