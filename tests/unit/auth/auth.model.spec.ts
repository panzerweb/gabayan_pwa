import { zodFieldErrors } from '@core/utils/validation'
import {
  createAccountFormSchema,
  redirectPathFrom,
  resetPasswordFormSchema,
  signInFormSchema,
} from '@pages/auth/domain/auth.model'

describe('redirectPathFrom', () => {
  it('keeps an app path', () => {
    expect(redirectPathFrom('/app/cultivations/cul_001/tasks?tab=today')).toBe(
      '/app/cultivations/cul_001/tasks?tab=today',
    )
  })

  it.each([
    ['a missing value', undefined],
    ['a repeated query value', ['/app/home', '/app/orders']],
    ['a relative path', 'app/home'],
    ['another site', 'https://example.com/app/home'],
    ['a protocol-relative address', '//example.com'],
    ['a backslash trick', '/\\example.com'],
  ])('ignores %s', (_label, value) => {
    expect(redirectPathFrom(value)).toBeNull()
  })
})

describe('sign-in form', () => {
  it('asks for both the identifier and the password', () => {
    const result = signInFormSchema.safeParse({ identifier: '   ', password: '' })

    expect(result.success).toBe(false)
    expect(zodFieldErrors(result.error!)).toEqual({
      identifier: 'Enter your email or mobile number.',
      password: 'Enter your password.',
    })
  })
})

describe('create-account form', () => {
  it('points a mismatched confirmation at the confirmation field', () => {
    const result = createAccountFormSchema.safeParse({
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      mobileNumber: '09171234568',
      password: 'SafeDemo123!',
      confirmPassword: 'SafeDemo124!',
      acceptedTerms: true,
    })

    expect(zodFieldErrors(result.error!)).toEqual({ confirmPassword: 'Passwords must match.' })
  })
})

describe('reset-password form', () => {
  it('reports a short password and a mismatch together', () => {
    const result = resetPasswordFormSchema.safeParse({
      password: 'short',
      confirmPassword: 'other',
    })

    expect(zodFieldErrors(result.error!)).toEqual({
      password: 'Use at least 8 characters.',
      confirmPassword: 'Passwords must match.',
    })
  })
})
