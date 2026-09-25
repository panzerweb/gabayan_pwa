import {
  HARVEST_DECISION_NOTE,
  harvestSampleLine,
  harvestWindowHint,
  notificationSchema,
  waterChangeLine,
} from '@pages/notifications/domain/notifications.model'

import { feedingDue } from './fixtures'
import { harvestAlert, harvestDetail, waterChangeDetail, waterChangeDue } from './reminder-fixtures'

const FULL_WATER_CHANGE = /\b(all|whole|entire)\b[^.]*\bwater\b|100 ?%|replace the water/i

describe('reminder notifications', () => {
  it('parses a water-change reminder with its percentage and provenance', () => {
    const parsed = notificationSchema.parse(waterChangeDue)

    expect(parsed.type).toBe('WATER_CHANGE_DUE')
    expect(parsed.reminder).toMatchObject({
      waterChangePercent: 30,
      isDemo: true,
      sourceStatus: 'DEMO',
    })
  })

  it('refuses a water-change percentage above the whole volume', () => {
    const result = notificationSchema.safeParse({
      ...waterChangeDue,
      reminder: { ...waterChangeDetail, waterChangePercent: 120 },
    })

    expect(result.success).toBe(false)
  })

  it('still reads a notification from a server that sends no reminder field', () => {
    expect(feedingDue).not.toHaveProperty('reminder')
    expect(notificationSchema.parse(feedingDue).reminder).toBeUndefined()
  })

  it('describes a water change as part of the water, never a full replacement', () => {
    const line = waterChangeLine(30)

    expect(line).toBe(
      'Change about 30% of the water, a little at a time, and keep the rest in place.',
    )
    expect(line).not.toMatch(FULL_WATER_CHANGE)
  })

  it('gives the culture-length window only as a rough guide', () => {
    expect(harvestWindowHint({ minimum: 120, maximum: 150 })).toBe(
      'Many growers harvest around 120–150 days after stocking. Use that only as a rough guide; the size of your fish decides.',
    )
  })

  it('states the sample against the demo target and leaves the decision to the grower', () => {
    expect(harvestSampleLine(harvestDetail)).toBe('Latest sample: 380 g. Demo target: 350–450 g.')
    expect(harvestSampleLine(waterChangeDetail)).toBeNull()
    expect(notificationSchema.parse(harvestAlert).reminder?.harvestWindowDays).toEqual({
      minimum: 120,
      maximum: 150,
    })
    expect(HARVEST_DECISION_NOTE).toMatch(/^You decide when the size is right/)
  })
})
