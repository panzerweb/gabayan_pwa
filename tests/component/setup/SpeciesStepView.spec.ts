import { flushPromises } from '@vue/test-utils'

import SpeciesStepView from '@pages/setup/presentation/views/SpeciesStepView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { page } from '../../unit/marketplace/fixtures'
import { milkfish, pond, tilapia } from '../../unit/setup/fixtures'
import { mountInApp } from '../support/app'
import { storedDraft } from './support'

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
    listSpecies: vi.fn().mockResolvedValue(page([tilapia, milkfish])),
    listCultureEnvironments: vi.fn().mockResolvedValue(page([pond])),
  }
})

async function mountSpecies() {
  const mounted = await mountInApp(SpeciesStepView, { name: ROUTE_NAMES.setupSpecies })
  await flushPromises()
  return mounted
}

describe('SpeciesStepView', () => {
  it('asks only for active species and names each by both names where they differ', async () => {
    const { wrapper } = await mountSpecies()

    expect(repositories.setup.listSpecies).toHaveBeenCalledWith({ active: true })
    const options = wrapper.findAll('[role="radio"]').map((option) => option.text())
    expect(options[0]).toContain('Tilapia')
    expect(options[1]).toContain('Milkfish (Bangus)')
  })

  it('keeps Continue closed until a species is chosen, then saves the choice', async () => {
    const { wrapper } = await mountSpecies()

    expect(wrapper.get('button[disabled]').text()).toBe('Continue')

    await wrapper.findAll('[role="radio"]')[1]?.trigger('click')

    expect(wrapper.get('a.button').attributes('href')).toBe('/setup/environment')
    expect(storedDraft().speciesId).toBe('sp_milkfish')
  })

  it('offers a retry when the fish profiles fail to load', async () => {
    repositories.setup.listSpecies = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(page([tilapia]))
    const { wrapper } = await mountSpecies()

    expect(wrapper.text()).toContain('We couldn’t load the fish profiles.')

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[role="radio"]')).toHaveLength(1)
  })

  it('says so when no fish profile is available', async () => {
    repositories.setup.listSpecies = vi.fn().mockResolvedValue(page([]))
    const { wrapper } = await mountSpecies()

    expect(wrapper.text()).toContain('No fish profiles yet')
  })
})
