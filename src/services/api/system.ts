import { z } from 'zod'

import { apiRequest } from './http'
import { envelopeSchema } from './schemas'

const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
})

const healthEnvelopeSchema = envelopeSchema(healthSchema)

export type Health = z.infer<typeof healthSchema>

export function getHealth() {
  return apiRequest('/health', {
    method: 'GET',
    schema: healthEnvelopeSchema,
  })
}
