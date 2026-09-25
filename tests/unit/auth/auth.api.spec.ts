import { apiBaseUrl } from '@core/http'
import {
  forgotPasswordApi,
  getCurrentUserApi,
  loginApi,
  loginWithGoogleApi,
  logoutApi,
  refreshAccessTokenApi,
  registerApi,
  resetPasswordApi,
} from '@pages/auth/data/auth.api'

const user = {
  id: 'usr_juan',
  fullName: 'Juan Dela Cruz',
  email: 'juan@example.com',
  mobileNumber: '+639171234567',
  avatar: null,
  emailVerified: true,
  mobileVerified: true,
  locale: 'en-PH',
  timezone: 'Asia/Manila',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  version: 1,
}
const token = { accessToken: 'access_1', tokenType: 'Bearer', expiresInSeconds: 900 }
const session = {
  ...token,
  user,
  onboarding: { hasCultivation: true, suggestedRoute: '/app/home' },
}
const message = { message: 'Done.' }

function respondWith(data: unknown, status = 200) {
  const body = status === 204 ? null : JSON.stringify({ data, meta: { requestId: 'req_1' } })
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(body, { status, headers: { 'Content-Type': 'application/json' } }),
    )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function sent(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return {
    url,
    method: init.method,
    body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    authorization: new Headers(init.headers).get('Authorization'),
  }
}

describe('auth api', () => {
  it.each([
    [
      'registerApi',
      () =>
        registerApi({
          fullName: 'Maria Santos',
          email: 'maria@example.com',
          mobileNumber: '09171234568',
          password: 'SafeDemo123!',
          confirmPassword: 'SafeDemo123!',
          acceptedTerms: true,
          acceptedTermsVersion: '2026-09',
        }),
      session,
      '/auth/register',
      expect.objectContaining({ email: 'maria@example.com', acceptedTermsVersion: '2026-09' }),
    ],
    [
      'loginApi',
      () => loginApi({ identifier: 'juan@example.com', password: 'secret' }),
      session,
      '/auth/login',
      { identifier: 'juan@example.com', password: 'secret' },
    ],
    [
      'loginWithGoogleApi',
      () => loginWithGoogleApi('google-token'),
      session,
      '/auth/google',
      { idToken: 'google-token' },
    ],
    [
      'forgotPasswordApi',
      () => forgotPasswordApi('juan@example.com'),
      message,
      '/auth/password/forgot',
      { identifier: 'juan@example.com' },
    ],
    [
      'resetPasswordApi',
      () => resetPasswordApi({ token: 't', password: 'NewPass123', confirmPassword: 'NewPass123' }),
      message,
      '/auth/password/reset',
      { token: 't', password: 'NewPass123', confirmPassword: 'NewPass123' },
    ],
    ['refreshAccessTokenApi', () => refreshAccessTokenApi(), token, '/auth/refresh', undefined],
  ])(
    '%s posts to its contract path and parses the answer',
    async (_name, call, data, path, body) => {
      const fetchMock = respondWith(data)

      const result = await call()

      expect(result.data).toEqual(data)
      expect(sent(fetchMock)).toEqual({
        url: `${apiBaseUrl}${path}`,
        method: 'POST',
        body,
        authorization: null,
      })
    },
  )

  it('reads the signed-in profile with the access token', async () => {
    const fetchMock = respondWith(user)

    const result = await getCurrentUserApi('access_1')

    expect(result.data).toEqual(user)
    expect(sent(fetchMock)).toEqual({
      url: `${apiBaseUrl}/users/me`,
      method: 'GET',
      body: undefined,
      authorization: 'Bearer access_1',
    })
  })

  it('signs out with the access token and accepts an empty answer', async () => {
    const fetchMock = respondWith(null, 204)

    await expect(logoutApi('access_1')).resolves.toBeUndefined()
    expect(sent(fetchMock)).toMatchObject({
      url: `${apiBaseUrl}/auth/logout`,
      method: 'POST',
      authorization: 'Bearer access_1',
    })
  })

  it('refuses a session whose suggested route is not an app path', async () => {
    respondWith({ ...session, onboarding: { hasCultivation: true, suggestedRoute: 'home' } })

    await expect(loginApi({ identifier: 'juan@example.com', password: 'secret' })).rejects.toThrow()
  })
})
