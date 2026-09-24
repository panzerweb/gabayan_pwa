import { randomInt } from 'node:crypto'

import { expectEnvelope } from './envelope.mjs'

export const DEMO_EMAIL = 'juan@example.com'
export const DEMO_PASSWORD = 'Gabayan123!'
export const ACCOUNT_PASSWORD = 'SafeDemo123!'

// One tag per run keeps emails and idempotency keys unique on a server that is not reset.
export const runId = `${Date.now().toString(36)}${randomInt(36 ** 3).toString(36)}`
let sequence = 0

export function uniqueEmail(label) {
  sequence += 1
  return `${label}.${runId}.${sequence}@example.com`
}

export function uniqueMobileNumber() {
  return `0917${String(randomInt(10_000_000)).padStart(7, '0')}`
}

export function idempotencyKey(label) {
  sequence += 1
  return `contract-${label}-${runId}-${sequence}`
}

export function bearer(token) {
  return `Bearer ${token}`
}

export function registrationBody(fullName, overrides = {}) {
  return {
    fullName,
    email: uniqueEmail(fullName.toLowerCase().replace(/[^a-z]+/g, '.')),
    mobileNumber: uniqueMobileNumber(),
    password: ACCOUNT_PASSWORD,
    confirmPassword: ACCOUNT_PASSWORD,
    acceptedTerms: true,
    acceptedTermsVersion: '2026-09',
    ...overrides,
  }
}

/** Registers a fresh account and returns its session (`accessToken`, `user`, ...). */
export async function registerAccount(client, fullName = 'Contract Farmer') {
  const response = await client.post('/auth/register').send(registrationBody(fullName))
  return expectEnvelope(response, 201)
}

/** Signs in as the seeded demo farmer, Juan Dela Cruz, and returns the session. */
export async function signInAsDemo(client) {
  const response = await client
    .post('/auth/login')
    .send({ identifier: DEMO_EMAIL, password: DEMO_PASSWORD })
  return expectEnvelope(response)
}

// The refresh cookie as a `Cookie` header value, whatever the server names it.
export function cookieHeader(response) {
  return (response.headers['set-cookie'] ?? []).map((cookie) => cookie.split(';')[0]).join('; ')
}
