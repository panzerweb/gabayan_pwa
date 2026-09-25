import { describe, expect, it } from 'vitest'

import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  bearer,
  cookieHeader,
  registrationBody,
  signInAsDemo,
  uniqueEmail,
} from '../support/accounts.mjs'
import { expectEnvelope, expectError } from '../support/envelope.mjs'

export function registerSystemAndAuthContract(client) {
  describe('system and authentication', () => {
    it('serves API metadata without a token', async () => {
      const meta = expectEnvelope(await client.get('/meta'))

      expect(meta).toMatchObject({
        apiVersion: 'v1',
        defaultTimezone: 'Asia/Manila',
        serverTime: expect.any(String),
      })
    })

    it('answers an unknown route with the contract error envelope', async () => {
      expectError(await client.get('/no-such-resource'), 404, 'NOT_FOUND')
    })

    it('refuses account resources without a token', async () => {
      expectError(await client.get('/users/me'), 401, 'AUTH_REQUIRED')
    })

    it('rotates the access token from the refresh cookie until the farmer signs out', async () => {
      const registered = await client
        .post('/auth/register')
        .send(registrationBody('Refresh Tester'))
      const session = expectEnvelope(registered, 201)

      const refreshed = await client.post('/auth/refresh').set('Cookie', cookieHeader(registered))
      const access = expectEnvelope(refreshed)
      expect(access).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresInSeconds: expect.any(Number),
      })
      const me = await client.get('/users/me').set('Authorization', bearer(access.accessToken))
      expect(expectEnvelope(me).email).toBe(session.user.email)

      // A server that rotates the refresh cookie hands the new one back with the token.
      const cookie = cookieHeader(refreshed) || cookieHeader(registered)
      const loggedOut = await client
        .post('/auth/logout')
        .set('Authorization', bearer(access.accessToken))
        .set('Cookie', cookie)
      expect(loggedOut.status).toBe(204)

      expectError(await client.post('/auth/refresh').set('Cookie', cookie), 401, expect.any(String))
    })

    it('answers a password-reset request the same way whatever the email', async () => {
      const response = await client
        .post('/auth/password/forgot')
        .send({ identifier: uniqueEmail('nobody') })

      expect(expectEnvelope(response, 202).message).toEqual(expect.any(String))
    })

    it('refuses a password-reset request that names no identifier', async () => {
      const response = await client
        .post('/auth/password/forgot')
        .send({ email: uniqueEmail('nobody') })

      const error = expectError(response, 422, 'VALIDATION_ERROR')
      expect(Object.keys(error.fields)).toContain('identifier')
    })

    it('accepts the development Google and reset fixtures only on the mock', async () => {
      const google = await client.post('/auth/google').send({ idToken: 'demo-google-token' })
      const reset = await client.post('/auth/password/reset').send({
        token: 'demo-reset-token',
        password: DEMO_PASSWORD,
        confirmPassword: DEMO_PASSWORD,
      })

      if (await client.servesMockFixtures()) {
        expect(expectEnvelope(google).user.email).toBe(DEMO_EMAIL)
        expect(expectEnvelope(reset).message).toEqual(expect.any(String))
      } else {
        // FastAPI answers 503 while Google sign-in is not configured, 401 once it is.
        expect([401, 503]).toContain(google.status)
        expectError(google, google.status, expect.any(String))
        const error = expectError(reset, 422, 'VALIDATION_ERROR')
        expect(error.fields).toHaveProperty('token')
      }
      // The reset fixture sets the demo password it already had, so later scenarios sign in.
      expect((await signInAsDemo(client)).user.email).toBe(DEMO_EMAIL)
    })
  })
}
