import { QUERY_KEY_PREFIXES } from '@core/query'
import { cultivationsKeys } from '@pages/cultivations/data/cultivations.keys'
import {
  canRecordFeeding,
  cultivationDetailSchema,
  cultivationSectionFrom,
  cultivationStatusDisplay,
  cultivationViewFrom,
  feedingAmountError,
  feedingCompletionRequest,
  filterCultivations,
  harvestReadinessDisplay,
  taskIcon,
  taskStatusTone,
  timelineEventDate,
  timelineEventDisplay,
} from '@pages/cultivations/domain/cultivations.model'

import { afternoonFeeding, batch001, batch001Detail, harvestedBatch, waterCheck } from './fixtures'

describe('cultivations model', () => {
  it('parses the seeded cultivation detail, stocking snapshot included', () => {
    const parsed = cultivationDetailSchema.parse(batch001Detail)

    expect(parsed.stockingEstimateSnapshot.isDemo).toBe(true)
    expect(parsed.feedingSummary?.dailyFeed).toEqual({ value: 2.4, unit: 'KG' })
  })

  it('reads the list tab from the route query, falling back to all', () => {
    expect(cultivationViewFrom('active')).toBe('active')
    expect(cultivationViewFrom('completed')).toBe('completed')
    expect(cultivationViewFrom('archived')).toBe('all')
    expect(cultivationViewFrom(undefined)).toBe('all')
  })

  it('keeps completed and cancelled cultivations out of the active tab', () => {
    const cancelled = { ...batch001, id: 'cul_cancelled', status: 'CANCELLED' as const }
    const all = [batch001, harvestedBatch, cancelled]

    expect(filterCultivations(all, 'all')).toHaveLength(3)
    expect(filterCultivations(all, 'active').map(({ id }) => id)).toEqual(['cul_tilapia_001'])
    expect(filterCultivations(all, 'completed').map(({ id }) => id)).toEqual(['cul_tilapia_000'])
  })

  it('reads the detail section from the route query, falling back to the overview', () => {
    expect(cultivationSectionFrom('timeline')).toBe('timeline')
    expect(cultivationSectionFrom('tasks')).toBe('overview')
  })

  it('words every status with a label and an icon, not colour alone', () => {
    expect(cultivationStatusDisplay('PRE_HARVEST')).toEqual({
      label: 'Nearing harvest',
      tone: 'warning',
      icon: 'star',
    })
    expect(harvestReadinessDisplay('INSUFFICIENT_DATA').label).toBe('Needs a recent growth sample')
    expect(timelineEventDisplay('CURRENT')).toEqual({ label: 'Now', tone: 'info', icon: 'fish' })
  })

  it('dates a timeline event by when it happened, else when it is estimated', () => {
    expect(timelineEventDate({ occurredOn: '2026-08-07', estimatedOn: null })).toEqual({
      date: '2026-08-07',
      estimated: false,
    })
    expect(timelineEventDate({ occurredOn: null, estimatedOn: '2027-01-04' })).toEqual({
      date: '2027-01-04',
      estimated: true,
    })
    expect(timelineEventDate({ occurredOn: null, estimatedOn: null })).toBeNull()
  })

  it('offers feeding completion only on an open feeding task', () => {
    expect(canRecordFeeding(afternoonFeeding)).toBe(true)
    expect(canRecordFeeding({ ...afternoonFeeding, status: 'COMPLETED' })).toBe(false)
    expect(canRecordFeeding(waterCheck)).toBe(false)
    expect(taskIcon(waterCheck)).toBe('droplet')
    expect(taskStatusTone('MISSED')).toBe('danger')
  })

  it('refuses a blank, zero or unreadable feeding amount instead of sending zero', () => {
    expect(feedingAmountError('')).toBe('Enter an amount greater than 0.')
    expect(feedingAmountError('0')).toBe('Enter an amount greater than 0.')
    expect(feedingAmountError('abc')).toBe('Enter an amount greater than 0.')
    expect(feedingAmountError('1.2')).toBeNull()
  })

  it('builds the completion body with a unit and no empty notes', () => {
    expect(feedingCompletionRequest(1.1, 'KG', '  ', '2026-09-23T08:05:00Z')).toEqual({
      completedAt: '2026-09-23T08:05:00Z',
      actualAmount: { value: 1.1, unit: 'KG' },
      notes: null,
    })
  })

  it('keys every cultivation query under the prefix its invalidation row names', () => {
    const under = (key: readonly unknown[], prefix: readonly string[]) =>
      prefix.every((part, index) => key[index] === part)

    expect(under(cultivationsKeys.list(), QUERY_KEY_PREFIXES.cultivationList)).toBe(true)
    expect(under(cultivationsKeys.detail('cul_1'), QUERY_KEY_PREFIXES.cultivationDetail)).toBe(true)
    expect(under(cultivationsKeys.timeline('cul_1'), QUERY_KEY_PREFIXES.cultivationTimeline)).toBe(
      true,
    )
    expect(under(cultivationsKeys.taskList('cul_1'), QUERY_KEY_PREFIXES.tasks)).toBe(true)
  })
})
