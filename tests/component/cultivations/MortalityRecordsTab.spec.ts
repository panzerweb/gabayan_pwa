import { flushPromises } from '@vue/test-utils'
import { h } from 'vue'

import MortalityRecordsTab from '@pages/cultivations/presentation/components/MortalityRecordsTab.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { mortalityRecord, mortalityResult } from '../../unit/cultivations/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { apiError, goOffline, mountInApp } from '../support/app'
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
    listMortalityRecords: vi.fn().mockResolvedValue(page([mortalityRecord])),
    createMortalityRecord: vi.fn().mockResolvedValue(envelope(mortalityResult)),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function openForm() {
  const Host = { render: () => h(MortalityRecordsTab, { cultivationId: 'cul_tilapia_001' }) }
  const mounted = await mountInApp(Host, {
    name: ROUTE_NAMES.cultivationRecords,
    params: { cultivationId: 'cul_tilapia_001' },
    query: { tab: 'mortality' },
  })
  await flushPromises()
  await button(mounted.wrapper, 'Add').trigger('click')
  return mounted
}

describe('MortalityRecordsTab', () => {
  it('labels every mortality field', async () => {
    const { wrapper } = await openForm()

    expect(labelled(wrapper, 'Date observed').attributes('type')).toBe('date')
    expect(labelled(wrapper, 'Number of fish').attributes('inputmode')).toBe('numeric')
    const reason = labelled(wrapper, 'Likely reason')
    expect(reason.element.tagName).toBe('SELECT')
    expect(reason.findAll('option').map((option) => option.text())).toContain('Water quality')
    expect(wrapper.text()).toContain('Notes (optional)')
  })

  it('stops a blank or fractional fish count before sending', async () => {
    const { wrapper } = await openForm()

    await labelled(wrapper, 'Number of fish').setValue('2.5')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter a whole number greater than 0.')
    expect(labelled(wrapper, 'Number of fish').attributes('aria-invalid')).toBe('true')
    expect(repositories.cultivations.createMortalityRecord).not.toHaveBeenCalled()
  })

  it('saves the loss and repeats the new live-fish estimate', async () => {
    const { wrapper, toast } = await openForm()

    await labelled(wrapper, 'Number of fish').setValue('5')
    await labelled(wrapper, 'Likely reason').setValue('HANDLING')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [, body, key] = repositories.cultivations.createMortalityRecord!.mock.calls[0]!
    expect(body).toMatchObject({ fishCount: 5, reason: 'HANDLING', notes: null })
    expect(key).toEqual(expect.any(String))
    expect(toast.messages.map((item) => item.message)).toContain(
      'Mortality saved. Estimated live fish: 480.',
    )
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows the server’s refusal beside the fish count', async () => {
    repositories.cultivations.createMortalityRecord!.mockRejectedValueOnce(
      apiError(422, 'VALIDATION_ERROR', 'Review the mortality record.', {
        fishCount: ['Mortality cannot exceed the estimated live fish.'],
      }),
    )
    const { wrapper } = await openForm()

    await labelled(wrapper, 'Number of fish').setValue('900')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Mortality cannot exceed the estimated live fish.')
    expect(wrapper.text()).toContain('Check the highlighted fields.')
  })

  it('keeps the form disabled offline and says the record will not be queued', async () => {
    goOffline()
    const { wrapper } = await openForm()

    expect(wrapper.text()).toContain(
      'Reconnect to save this mortality record; it will not be queued.',
    )
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
