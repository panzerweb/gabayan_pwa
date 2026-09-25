import { describeError, OFFLINE_SENTENCE, UNREACHABLE_SENTENCE } from '@core/errors'
import { ApiError } from '@core/http'

function apiError(
  status: number,
  code: string,
  message: string,
  fields: Record<string, string[]> | null = null,
) {
  return new ApiError(status, { code, message, fields, details: null, requestId: 'req_test' })
}

describe('describeError', () => {
  it('asks the farmer to sign in again when the session has ended', () => {
    const error = apiError(401, 'AUTH_REQUIRED', 'Authentication is required.')

    expect(describeError(error)).toBe('Your session has ended. Please sign in again.')
  })

  it('points at the highlighted fields when a validation error names them', () => {
    const error = apiError(422, 'VALIDATION_ERROR', 'Enter dimensions greater than zero.', {
      waterDepthM: ['Must be greater than 0.'],
    })

    expect(describeError(error)).toBe(
      'Some details need a second look. Check the highlighted fields.',
    )
  })

  it('shows the server sentence when a validation error names no field', () => {
    const error = apiError(422, 'VALIDATION_ERROR', 'Enter dimensions greater than zero.')

    expect(describeError(error)).toBe('Enter dimensions greater than zero.')
  })

  it('asks the farmer to wait when requests are rate limited', () => {
    const error = apiError(429, 'RATE_LIMITED', 'Rate limit exceeded.')

    expect(describeError(error)).toBe(
      'Too many attempts in a short time. Please wait a minute, then try again.',
    )
  })

  it('says the device is offline when a request fails without a connection', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    expect(describeError(new TypeError('Failed to fetch'), 'We couldn’t save this record.')).toBe(
      OFFLINE_SENTENCE,
    )
  })

  it('says the server could not be reached when online but the request never arrived', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    expect(describeError(new TypeError('Failed to fetch'))).toBe(UNREACHABLE_SENTENCE)
  })

  it('shows the farmer-facing message of any other contract code', () => {
    const error = apiError(409, 'INVALID_STATE_TRANSITION', 'This order has already shipped.')

    expect(describeError(error)).toBe('This order has already shipped.')
  })

  it('uses the named action when the failure says nothing more specific', () => {
    const unreadable = apiError(502, 'INVALID_ERROR_RESPONSE', 'We could not complete this.')

    expect(describeError(unreadable, 'We couldn’t place this order.')).toBe(
      'We couldn’t place this order.',
    )
    expect(describeError(new Error('boom'), 'We couldn’t place this order.')).toBe(
      'We couldn’t place this order.',
    )
  })
})
