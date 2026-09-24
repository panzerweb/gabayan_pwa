import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const contractPath = fileURLToPath(new URL('../../../docs/api_contract.md', import.meta.url))
const rowPattern = /^\|\s*`(GET|POST|PUT|PATCH|DELETE) (\/[^`]*)`/

function templatePattern(path) {
  const source = path
    .split(/\{[^}]+\}/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]+')
  return new RegExp(`^${source}$`)
}

/**
 * Every method-and-path row of the endpoint catalog (contract §5), in document order, as
 * `{ method, path, pattern }`; `pattern` matches a concrete path such as `/tasks/t1/reopen`.
 */
export function readCatalogRows(markdown = readFileSync(contractPath, 'utf8')) {
  const start = markdown.indexOf('## 5. Endpoint Catalog')
  const end = markdown.indexOf('\n## 6.', start)
  if (start === -1 || end === -1) throw new Error('The contract has no §5 endpoint catalog.')
  return markdown
    .slice(start, end)
    .split(/\r?\n/)
    .map((line) => rowPattern.exec(line))
    .filter(Boolean)
    .map(([, method, path]) => ({ method, path, pattern: templatePattern(path) }))
}

/**
 * The catalog rows no call among `calls` exercised. A 404 or 405 is how an unknown route
 * answers, so only a call answered otherwise proves the server implements the row; the
 * scenarios themselves assert what each answer holds.
 */
export function findUnexercisedRows(rows, calls) {
  const answered = calls.filter((call) => call.status !== 404 && call.status !== 405)
  return rows.filter(
    (row) => !answered.some((call) => call.method === row.method && row.pattern.test(call.path)),
  )
}
