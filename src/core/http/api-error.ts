export interface ApiErrorPayload {
  error: {
    code: string
    message: string
    fields: Record<string, string[]> | null
    details: unknown
    requestId: string
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string[]> | null
  readonly details: unknown
  readonly requestId: string

  constructor(status: number, payload: ApiErrorPayload['error']) {
    super(payload.message)
    this.name = 'ApiError'
    this.status = status
    this.code = payload.code
    this.fields = payload.fields
    this.details = payload.details
    this.requestId = payload.requestId
  }
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const error = value.error
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string' &&
    'requestId' in error &&
    typeof error.requestId === 'string'
  )
}
