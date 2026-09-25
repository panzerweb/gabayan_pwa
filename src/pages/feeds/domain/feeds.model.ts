import { z } from 'zod'

import { ruleSourceSchema, sourceStatusSchema } from '@core/http'
import { formatQuantity } from '@core/utils/format'
import { productSummarySchema } from '@pages/marketplace/domain/marketplace.model'

const gramsSchema = z.object({ value: z.number().finite().nonnegative(), unit: z.literal('G') })

const numberRangeSchema = z.object({
  minimum: z.number().finite(),
  maximum: z.number().finite(),
})

export const feedGuideStageSchema = z.object({
  growthStageCode: z.string().min(1),
  growthStage: z.string().min(1),
  weightRange: z.object({ minimum: gramsSchema, maximum: gramsSchema.nullable() }),
  feedType: z.string().min(1),
  proteinPercent: numberRangeSchema,
  pelletSize: numberRangeSchema.extend({ unit: z.literal('MM') }),
  feedingsPerDay: z.number().int().positive().nullable(),
  basis: z.string().min(1),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  products: z.array(productSummarySchema),
})

export const feedGuideSchema = z.object({
  species: z.object({
    id: z.string().min(1),
    commonName: z.string().min(1),
    localName: z.string().min(1),
  }),
  stages: z.array(feedGuideStageSchema).min(1),
  sources: z.array(ruleSourceSchema),
  isDemo: z.boolean(),
  sourceStatus: sourceStatusSchema,
  ruleVersion: z.string().min(1),
  disclaimer: z.string().min(1),
})

export type FeedGuideStage = z.infer<typeof feedGuideStageSchema>
export type FeedGuide = z.infer<typeof feedGuideSchema>
export type FeedSource = z.infer<typeof ruleSourceSchema>

// The guide's stage for a cultivation's current growth stage, or null when the guide has no
// row for it (a cultivation still in planning, or a stage the profile has since dropped).
export function feedStageFor(guide: FeedGuide, growthStageCode: string): FeedGuideStage | null {
  return guide.stages.find((stage) => stage.growthStageCode === growthStageCode) ?? null
}

// "28–32%", or "30%" when both ends agree.
export function formatProteinRange(range: FeedGuideStage['proteinPercent']): string {
  if (range.minimum === range.maximum) return formatQuantity(range.minimum, 'PERCENT')
  return `${formatQuantity(range.minimum, 'COUNT')}–${formatQuantity(range.maximum, 'PERCENT')}`
}

// "2–4 mm", or "2 mm" when both ends agree.
export function formatPelletSize(size: FeedGuideStage['pelletSize']): string {
  if (size.minimum === size.maximum) return formatQuantity(size.minimum, size.unit)
  return `${formatQuantity(size.minimum, 'COUNT')}–${formatQuantity(size.maximum, size.unit)}`
}

// The average-weight band the stage applies to: "Up to 300 g", "From 300 g", "100–300 g".
export function formatStageWeight(range: FeedGuideStage['weightRange']): string {
  const { minimum, maximum } = range
  if (maximum === null) return `From ${formatQuantity(minimum.value, minimum.unit)}`
  if (minimum.value === 0) return `Up to ${formatQuantity(maximum.value, maximum.unit)}`
  return `${formatQuantity(minimum.value, 'COUNT')}–${formatQuantity(maximum.value, maximum.unit)}`
}

// "2 feedings a day", or null when the profile has no feeding rule for the stage.
export function formatFeedingsPerDay(feedingsPerDay: number | null): string | null {
  if (feedingsPerDay === null) return null
  return `${feedingsPerDay} ${feedingsPerDay === 1 ? 'feeding' : 'feedings'} a day`
}
