import { flushPromises } from '@vue/test-utils'

import CultivationWaterLogView from '@pages/cultivations/presentation/views/CultivationWaterLogView.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { batch001Detail } from '../../unit/cultivations/fixtures'
import { envelope, page } from '../../unit/marketplace/fixtures'
import { tilapiaPondThresholds } from '../../unit/water-quality/fixtures'
import { seededLogs } from '../../unit/water-quality/log-fixtures'
import { apiError, mountInApp } from '../support/app'
import { button, labelled, submitButton } from './support'

const repositories = vi.hoisted(() => ({
  cultivations: {} as Record<string, ReturnType<typeof vi.fn>>,
  waterQuality: {} as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@pages/cultivations/data/cultivations.repository', () => ({
  get cultivationsRepository() {
    return repositories.cultivations
  },
}))

vi.mock('@pages/water-quality/data/water-quality.repository', () => ({
  get waterQualityRepository() {
    return repositories.waterQuality
  },
}))

beforeEach(() => {
  repositories.cultivations = {
    getCultivation: vi.fn().mockResolvedValue(envelope(batch001Detail)),
  }
  repositories.waterQuality = {
    getWaterThresholds: vi.fn().mockResolvedValue(envelope(tilapiaPondThresholds)),
    listWaterParameterLogs: vi.fn().mockResolvedValue(page(seededLogs)),
    createWaterParameterLog: vi.fn().mockResolvedValue(envelope(seededLogs[0])),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function open() {
  const mounted = await mountInApp(CultivationWaterLogView, {
    name: ROUTE_NAMES.cultivationWaterLog,
    params: { cultivationId: 'cul_tilapia_001' },
  })
  await flushPromises()
  return mounted
}

describe('CultivationWaterLogView', () => {
  it('lists the saved logs newest first with the readings out of range named', async () => {
    const { wrapper } = await open()

    expect(repositories.waterQuality.listWaterParameterLogs).toHaveBeenCalledWith(
      'cul_tilapia_001',
      'access_1',
    )
    const logs = wrapper.findAll('.water-history__log')
    expect(logs).toHaveLength(3)
    expect(logs[0]!.text()).toContain('Sep 22, 2026')
    expect(logs[0]!.text()).toContain('1 reading out of range')
    expect(logs[0]!.text()).toContain('Below range')
    expect(logs[1]!.text()).toContain('Above range')
    expect(logs[1]!.text()).toContain('Not measured: Salinity, Nitrate.')
    expect(logs[2]!.text()).toContain('All readings within range')
    expect(wrapper.text()).toContain('Demo figures, not yet reviewed')
  })

  it('saves a new reading from the sheet with its notes', async () => {
    const { wrapper } = await open()

    await button(wrapper, 'Log a reading').trigger('click')
    await labelled(wrapper, 'pH (scale 0–14)').setValue('7.2')
    await labelled(wrapper, 'Notes (optional)').setValue('Clear water after the rain.')
    await submitButton(wrapper).trigger('submit')
    await flushPromises()

    expect(repositories.waterQuality.createWaterParameterLog).toHaveBeenCalledWith(
      'cul_tilapia_001',
      { readings: { ph: 7.2 }, notes: 'Clear water after the rain.' },
      expect.any(String),
      'access_1',
    )
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('shows each reading’s suggested range while logging', async () => {
    const { wrapper } = await open()

    await button(wrapper, 'Log a reading').trigger('click')

    expect(wrapper.get('[role="dialog"]').text()).toContain('Suggested: Up to 0.5 mg/L.')
  })

  it('invites the first reading when none is saved yet', async () => {
    repositories.waterQuality.listWaterParameterLogs!.mockResolvedValue(page([]))
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('No readings saved yet')
    expect(button(wrapper, 'Log a reading').attributes('disabled')).toBeUndefined()
  })

  it('keeps a harvested cultivation’s history readable but takes no new reading', async () => {
    repositories.cultivations.getCultivation!.mockResolvedValue(
      envelope({ ...batch001Detail, status: 'COMPLETED' }),
    )
    const { wrapper } = await open()

    expect(button(wrapper, 'Log a reading').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('This cultivation is closed')
    expect(wrapper.findAll('.water-history__log')).toHaveLength(3)
  })

  it('sends a farmer the API refuses to the plans rather than offering a retry', async () => {
    const refusal = apiError(403, 'FORBIDDEN', 'This needs the Pro plan.')
    Object.assign(refusal, { details: { requiredTier: 'PRO', currentTier: 'FREE' } })
    repositories.waterQuality.listWaterParameterLogs!.mockRejectedValue(refusal)
    const { wrapper } = await open()

    expect(wrapper.text()).toContain('Saved water readings are part of Pro')
    expect(wrapper.get('a[href="/app/plans?required=PRO"]').text()).toBe('See plans')
    expect(wrapper.text()).not.toContain('Try Again')
  })
})
