import {
  emptyReadingsForm,
  formatThresholdRange,
  parseReadingsForm,
  readingStatusPresentation,
  waterSafetyCheckSchema,
  waterThresholdSetSchema,
} from '@pages/water-quality/domain/water-quality.model'

import { highAmmoniaCheck, lowOxygenCheck, tilapiaPondThresholds } from './fixtures'

describe('water-quality model', () => {
  it('parses a threshold set and a safety check as the contract describes them', () => {
    expect(waterThresholdSetSchema.parse(tilapiaPondThresholds).thresholds).toHaveLength(7)
    expect(waterSafetyCheckSchema.parse(highAmmoniaCheck).results[1]?.status).toBe('ABOVE_RANGE')
  })

  it('rejects a threshold with a parameter the contract does not name', () => {
    const unknown = {
      ...tilapiaPondThresholds,
      thresholds: [{ ...tilapiaPondThresholds.thresholds[0], parameter: 'TURBIDITY' }],
    }

    expect(waterThresholdSetSchema.safeParse(unknown).success).toBe(false)
  })

  it('writes a range with its unit, whichever bounds it has', () => {
    expect(formatThresholdRange({ minimum: 6.5, maximum: 8.5, unit: 'PH' })).toBe('6.5–8.5 pH')
    expect(formatThresholdRange({ minimum: null, maximum: 0.5, unit: 'MG_PER_L' })).toBe(
      'Up to 0.5 mg/L',
    )
    expect(formatThresholdRange({ minimum: 3, maximum: null, unit: 'MG_PER_L' })).toBe(
      'At least 3 mg/L',
    )
    expect(formatThresholdRange({ minimum: 25, maximum: 32, unit: 'CELSIUS' })).toBe('25–32 °C')
    expect(formatThresholdRange({ minimum: null, maximum: 15, unit: 'PPT' })).toBe('Up to 15 ppt')
  })

  it('gives every reading status a label and an icon, not only a colour', () => {
    expect(readingStatusPresentation('WITHIN_RANGE')).toEqual({
      label: 'Within range',
      tone: 'success',
      icon: 'check',
    })
    expect(readingStatusPresentation('ABOVE_RANGE').label).toBe('Above range')
    expect(readingStatusPresentation('BELOW_RANGE').icon).toBe('warning')
  })

  it('sends only the readings entered, under their contract field names', () => {
    const form = { ...emptyReadingsForm(), AMMONIA: ' 1.2 ', PH: '7' }

    expect(parseReadingsForm(form)).toEqual({
      readings: { ph: 7, ammoniaMgL: 1.2 },
      fieldErrors: {},
    })
  })

  it('asks for at least one reading when every field is blank', () => {
    expect(parseReadingsForm(emptyReadingsForm())).toEqual({
      readings: {},
      fieldErrors: { readings: 'Enter at least one reading to check.' },
    })
  })

  it('refuses a reading that is not a number or is outside what can be measured', () => {
    const form = { ...emptyReadingsForm(), PH: '15', AMMONIA: 'high', NITRATE: '-1' }

    expect(parseReadingsForm(form).fieldErrors).toEqual({
      'readings.ph': 'Enter a number from 0 to 14.',
      'readings.ammoniaMgL': 'Enter a number from 0 to 50.',
      'readings.nitrateMgL': 'Enter a number from 0 to 1000.',
    })
  })

  it('parses the products named for an out-of-range reading with their suggested quantity', () => {
    const [oxygen] = waterSafetyCheckSchema.parse(lowOxygenCheck).results
    expect(oxygen?.recommendedProducts?.[0]).toMatchObject({
      sku: 'GBY-AER-001',
      suggestedQuantity: 1,
      whyRelevant: expect.stringContaining('adds oxygen'),
    })
  })

  it('refuses a recommended product without a quantity to preset', () => {
    const [oxygen] = lowOxygenCheck.results
    const product = { ...oxygen!.recommendedProducts![0]!, suggestedQuantity: 0 }
    const broken = { ...lowOxygenCheck, results: [{ ...oxygen, recommendedProducts: [product] }] }
    expect(waterSafetyCheckSchema.safeParse(broken).success).toBe(false)
  })
})
