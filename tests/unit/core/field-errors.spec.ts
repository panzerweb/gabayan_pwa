import { apiFieldErrors } from '@core/errors'
import { ApiError } from '@core/http'

describe('apiFieldErrors', () => {
  it('keeps the first message of each rejected field under its contract name', () => {
    const error = new ApiError(422, {
      code: 'VALIDATION_ERROR',
      message: 'Review the new password.',
      fields: { password: ['Use at least 8 characters.', 'Add a number.'], confirmPassword: [] },
      details: null,
      requestId: 'req_1',
    })

    expect(apiFieldErrors(error)).toEqual({ password: 'Use at least 8 characters.' })
  })

  it('is empty for a failure that is not an API error', () => {
    expect(apiFieldErrors(new TypeError('Failed to fetch'))).toEqual({})
  })
})
