import type { Envelope } from '@core/http'

import type {
  AccessToken,
  AuthSession,
  LoginRequest,
  MessageResult,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
} from './auth.model'

export interface AuthRepository {
  register(body: RegisterRequest): Promise<Envelope<AuthSession>>
  login(body: LoginRequest): Promise<Envelope<AuthSession>>
  loginWithGoogle(idToken: string): Promise<Envelope<AuthSession>>
  forgotPassword(identifier: string): Promise<Envelope<MessageResult>>
  resetPassword(body: ResetPasswordRequest): Promise<Envelope<MessageResult>>
  refreshAccessToken(): Promise<Envelope<AccessToken>>
  logout(accessToken: string): Promise<void>
  getCurrentUser(accessToken: string): Promise<Envelope<UserProfile>>
}
