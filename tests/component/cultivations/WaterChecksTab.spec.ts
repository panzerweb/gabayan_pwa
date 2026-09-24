import { flushPromises } from '@vue/test-utils'
import { h } from 'vue'

import WaterChecksTab from '@pages/cultivations/presentation/components/WaterChecksTab.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { calmWaterCheck, waterCheckResult } from '../../unit/cultivations/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { goOffline, mountInApp } from '../support/app'
import { button, labelled, submitButton } from './support'

const repositories = vi.hoisted(() => ({
  cultivations: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  get cultivationsRepository() {
    return repositories.cultivations
  },
}))

beforeEach(() => {
  repositories.cultivations = {
    listWaterChecks: vi.fn().mockResolvedValue(page([calmWaterCheck])),
    createWaterCheck: vi.fn().mockResolvedValue(envelope(waterCheckResult)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function openForm() {
  const Host = { render: () => h(WaterChecksTab, { cultivationId: 'cul_tilapia_001' }) }
  const mounted = await mountInApp(Host, {
    name: ROUTE_NAMES.cultivationRecords,
    params: { cultivationId: 'cul_tilapia_001' },
    query: { tab: 'water' },
  })
  await flushPromises()
  await button(mounted.wrapper, 'Add').trigger('click')
  return mounted
}

describe('WaterChecksTab', () => {
  it('labels every observation and explains the less obvious ones', async () => {
    const { wrapper } = await openForm()

    expect(labelled(wrapper, 'Check date').attributes('type')).toBe('date')
    expect((labelled(wrapper, 'Water clarity').element as HTMLInputElement).value).toBe('Clear')
    expect(labelled(wrapper, 'Water clarity').attributes('aria-describedby')).toBeDefined()
    expect(labelled(wrapper, 'Odor').element.tagName).toBe('INPUT')
    expect(labelled(wrapper, 'Fish behavior').element.tagName).toBe('INPUT')
    expect(labelled(wrapper, 'Action taken (optional)').element.tagName).toBe('INPUT')
    expect(wrapper.text()).toContain('I noticed an unusual change')
    expect(wrapper.text()).toContain('Guidance remains conditional.')
  })

  it('asks for each blank observation before sending', async () => {
    const { wrapper } = await openForm()

    await labelled(wrapper, 'Water clarity').setValue(' ')
    await labelled(wrapper, 'Fish behavior').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Describe how clear the water looks.')
    expect(wrapper.text()).toContain('Describe how the fish are behaving.')
    expect(wrapper.text()).not.toContain('Describe how the water smells.')
    expect(repositories.cultivations.createWaterCheck).not.toHaveBeenCalled()
  })

  it('saves an unusual change and toasts the guidance title that came back', async () => {
    const { wrapper, toast } = await openForm()

    await labelled(wrapper, 'Water clarity').setValue('Cloudier than usual')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [cultivationId, body] = repositories.cultivations.createWaterCheck!.mock.calls[0]!
    expect(cultivationId).toBe('cul_tilapia_001')
    expect(body).toMatchObject({
      observation: { clarity: 'Cloudier than usual', odor: 'Normal', unusualChanges: true },
      actionTaken: null,
    })
    expect(toast.messages.map((item) => item.message)).toContain('Review the change promptly')
  })

  it('keeps the form disabled offline and says the check will not be queued', async () => {
    goOffline()
    const { wrapper } = await openForm()

    expect(wrapper.text()).toContain('Reconnect to save this water check; it will not be queued.')
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
