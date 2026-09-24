import { z } from 'zod'

import { apiRequest, envelopeSchema } from '@core/http'
import { ENDPOINTS } from '@core/url_paths'

import {
  accessTokenSchema,
  authSessionSchema,
  messageResultSchema,
  userProfileSchema,
  type LoginRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
} from '../domain/auth.model'

export async function registerApi(body: RegisterRequest) {
  return apiRequest(ENDPOINTS.auth.register, {
    method: 'POST',
    body,
    schema: envelopeSchema(authSessionSchema),
  })
}

export async function loginApi(body: LoginRequest) {
  return apiRequest(ENDPOINTS.auth.login, {
    method: 'POST',
    body,
    schema: envelopeSchema(authSessionSchema),
  })
}

export async function loginWithGoogleApi(idToken: string) {
  return apiRequest(ENDPOINTS.auth.google, {
    method: 'POST',
    body: { idToken },
    schema: envelopeSchema(authSessionSchema),
  })
}

export async function forgotPasswordApi(identifier: string) {
  return apiRequest(ENDPOINTS.auth.forgotPassword, {
    method: 'POST',
    body: { identifier },
    schema: envelopeSchema(messageResultSchema),
  })
}

export async function resetPasswordApi(body: ResetPasswordRequest) {
  return apiRequest(ENDPOINTS.auth.resetPassword, {
    method: 'POST',
    body,
    schema: envelopeSchema(messageResultSchema),
  })
}

// Sends no token: the refresh token travels as an HTTP-only cookie.
export async function refreshAccessTokenApi() {
  return apiRequest(ENDPOINTS.auth.refresh, {
    method: 'POST',
    schema: envelopeSchema(accessTokenSchema),
  })
}

// Answers 204 No Content.
export async function logoutApi(accessToken: string) {
  return apiRequest(ENDPOINTS.auth.logout, {
    method: 'POST',
    accessToken,
    schema: z.undefined(),
  })
}

export async function getCurrentUserApi(accessToken: string) {
  return apiRequest(ENDPOINTS.currentUser.root, {
    method: 'GET',
    accessToken,
    schema: envelopeSchema(userProfileSchema),
  })
}
