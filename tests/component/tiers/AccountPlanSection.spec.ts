import { flushPromises } from '@vue/test-utils'

import AccountPlanSection from '@pages/tiers/presentation/components/AccountPlanSection.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { accountTier, meta, proPlan, proRequest } from '../../unit/tiers/fixtures'
import { mountInApp, refusingRepository } from '../support/app'

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
})

async function open() {
  const mounted = await mountInApp(AccountPlanSection, { name: ROUTE_NAMES.profile })
  await flushPromises()
  return mounted
}

describe('AccountPlanSection', () => {
  it('shows the plan, its limit, how much is in use and the way to the plans', async () => {
    repository.current.getAccountTier!.mockResolvedValue({
      data: accountTier({ plan: proPlan, activeCultureSystems: 2, remainingCultureSystems: 8 }),
      meta,
    })
    const { wrapper } = await open()

    expect(wrapper.get('h2').text()).toBe('Your plan')
    expect(wrapper.text()).toContain('Pro')
    expect(wrapper.text()).toContain('Pricing coming soon')
    expect(wrapper.text()).toContain('Up to 10 culture systems')
    expect(wrapper.text()).toContain('2 of 10 culture systems in use')
    expect(wrapper.text()).not.toContain('Every culture system on this plan is in use')
    const link = wrapper.get('a')
    expect(link.text()).toBe('See plans')
    expect(link.attributes('href')).toBe('/app/plans')
  })

  it('says when the plan is full and when a request is waiting', async () => {
    repository.current.getAccountTier!.mockResolvedValue({
      data: accountTier({ pendingUpgradeRequest: proRequest }),
      meta,
    })
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('1 of 1 culture system in use')
    expect(wrapper.text()).toContain('Every culture system on this plan is in use.')
    expect(wrapper.get('.status-chip').text()).toBe('Pro request pending')
  })

  it('offers a retry when the plan cannot be read', async () => {
    repository.current.getAccountTier!.mockRejectedValue(new TypeError('Failed to fetch'))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('We couldn’t load your plan.')
    repository.current.getAccountTier!.mockResolvedValue({ data: accountTier(), meta })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('1 of 1 culture system in use')
  })
})
