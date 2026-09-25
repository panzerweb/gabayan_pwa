import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

import type { WaterQualityRepository } from '@pages/water-quality/domain/water-quality.repository.interface'
import { useSaveWaterLog } from '@pages/water-quality/presentation/composables/useSaveWaterLog'
import { useWaterLogs } from '@pages/water-quality/presentation/composables/useWaterLogs'
import { ROUTE_NAMES } from '@router/route-names'

import { envelope, page } from '../../unit/marketplace/fixtures'
import { seededLogs } from '../../unit/water-quality/log-fixtures'
import { apiError, goOffline, mountComposable } from '../support/app'

const at = { name: ROUTE_NAMES.cultivationDetail, params: { cultivationId: 'cul_tilapia_001' } }

async function mountSave(createWaterParameterLog: ReturnType<typeof vi.fn>) {
  const mounted = await mountComposable(
    () =>
      useSaveWaterLog(ref('cul_tilapia_001'), {
        createWaterParameterLog,
      } as unknown as WaterQualityRepository),
    at,
  )
  mounted.result.begin()
  return mounted
}

function keysSent(create: ReturnType<typeof vi.fn>) {
  return create.mock.calls.map((call) => call[2] as string)
}

describe('useSaveWaterLog', () => {
  it('saves the entered readings and notes, then refreshes the history', async () => {
    const create = vi.fn().mockResolvedValue(envelope(seededLogs[0]))
    const { result, queryClient, toast } = await mountSave(create)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    result.form.PH = '7.6'
    result.form.DISSOLVED_OXYGEN = '2.6'
    result.notes.value = ' Fish gulping at dawn. '

    expect(await result.submit()).toBe(true)

    expect(create).toHaveBeenCalledWith(
      'cul_tilapia_001',
      { readings: { ph: 7.6, dissolvedOxygenMgL: 2.6 }, notes: 'Fish gulping at dawn.' },
      expect.any(String),
      'access_1',
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['water-quality', 'logs'] })
    expect(toast.messages.at(-1)?.message).toBe('Water reading saved.')
  })

  it('reuses one Idempotency-Key on a retry and makes a new one for the next reading', async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(envelope(seededLogs[0]))
    const { result } = await mountSave(create)
    result.form.PH = '7.6'

    expect(await result.submit()).toBe(false)
    expect(await result.submit()).toBe(true)
    result.begin()
    result.form.PH = '7.4'
    await result.submit()

    const [first, retry, next] = keysSent(create)
    expect(retry).toBe(first)
    expect(next).not.toBe(first)
  })

  it('keeps an empty form on screen without asking the server', async () => {
    const create = vi.fn()
    const { result } = await mountSave(create)

    expect(await result.submit()).toBe(false)

    expect(create).not.toHaveBeenCalled()
    expect(result.fieldErrors.value).toEqual({ readings: 'Enter at least one reading to save.' })
  })

  it('neither sends nor queues a reading while offline', async () => {
    goOffline()
    const create = vi.fn()
    const { result } = await mountSave(create)
    result.form.PH = '7.6'

    expect(await result.submit()).toBe(false)

    expect(create).not.toHaveBeenCalled()
    expect(result.formError.value).toContain('Nothing is saved or queued')
  })

  it('binds the server field messages to their readings', async () => {
    const create = vi.fn().mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Review the readings.', {
        'readings.ph': ['Enter a number from 0 to 14.'],
      }),
    )
    const { result } = await mountSave(create)
    result.form.PH = '7.6'

    expect(await result.submit()).toBe(false)

    expect(result.fieldErrors.value).toEqual({ 'readings.ph': 'Enter a number from 0 to 14.' })
  })
})

describe('useWaterLogs', () => {
  it('lists the saved logs newest first', async () => {
    const listWaterParameterLogs = vi.fn().mockResolvedValue(page(seededLogs))
    const { result } = await mountComposable(
      () =>
        useWaterLogs(ref('cul_tilapia_001'), {
          listWaterParameterLogs,
        } as unknown as WaterQualityRepository),
      at,
    )
    await flushPromises()

    expect(listWaterParameterLogs).toHaveBeenCalledWith('cul_tilapia_001', 'access_1')
    expect(result.logs.value.map((log) => log.id)[0]).toBe('wlog_tilapia_003')
    expect(result.requiredTier.value).toBeNull()
  })

  it('names the plan a refused history needs instead of offering a retry', async () => {
    const refusal = apiError(403, 'FORBIDDEN', 'This needs the Pro plan.')
    Object.assign(refusal, { details: { requiredTier: 'PRO', currentTier: 'FREE' } })
    const listWaterParameterLogs = vi.fn().mockRejectedValue(refusal)
    const { result } = await mountComposable(
      () =>
        useWaterLogs(ref('cul_tilapia_001'), {
          listWaterParameterLogs,
        } as unknown as WaterQualityRepository),
      at,
    )
    await flushPromises()

    expect(result.requiredTier.value).toBe('PRO')
    expect(result.loadFailed.value).toBe(false)
  })
})
