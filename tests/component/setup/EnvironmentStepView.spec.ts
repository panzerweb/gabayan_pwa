import { flushPromises } from '@vue/test-utils'

import EnvironmentStepView from '@pages/setup/presentation/views/EnvironmentStepView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope, page } from '../../unit/marketplace/fixtures'
import { compatible, fishCage, notRecommended, pond, tilapia } from '../../unit/setup/fixtures'
import { mountInApp } from '../support/app'
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
  seedDraft({ speciesId: 'sp_tilapia' })
  repositories.setup = {
    listSpecies: vi.fn().mockResolvedValue(page([tilapia])),
    listCultureEnvironments: vi.fn().mockResolvedValue(page([pond, fishCage])),
    getCompatibility: vi.fn((_speciesId: string, environmentId: string) =>
      Promise.resolve(envelope(environmentId === 'env_cage' ? notRecommended : compatible)),
    ),
  }
})

async function choose(name: string) {
  const mounted = await mountInApp(EnvironmentStepView, { name: ROUTE_NAMES.setupEnvironment })
  await flushPromises()
  const option = mounted.wrapper
    .findAll('[role="radio"]')
    .find((radio) => radio.text().includes(name))
  await option?.trigger('click')
  await flushPromises()
  return mounted
}

function continueLink(wrapper: Awaited<ReturnType<typeof choose>>['wrapper']) {
  return wrapper.findAll('.setup-flow-actions .button').find((b) => b.text() === 'Continue')
}

describe('EnvironmentStepView', () => {
  it('checks the chosen pairing and opens the dimensions step when it can be planned', async () => {
    const { wrapper } = await choose('Pond')

    expect(repositories.setup.getCompatibility).toHaveBeenCalledWith('sp_tilapia', 'env_pond')
    expect(wrapper.get('[role="status"]').text()).toContain('This setup can be planned')
    expect(continueLink(wrapper)?.attributes('href')).toBe('/setup/dimensions')
  })

  it('keeps the step closed for a pairing the profile advises against, naming alternatives', async () => {
    const { wrapper } = await choose('Fish Cage')

    const notice = wrapper.get('[role="status"]')
    expect(notice.text()).toContain('This pairing is not recommended')
    expect(notice.text()).toContain('You could consider: Pond.')
    expect(continueLink(wrapper)?.attributes('disabled')).toBeDefined()
  })

  it('offers to check again when the compatibility check fails', async () => {
    repositories.setup.getCompatibility = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(envelope(compatible))
    const { wrapper } = await choose('Pond')

    expect(wrapper.get('[role="alert"]').text()).toBe('We couldn’t check this combination.')
    expect(continueLink(wrapper)?.attributes('disabled')).toBeDefined()

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Check again')
      ?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('This setup can be planned')
  })
})
