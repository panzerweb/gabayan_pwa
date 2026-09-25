import { z } from 'zod'

// `GET /health`: whether the API is up, and which build answered.
export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.string().min(1),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
})

export type Health = z.infer<typeof healthSchema>
