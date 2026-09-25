import type { ZodType } from 'zod'

import { ApiError, isApiErrorPayload } from './api-error'
import { apiBaseUrl } from './config'

export interface ApiRequestOptions<T> extends Omit<RequestInit, 'body'> {
  body?: unknown
  schema: ZodType<T>
  accessToken?: string
}

export async function apiRequest<T>(path: `/${string}`, options: ApiRequestOptions<T>): Promise<T> {
  const { body, schema, accessToken, headers: optionHeaders, ...requestOptions } = options
  const headers = new Headers(optionHeaders)
  headers.set('Accept', 'application/json')

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers,
    credentials: 'include',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

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
