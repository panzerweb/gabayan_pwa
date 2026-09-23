import { z } from 'zod'

import { apiRequest } from './http'
import { envelopeSchema, mediaAssetSchema } from './schemas'

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

const accessTokenSchema = z.object({
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

const messageResultSchema = z.object({ message: z.string().min(1) })

export type UserProfile = z.infer<typeof userProfileSchema>
export type AuthSession = z.infer<typeof authSessionSchema>

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

export function registerAccount(body: RegisterRequest) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body,
    schema: envelopeSchema(authSessionSchema),
  })
}

export function login(body: LoginRequest) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body,
    schema: envelopeSchema(authSessionSchema),
  })
}

export function loginWithGoogle(idToken: string) {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: { idToken },
    schema: envelopeSchema(authSessionSchema),
  })
}

export function forgotPassword(identifier: string) {
  return apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: { identifier },
    schema: envelopeSchema(messageResultSchema),
  })
}

export function resetPassword(token: string, password: string, confirmPassword: string) {
  return apiRequest('/auth/password/reset', {
    method: 'POST',
    body: { token, password, confirmPassword },
    schema: envelopeSchema(messageResultSchema),
  })
}

export function refreshAccessToken() {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    schema: envelopeSchema(accessTokenSchema),
  })
}

export function getCurrentUser(accessToken: string) {
  return apiRequest('/users/me', {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(userProfileSchema),
  })
}

export function logout(accessToken: string) {
  return apiRequest('/auth/logout', {
    method: 'POST',
    accessToken,
    schema: z.undefined(),
  })
}
