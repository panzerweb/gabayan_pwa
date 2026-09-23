import { z } from 'zod'

import { apiRequest } from './http'
import { mediaAssetSchema, pageSchema, sourceStatusSchema } from './schemas'

export const speciesSummarySchema = z.object({
  id: z.string().min(1),
  commonName: z.string().min(1),
  localName: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  beginnerFriendly: z.boolean(),
  image: mediaAssetSchema,
  estimatedCultureDays: z.object({
    minimum: z.number().int().positive(),
    maximum: z.number().int().positive(),
  }),
  active: z.boolean(),
  sourceStatus: sourceStatusSchema,
})

const speciesPageSchema = pageSchema(speciesSummarySchema)

export type SpeciesSummary = z.infer<typeof speciesSummarySchema>

export interface ListSpeciesParams {
  active?: boolean
  cursor?: string
  limit?: number
}

export function listSpecies(params: ListSpeciesParams = {}) {
  const query = new URLSearchParams()
  if (params.active !== undefined) query.set('active', String(params.active))
  if (params.cursor) query.set('cursor', params.cursor)
  if (params.limit !== undefined) query.set('limit', String(params.limit))

  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  return apiRequest(`/species${suffix}`, {
    method: 'GET',
    schema: speciesPageSchema,
  })
}
