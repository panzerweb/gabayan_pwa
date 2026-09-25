import { expect } from 'vitest'

const camelCaseKey = /^[a-z][a-zA-Z0-9]*$/

// Every wire key is camelCase (contract §2). Keys under an error's `fields` are request
// paths such as `dimensions.lengthM`, so they are checked by the error helper instead.
export function expectCamelCaseKeys(value, path = 'data') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => expectCamelCaseKeys(item, `${path}[${index}]`))
    return
  }
  if (value === null || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    expect(key, `${path}.${key} is not camelCase`).toMatch(camelCaseKey)
    expectCamelCaseKeys(nested, `${path}.${key}`)
  }
}

function describeFailure(response) {
  return `${response.req?.method} ${response.req?.path} answered ${response.status}: ${JSON.stringify(response.body)}`
}

function expectMeta(body) {
  expect(body.meta).toEqual(expect.objectContaining({ requestId: expect.any(String) }))
}

/** Asserts a single-resource envelope with `status` and returns its `data`. */
export function expectEnvelope(response, status = 200) {
  expect(response.status, describeFailure(response)).toBe(status)
  expect(Object.keys(response.body).sort()).toEqual(['data', 'meta'])
  expectMeta(response.body)
  expectCamelCaseKeys(response.body.data)
  return response.body.data
}

/** Asserts a 200 collection envelope with cursor pagination and returns its `data`. */
export function expectPage(response) {
  expect(response.status, describeFailure(response)).toBe(200)
  expect(Object.keys(response.body).sort()).toEqual(['data', 'meta', 'page'])
  expect(Array.isArray(response.body.data)).toBe(true)
  expect(response.body.page).toEqual({
    cursor: expect.toBeOneOf([null, expect.any(String)]),
    nextCursor: expect.toBeOneOf([null, expect.any(String)]),
    limit: expect.any(Number),
    total: expect.any(Number),
  })
  expectMeta(response.body)
  expectCamelCaseKeys(response.body.data)
  return response.body.data
}

/** Asserts the contract error envelope with `status` and `code` and returns the error. */
export function expectError(response, status, code) {
  expect(response.status, describeFailure(response)).toBe(status)
  expect(Object.keys(response.body)).toEqual(['error'])
  const { error } = response.body
  expect(Object.keys(error).sort()).toEqual(['code', 'details', 'fields', 'message', 'requestId'])
  expect(error).toMatchObject({ code, message: expect.any(String), requestId: expect.any(String) })
  if (error.fields !== null) {
    for (const messages of Object.values(error.fields)) {
      expect(Array.isArray(messages)).toBe(true)
    }
  }
  if (error.details !== null) expectCamelCaseKeys(error.details, 'error.details')
  return error
}
