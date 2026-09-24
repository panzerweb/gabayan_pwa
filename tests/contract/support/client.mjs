import { copyFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import request from 'supertest'

import { createMockApi } from '../../../mock-api/server.mjs'

const seedPath = fileURLToPath(new URL('../../../mock-api/fixtures/seed.json', import.meta.url))
const methods = ['get', 'post', 'put', 'patch', 'delete']

// The in-process mock runs on its own copy of the seed, so the suite never depends on
// `mock-api/db.json` or on a reset having been run first.
function inProcessMock() {
  const databasePath = join(mkdtempSync(join(tmpdir(), 'gabayan-contract-')), 'db.json')
  copyFileSync(seedPath, databasePath)
  return { target: createMockApi({ databasePath, delayMs: 0 }), root: '/api/v1' }
}

function liveServer(baseUrl) {
  const url = new URL(baseUrl)
  return { target: url.origin, root: url.pathname.replace(/\/+$/, '') }
}

/**
 * The client every contract test talks through. It drives the in-process mock by default
 * and a running server when `CONTRACT_API_BASE_URL` (the API root, `/api/v1` included) is
 * set. Paths are relative to the API root (`client.get('/species')`), and every answered
 * call is recorded in `calls` for the endpoint-catalog coverage check.
 */
export function createContractClient({ baseUrl = process.env.CONTRACT_API_BASE_URL } = {}) {
  const inProcess = !baseUrl
  const { target, root } = inProcess ? inProcessMock() : liveServer(baseUrl)
  const calls = []
  let servesMockFixtures

  function send(method, path) {
    const test = request(target)[method](`${root}${path}`)
    test.on('response', (response) => {
      calls.push({
        method: method.toUpperCase(),
        path: path.split('?')[0],
        status: response.status,
      })
    })
    return test
  }

  const client = {
    baseUrl: inProcess ? 'in-process mock' : baseUrl,
    calls,
    /**
     * Whether the server behind the client is the JSON Server mock, which alone accepts the
     * development fixtures (`demo-google-token`, `demo-reset-token`). A live URL is asked
     * through its health payload, so pointing the suite at a running mock is recognised too.
     */
    async servesMockFixtures() {
      if (inProcess) return true
      if (servesMockFixtures === undefined) {
        const health = await send('get', '/health')
        servesMockFixtures = health.body?.data?.service === 'gabayan-mock-api'
      }
      return servesMockFixtures
    },
  }
  for (const method of methods) client[method] = (path) => send(method, path)
  return client
}
