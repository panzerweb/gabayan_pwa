import contractSource from '../../../docs/api_contract.md?raw'

import { ENDPOINTS } from '@core/url_paths'

const PLACEHOLDER = 'PATH_PARAMETER'

// Method-and-path rows of the §5 endpoint catalog, with every `{param}` reduced to `{}`.
function contractCatalogPaths(source: string) {
  const start = source.indexOf('## 5. Endpoint Catalog')
  const end = source.indexOf('## 6.', start)
  const catalog = source.slice(start, end)
  const rows = catalog.matchAll(/^\|\s*`(GET|POST|PUT|PATCH|DELETE) (\/[^`\s]*)`/gm)
  return [...rows].map(([, method, path]) => ({
    row: `${method} ${path}`,
    path: path!.replace(/\{[^}]+\}/g, '{}'),
  }))
}

// Every path ENDPOINTS declares, with id arguments reduced to `{}`.
function declaredPaths(node: unknown): string[] {
  if (typeof node === 'string') return [node]
  if (typeof node === 'function') {
    return [String(node(PLACEHOLDER)).replaceAll(PLACEHOLDER, '{}')]
  }
  if (typeof node === 'object' && node !== null) return Object.values(node).flatMap(declaredPaths)
  return []
}

const catalog = contractCatalogPaths(contractSource)
const declared = new Set(declaredPaths(ENDPOINTS))

describe('ENDPOINTS', () => {
  it('reads the endpoint catalog of the contract', () => {
    expect(catalog.length).toBeGreaterThan(60)
  })

  it.each(catalog)('declares the path of $row', ({ path }) => {
    expect(declared).toContain(path)
  })

  it('declares no path the contract catalog does not list', () => {
    const listed = new Set(catalog.map(({ path }) => path))
    expect([...declared].filter((path) => !listed.has(path))).toEqual([])
  })

  it('builds id paths with the id encoded as one path segment', () => {
    expect(ENDPOINTS.tasks.complete('task_001')).toBe('/tasks/task_001/complete')
    expect(ENDPOINTS.cultivations.growth('cul 1/2')).toBe(
      '/cultivations/cul%201%2F2/growth-measurements',
    )
  })
})
