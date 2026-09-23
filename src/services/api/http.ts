import type { ZodType } from 'zod'

import { apiBaseUrl, apiRequestTimeoutMs } from './config'

export interface ResponseMeta {
  requestId: string
}

export interface Envelope<T> {
  data: T
  meta: ResponseMeta
}

export interface PageInfo {
  cursor: string | null
  nextCursor: string | null
  limit: number
  total: number
}

export interface Page<T> extends Envelope<T[]> {
  page: PageInfo
}

export interface ApiErrorPayload {
  error: {
    code: string
    message: string
    fields: Record<string, string[]> | null
    details: unknown
    requestId: string
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string[]> | null
  readonly details: unknown
  readonly requestId: string

  constructor(status: number, payload: ApiErrorPayload['error']) {
    super(payload.message)
    this.name = 'ApiError'
    this.status = status
    this.code = payload.code
    this.fields = payload.fields
    this.details = payload.details
    this.requestId = payload.requestId
  }
}

export interface ApiRequestOptions<T> extends Omit<RequestInit, 'body'> {
  body?: unknown
  schema: ZodType<T>
  accessToken?: string
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const error = value.error
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string' &&
    'requestId' in error &&
    typeof error.requestId === 'string'
  )
}

export async function apiRequest<T>(path: `/${string}`, options: ApiRequestOptions<T>): Promise<T> {
  const {
    body,
    schema,
    accessToken,
    headers: optionHeaders,
    signal: optionSignal,
    ...requestOptions
  } = options
  const headers = new Headers(optionHeaders)
  const controller = new AbortController()
  let timedOut = false
  const abortFromCaller = () => controller.abort(optionSignal?.reason)
  optionSignal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, apiRequestTimeoutMs)
  headers.set('Accept', 'application/json')

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal,
      credentials: 'include',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (error) {
    if (optionSignal?.aborted) throw error
    throw new ApiError(0, {
      code: timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
      message: timedOut
        ? 'The server took too long to respond. Check your connection and try again.'
        : 'The server could not be reached. Check your connection and API address.',
      fields: null,
      details: null,
      requestId: 'client',
    })
  } finally {
    globalThis.clearTimeout(timeoutId)
    optionSignal?.removeEventListener('abort', abortFromCaller)
  }

  if (response.status === 204) {
    return schema.parse(undefined)
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (isApiErrorPayload(payload)) {
      throw new ApiError(response.status, payload.error)
    }

    throw new ApiError(response.status, {
      code: 'INVALID_ERROR_RESPONSE',
      message: 'We could not complete this request. Please try again.',
      fields: null,
      details: payload,
      requestId: response.headers.get('x-request-id') ?? 'unknown',
    })
  }

  return schema.parse(payload)
}
