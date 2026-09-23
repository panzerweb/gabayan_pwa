import type { z } from 'zod'

export function zodFieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}
