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
