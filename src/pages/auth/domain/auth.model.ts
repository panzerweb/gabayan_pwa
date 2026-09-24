import { z } from 'zod'

import { mediaAssetSchema } from '@core/http'

export const userProfileSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  email: z.email(),
  mobileNumber: z.string().min(1),
  avatar: mediaAssetSchema.nullable(),
  emailVerified: z.boolean(),
  mobileVerified: z.boolean(),
  locale: z.string().min(1),
  timezone: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  version: z.number().int().positive(),
})

export const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresInSeconds: z.number().int().positive(),
})

export const authSessionSchema = accessTokenSchema.extend({
  user: userProfileSchema,
  onboarding: z.object({
    hasCultivation: z.boolean(),
    suggestedRoute: z.string().startsWith('/'),
  }),
})

export const messageResultSchema = z.object({ message: z.string().min(1) })

export type UserProfile = z.infer<typeof userProfileSchema>
export type AccessToken = z.infer<typeof accessTokenSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type MessageResult = z.infer<typeof messageResultSchema>

export interface RegisterRequest {
  fullName: string
  email: string
  mobileNumber: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
  acceptedTermsVersion: string
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

// The version of the demo terms a new account accepts.
export const TERMS_VERSION = '2026-09'

// The token the mock API accepts for the demo Google sign-in; FastAPI refuses it.
export const DEMO_GOOGLE_ID_TOKEN = 'demo-google-token'

export const MINIMUM_PASSWORD_LENGTH = 8

export const signInFormSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or mobile number.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const createAccountFormSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter at least 2 characters.').max(100),
    email: z.string().trim().email('Enter a valid email address.'),
    mobileNumber: z.string().trim().min(1, 'Enter your mobile number.'),
    password: z.string().min(MINIMUM_PASSWORD_LENGTH, 'Use at least 8 characters.').max(128),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    acceptedTerms: z.literal(true, { error: 'Accept the terms to continue.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  })

export const forgotPasswordFormSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or mobile number.'),
})

// Both rules are checked together so a short, mismatched pair shows both messages at once.
export const resetPasswordFormSchema = z
  .object({ password: z.string(), confirmPassword: z.string() })
  .superRefine((data, context) => {
    if (data.password.length < MINIMUM_PASSWORD_LENGTH) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Use at least 8 characters.',
      })
    }
    if (data.password !== data.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords must match.',
      })
    }
  })

// The in-app path a signed-out visitor was sent away from, or null. Only an app-relative
// path is honoured, so a crafted `?redirect=//example.com` cannot lead off the site.
export function redirectPathFrom(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}
