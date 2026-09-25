import type { AuthRepository } from '../domain/auth.repository.interface'
import {
  forgotPasswordApi,
  getCurrentUserApi,
  loginApi,
  loginWithGoogleApi,
  logoutApi,
  refreshAccessTokenApi,
  registerApi,
  resetPasswordApi,
} from './auth.api'

export const authRepository: AuthRepository = {
  register: registerApi,
  login: loginApi,
  loginWithGoogle: loginWithGoogleApi,
  forgotPassword: forgotPasswordApi,
  resetPassword: resetPasswordApi,
  refreshAccessToken: refreshAccessTokenApi,
  logout: logoutApi,
  getCurrentUser: getCurrentUserApi,
}
