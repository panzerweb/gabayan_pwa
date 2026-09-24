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
  canRecordHarvest,
  feedingPlanSchema,
  feedingRecordSchema,
  growthFormErrors,
  growthMeasurementRequest,
  harvestCompletionSchema,
  harvestFormErrors,
  harvestReadinessSchema,
  harvestRequest,
  mortalityFormErrors,
  mortalityReasonLabel,
  mortalityRequest,
  parsePositiveNumber,
  parseWholeNumber,
  pesosToCentavos,
  readinessStatusWords,
  recordsTabFrom,
  waterCheckDisplay,
  waterCheckFormErrors,
  waterCheckRequest,
  waterCheckSchema,
} from '@pages/cultivations/domain/cultivations.model'

import {
  afternoonFeeding,
  batch001,
  batch001Detail,
  calmWaterCheck,
  feedingPlan,
  harvestCompletion,
  harvestedBatch,
  readyReadiness,
  waterCheck,
} from './fixtures'

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

describe('cultivation records model', () => {
  const growthForm = {
    measuredOn: '2026-09-23',
    numberOfFishSampled: '12',
    averageWeight: '200',
    notes: '  Representative net sample. ',
  }

  const harvestForm = {
    harvestDate: '2026-09-23',
    numberHarvested: '470',
    totalHarvestWeight: '169.2',
    averageFishWeight: '360',
    sellingPricePerKg: '120.5',
    notes: '',
  }

  it('keys every record query under the prefix its invalidation row names', () => {
    const under = (key: readonly unknown[], prefix: readonly string[]) =>
      prefix.every((part, index) => key[index] === part)

    expect(under(cultivationsKeys.growth('cul_1'), QUERY_KEY_PREFIXES.growth)).toBe(true)
    expect(under(cultivationsKeys.mortality('cul_1'), QUERY_KEY_PREFIXES.mortality)).toBe(true)
    expect(
      under(cultivationsKeys.feedingPlan('cul_1', '2026-09-23'), QUERY_KEY_PREFIXES.feedingPlan),
    ).toBe(true)
    expect(under(cultivationsKeys.feedingRecords('cul_1'), QUERY_KEY_PREFIXES.feedingRecords)).toBe(
      true,
    )
    expect(under(cultivationsKeys.waterChecks('cul_1'), QUERY_KEY_PREFIXES.waterChecks)).toBe(true)
    expect(
      under(cultivationsKeys.harvestReadiness('cul_1'), QUERY_KEY_PREFIXES.harvestReadiness),
    ).toBe(true)
  })

  it('reads a feeding recorded without a task as having no task', () => {
    const record = {
      id: 'feed_1',
      cultivationId: 'cul_1',
      taskId: null,
      fedAt: '2026-09-23T00:30:00Z',
      amount: { value: 800, unit: 'G' },
      notes: null,
      recordedBy: { id: 'usr_1', fullName: 'Juan Dela Cruz' },
      createdAt: '2026-09-23T00:31:00Z',
    }

    expect(feedingRecordSchema.parse(record).taskId).toBeNull()
  })

  it('parses the records and harvest payloads the mock returns', () => {
    expect(feedingPlanSchema.parse(feedingPlan).feedings).toHaveLength(2)
    expect(harvestReadinessSchema.parse(readyReadiness).basis).toHaveLength(3)
    expect(waterCheckSchema.parse(calmWaterCheck).guidance[0]?.severity).toBe('INFO')
    expect(harvestCompletionSchema.parse(harvestCompletion).summary.survivalRatePercent).toBe(94)
  })

  it('refuses blank, zero and fractional counts instead of reading them as 0', () => {
    expect(parseWholeNumber('12')).toBe(12)
    for (const input of ['', '  ', '0', '2.5', '-3', 'ten']) {
      expect(parseWholeNumber(input)).toBeNull()
    }
    expect(parsePositiveNumber('0.5')).toBe(0.5)
    expect(parsePositiveNumber('')).toBeNull()
    expect(parsePositiveNumber('0')).toBeNull()
  })

  it('turns a typed peso price into centavos without floating-point drift', () => {
    expect(pesosToCentavos('120')).toBe(12000)
    expect(pesosToCentavos('120.5')).toBe(12050)
    expect(pesosToCentavos('0.29')).toBe(29)
    expect(pesosToCentavos('1.005')).toBeNull()
    expect(pesosToCentavos('')).toBeNull()
    expect(pesosToCentavos('-1')).toBeNull()
  })

  it('checks the growth form and builds its request in grams', () => {
    expect(growthFormErrors(growthForm)).toEqual({})
    expect(
      growthFormErrors({ ...growthForm, numberOfFishSampled: '', averageWeight: '0' }),
    ).toEqual({
      numberOfFishSampled: 'Enter a whole-number sample size greater than 0.',
      averageWeight: 'Enter an average weight greater than 0.',
    })
    expect(growthMeasurementRequest(growthForm)).toEqual({
      measuredOn: '2026-09-23',
      numberOfFishSampled: 12,
      averageWeight: { value: 200, unit: 'G' },
      notes: 'Representative net sample.',
    })
  })

  it('checks the mortality form and words each reason plainly', () => {
    const form = { occurredOn: '2026-09-23', fishCount: '5', reason: 'UNKNOWN' as const, notes: '' }
    expect(mortalityFormErrors(form)).toEqual({})
    expect(mortalityFormErrors({ ...form, fishCount: '1.5' })).toEqual({
      fishCount: 'Enter a whole number greater than 0.',
    })
    expect(mortalityRequest(form)).toEqual({
      occurredOn: '2026-09-23',
      fishCount: 5,
      reason: 'UNKNOWN',
      notes: null,
    })
    expect(mortalityReasonLabel('WATER_QUALITY')).toBe('Water quality')
  })

  it('asks for every qualitative water observation and dates the check in Manila', () => {
    const form = {
      checkedOn: '2026-09-23',
      clarity: 'Cloudier than usual',
      odor: 'Normal',
      fishBehavior: ' Slower near one corner ',
      unusualChanges: true,
      actionTaken: '',
      notes: '',
    }
    expect(waterCheckFormErrors({ ...form, clarity: ' ', odor: '', fishBehavior: '' })).toEqual({
      clarity: 'Describe how clear the water looks.',
      odor: 'Describe how the water smells.',
      fishBehavior: 'Describe how the fish are behaving.',
    })
    expect(waterCheckRequest(form)).toEqual({
      checkedAt: '2026-09-23T00:00:00.000Z',
      observation: {
        clarity: 'Cloudier than usual',
        odor: 'Normal',
        fishBehavior: 'Slower near one corner',
        unusualChanges: true,
      },
      actionTaken: null,
      notes: null,
    })
    expect(waterCheckDisplay({ unusualChanges: true })).toMatchObject({ label: 'Change noted' })
  })

  it('reads the records tab from the route query, falling back to feeding', () => {
    expect(recordsTabFrom('water')).toBe('water')
    expect(recordsTabFrom('plan')).toBe('plan')
    expect(recordsTabFrom('harvest')).toBe('feeding')
    expect(recordsTabFrom(undefined)).toBe('feeding')
  })

  it('opens the harvest form only on the server’s ready estimates', () => {
    expect(canRecordHarvest('POTENTIALLY_READY')).toBe(true)
    expect(canRecordHarvest('READY_SOON')).toBe(true)
    for (const status of ['NOT_READY', 'MONITOR', 'INSUFFICIENT_DATA'] as const) {
      expect(canRecordHarvest(status)).toBe(false)
    }
    expect(readinessStatusWords('POTENTIALLY_READY')).toBe('POTENTIALLY READY')
  })

  it('checks the harvest form and sends the price in centavos', () => {
    expect(harvestFormErrors(harvestForm)).toEqual({})
    expect(
      harvestFormErrors({ ...harvestForm, numberHarvested: '0', sellingPricePerKg: '12.345' }),
    ).toEqual({
      numberHarvested: 'Enter the number of fish harvested as a whole number.',
      sellingPricePerKg: 'Enter the selling price per kg in pesos, like 120 or 120.50.',
    })
    expect(harvestRequest(harvestForm)).toEqual({
      harvestDate: '2026-09-23',
      numberHarvested: 470,
      totalHarvestWeight: { value: 169.2, unit: 'KG' },
      averageFishWeight: { value: 360, unit: 'G' },
      sellingPricePerKg: { amountMinor: 12050, currency: 'PHP' },
      notes: null,
    })
  })
})
