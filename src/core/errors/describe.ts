import { ApiError } from '@core/http'

export const DEFAULT_ERROR_SENTENCE = 'Something went wrong. Please try again.'

export const OFFLINE_SENTENCE = 'You are offline. Check your connection, then try again.'

export const UNREACHABLE_SENTENCE =
  'We could not reach Gabayan. Check your connection, then try again.'

// Raised by apiRequest when a failure carries no contract error envelope.
const UNREADABLE_FAILURE_CODE = 'INVALID_ERROR_RESPONSE'

// Field messages show beside their inputs, so the summary only points at them.
const FIELD_ERRORS_SENTENCE = 'Some details need a second look. Check the highlighted fields.'

// Codes whose server message is generic or technical get a fixed sentence. Every other
// code carries a message written for the farmer ("This fish cannot be raised in a cage."),
// so that message is shown as it stands.
const SENTENCES_BY_CODE: Record<string, string> = {
  AUTH_REQUIRED: 'Your session has ended. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has ended. Please sign in again.',
  RATE_LIMITED: 'Too many attempts in a short time. Please wait a minute, then try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again in a moment.',
  CALCULATION_ERROR: 'We could not work out this estimate. Please try again in a moment.',
  SERVICE_UNAVAILABLE: 'Gabayan is busy right now. Please try again in a few minutes.',
}

function hasFieldErrors(error: ApiError) {
  return Object.keys(error.fields ?? {}).length > 0
}

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

// `fetch` rejects with a TypeError when the request never reaches the server.
function isNetworkFailure(error: unknown) {
  return error instanceof TypeError
}

// Turns a failed request into the one sentence a farmer reads in a toast or form message.
// `fallback` names the action that failed ("We couldn't save this growth record.") and is
// used when the failure says nothing more specific.
export function describeError(error: unknown, fallback: string = DEFAULT_ERROR_SENTENCE): string {
  if (error instanceof ApiError) {
    if (error.code === UNREADABLE_FAILURE_CODE) return fallback
    if (error.code === 'VALIDATION_ERROR' && hasFieldErrors(error)) return FIELD_ERRORS_SENTENCE
    const sentence = SENTENCES_BY_CODE[error.code]
    if (sentence) return sentence
    return error.message.trim() || fallback
  }
  if (isOffline()) return OFFLINE_SENTENCE
  if (isNetworkFailure(error)) return UNREACHABLE_SENTENCE
  return fallback
}
