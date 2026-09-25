import { flushPromises } from '@vue/test-utils'

import SetupSuccessView from '@pages/setup/presentation/views/SetupSuccessView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope } from '../../unit/marketplace/fixtures'
import { inRangeEstimate, recommendations } from '../../unit/setup/fixtures'
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
  seedDraft({ speciesId: 'sp_tilapia', estimate: inRangeEstimate })
  repositories.setup = {
    getEquipmentRecommendations: vi.fn().mockResolvedValue(envelope(recommendations)),
  }
})

async function mountSuccess() {
  const mounted = await mountInApp(SetupSuccessView, {
    name: ROUTE_NAMES.setupSuccess,
    params: { cultivationId: 'cul_00002' },
  })
  await flushPromises()
  return mounted
}

describe('SetupSuccessView', () => {
  it('lists the optional equipment with its price, reason and demo disclaimer', async () => {
    const { wrapper } = await mountSuccess()

    expect(repositories.setup.getEquipmentRecommendations).toHaveBeenCalledWith(
      'cul_00002',
      'access_1',
    )
    expect(wrapper.text()).toContain('Compact Pond Aerator')
    expect(wrapper.text()).toContain('₱1,299.00')
    expect(wrapper.text()).toContain('Aeration may help support dissolved oxygen')
    expect(wrapper.text()).toContain('Demo recommendation.')
    const productLink = wrapper.findAll('a').find((link) => link.text() === 'View product')
    expect(productLink?.attributes('href')).toBe(
      '/app/products/prd_pond_aerator?cultivationId=cul_00002',
    )
  })

  it('opens the marketplace filtered to the new cultivation’s species and environment', async () => {
    const { wrapper } = await mountSuccess()

    const browse = wrapper.findAll('a').find((link) => link.text() === 'Browse relevant supplies')
    expect(browse?.attributes('href')).toBe(
      '/app/marketplace?speciesId=sp_tilapia&environmentId=env_pond',
    )
  })

  it('still confirms the cultivation when recommendations fail, with a retry', async () => {
    repositories.setup.getEquipmentRecommendations = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'))
    const { wrapper } = await mountSuccess()

    expect(wrapper.get('[role="alert"]').text()).toContain('The cultivation was saved')
    expect(wrapper.text()).toContain('Continue to Home')
  })

  it('clears the finished wizard draft', async () => {
    await mountSuccess()

    expect(storedDraft()?.speciesId ?? null).toBeNull()
  })

  it('offers Buy now on each recommended tool with its suggested quantity', async () => {
    const { wrapper } = await mountSuccess()

    const buy = wrapper.get('a[aria-label="Buy now: Compact Pond Aerator"]')
    expect(buy.text()).toBe('Buy now')
    expect(buy.attributes('href')).toBe(
      '/app/products/prd_pond_aerator?quantity=1&cultivationId=cul_00002',
    )
  })
})
