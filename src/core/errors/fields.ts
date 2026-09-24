import { ApiError } from '@core/http'

// The first message of each field an `ApiError` rejected, keyed by the contract's camelCase
// field name so a form can bind it to the matching input. Empty for any other failure.
export function apiFieldErrors(error: unknown): Record<string, string> {
  const fields: Record<string, string> = {}
  if (!(error instanceof ApiError)) return fields
  for (const [field, messages] of Object.entries(error.fields ?? {})) {
    if (messages[0]) fields[field] = messages[0]
  }
  return fields
}
