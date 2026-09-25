import {
  feedGuideSchema,
  feedStageFor,
  formatFeedingsPerDay,
  formatPelletSize,
  formatProteinRange,
  formatStageWeight,
} from '@pages/feeds/domain/feeds.model'

import { growingStage, preHarvestStage, tilapiaFeedGuide } from './fixtures'

describe('feeds model', () => {
  it('parses a feed guide with its linked products and provenance', () => {
    const parsed = feedGuideSchema.parse(tilapiaFeedGuide)

    expect(parsed.stages[0]?.products[0]?.sku).toBe('GBY-FED-020')
    expect(parsed.isDemo).toBe(true)
  })

  it('rejects a guide with no stages or a pellet size without its unit', () => {
    expect(feedGuideSchema.safeParse({ ...tilapiaFeedGuide, stages: [] }).success).toBe(false)
    const unitless = { ...growingStage, pelletSize: { minimum: 2, maximum: 4 } }
    expect(feedGuideSchema.safeParse({ ...tilapiaFeedGuide, stages: [unitless] }).success).toBe(
      false,
    )
  })

  it('finds the stage matching a cultivation’s growth stage, and none for planning', () => {
    expect(feedStageFor(tilapiaFeedGuide, 'PRE_HARVEST')).toBe(preHarvestStage)
    expect(feedStageFor(tilapiaFeedGuide, 'PLANNING')).toBeNull()
  })

  it('formats protein and pellet ranges with their units, collapsing equal ends', () => {
    expect(formatProteinRange(growingStage.proteinPercent)).toBe('28–32%')
    expect(formatProteinRange({ minimum: 30, maximum: 30 })).toBe('30%')
    expect(formatPelletSize(growingStage.pelletSize)).toBe('2–4 mm')
    expect(formatPelletSize({ minimum: 1.5, maximum: 1.5, unit: 'MM' })).toBe('1.5 mm')
  })

  it('describes the weight band and feedings a day in plain words', () => {
    expect(formatStageWeight(growingStage.weightRange)).toBe('Up to 300 g')
    expect(formatStageWeight(preHarvestStage.weightRange)).toBe('From 300 g')
    expect(
      formatStageWeight({ minimum: { value: 100, unit: 'G' }, maximum: { value: 300, unit: 'G' } }),
    ).toBe('100–300 g')
    expect(formatFeedingsPerDay(2)).toBe('2 feedings a day')
    expect(formatFeedingsPerDay(1)).toBe('1 feeding a day')
    expect(formatFeedingsPerDay(null)).toBeNull()
  })
})
