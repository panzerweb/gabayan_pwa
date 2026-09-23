import { z } from 'zod'

const apiBaseUrlSchema = z
  .string()
  .url()
  .transform((value) => value.replace(/\/+$/, ''))

export const apiBaseUrl = apiBaseUrlSchema.parse(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1',
)

const requestTimeoutSchema = z.coerce.number().int().min(1_000).max(60_000)

export const apiRequestTimeoutMs = requestTimeoutSchema.parse(
  import.meta.env.VITE_API_TIMEOUT_MS ?? 8_000,
)
