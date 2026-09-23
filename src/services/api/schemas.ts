import { z } from 'zod'

export const responseMetaSchema = z.object({
  requestId: z.string().min(1),
})

export const pageInfoSchema = z.object({
  cursor: z.string().nullable(),
  nextCursor: z.string().nullable(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export const mediaAssetSchema = z.object({
  url: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export const sourceStatusSchema = z.enum(['DEMO', 'DRAFT', 'VERIFIED', 'RETIRED'])

export function envelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: responseMetaSchema,
  })
}

export function pageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return envelopeSchema(z.array(itemSchema)).extend({
    page: pageInfoSchema,
  })
}
