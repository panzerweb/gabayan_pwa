import { z } from 'zod'

const apiBaseUrlSchema = z
  .string()
  .url()
  .transform((value) => value.replace(/\/+$/, ''))

export const apiBaseUrl = apiBaseUrlSchema.parse(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1',
)
