import { envelopeSchema } from '@core/http'
import { zodFieldErrors } from '@core/utils/validation'
import {
  authSessionSchema,
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

describe('session payload', () => {
  // The demo sign-in as FastAPI answers it: UUID ids, microsecond timestamps and a field
  // the PWA does not read.
  const fastApiSession = {
    data: {
      accessToken: 'header.payload.signature',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'f03dba9e-9eee-402d-b39f-cf48f992a694',
        fullName: 'Juan Dela Cruz',
        email: 'juan@example.com',
        mobileNumber: '+639171234567',
        avatar: null,
        emailVerified: true,
        mobileVerified: false,
        locale: 'en-PH',
        timezone: 'Asia/Manila',
        createdAt: '2026-08-06T00:00:00Z',
        updatedAt: '2026-09-24T07:44:38.454806Z',
        version: 2,
        lastSignInAt: '2026-09-24T07:44:38.454806Z',
      },
      onboarding: { hasCultivation: true, suggestedRoute: '/app/home' },
    },
    meta: { requestId: 'req_d8ce97c88b6447afa3733a141aa44139' },
  }
  const sessionEnvelope = envelopeSchema(authSessionSchema)

  it('accepts a field the contract does not name and keeps the ones it does', () => {
    const parsed = sessionEnvelope.parse(fastApiSession)

    expect(parsed.data.user.id).toBe('f03dba9e-9eee-402d-b39f-cf48f992a694')
    expect(parsed.data.user.updatedAt).toBe('2026-09-24T07:44:38.454806Z')
    expect(parsed.data.user).not.toHaveProperty('lastSignInAt')
  })

  it('fails loudly when a required field is missing', () => {
    const userWithoutEmail: Record<string, unknown> = { ...fastApiSession.data.user }
    delete userWithoutEmail.email
    const result = sessionEnvelope.safeParse({
      ...fastApiSession,
      data: { ...fastApiSession.data, user: userWithoutEmail },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['data.user.email'])
  })
})
