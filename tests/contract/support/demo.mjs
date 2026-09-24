import { expect } from 'vitest'

import { bearer, idempotencyKey } from './accounts.mjs'
import { expectEnvelope, expectPage } from './envelope.mjs'

// The day the demo seed is written for; FastAPI is seeded with `seed-demo --date 2026-09-23`.
export const SEED_DAY = '2026-09-23'
export const DEMO_CULTIVATION = 'Tilapia Batch #001'
export const HARVEST_DEMO_CULTIVATION = 'Tilapia Harvest Demo'
export const DEMO_ORDER_NUMBER = 'GBY-10245'
export const AERATOR_SKU = 'GBY-AER-001'
export const POND_DIMENSIONS = { lengthM: 5, widthM: 4, waterDepthM: 1.5 }

// Seeded records are found by what a farmer sees (names, codes, SKUs), never by id: ids
// are opaque and differ between the mock and FastAPI.
function findOne(records, predicate, description) {
  const match = records.find(predicate)
  expect(match, `no ${description} in ${JSON.stringify(records.map((r) => r.id))}`).toBeDefined()
  return match
}

export async function findSpecies(client, commonName) {
  const species = expectPage(await client.get('/species?limit=100'))
  return findOne(species, (item) => item.commonName === commonName, `species ${commonName}`)
}

export async function findEnvironment(client, code) {
  const environments = expectPage(await client.get('/culture-environments?limit=100'))
  return findOne(environments, (item) => item.code === code, `environment ${code}`)
}

export async function findCategory(client, name) {
  const categories = expectPage(await client.get('/product-categories?limit=100'))
  return findOne(categories, (item) => item.name === name, `category ${name}`)
}

export async function findCultivation(client, token, name) {
  const response = await client.get('/cultivations?limit=100').set('Authorization', bearer(token))
  return findOne(expectPage(response), (item) => item.name === name, `cultivation ${name}`)
}

export async function findProduct(client, token, sku) {
  const response = await client.get('/products?limit=100').set('Authorization', bearer(token))
  return findOne(expectPage(response), (item) => item.sku === sku, `product ${sku}`)
}

export async function findOrder(client, token, orderNumber) {
  const response = await client.get('/orders?limit=100').set('Authorization', bearer(token))
  return findOne(expectPage(response), (item) => item.orderNumber === orderNumber, orderNumber)
}

/** The seeded tasks of one cultivation on the seed day, in schedule order. */
export async function listSeedDayTasks(client, token, cultivationId) {
  const response = await client
    .get(`/tasks?date=${SEED_DAY}&cultivationId=${encodeURIComponent(cultivationId)}`)
    .set('Authorization', bearer(token))
  return expectPage(response)
}

/**
 * Creates a Tilapia pond cultivation for the signed-in account from a fresh stocking
 * estimate (500 fingerlings, inside the demo range) and returns its detail.
 */
export async function createCultivation(client, token, { stockedOn = null } = {}) {
  const [species, environment] = await Promise.all([
    findSpecies(client, 'Tilapia'),
    findEnvironment(client, 'POND'),
  ])
  const estimate = expectEnvelope(
    await client.post('/stocking-estimates').set('Authorization', bearer(token)).send({
      speciesId: species.id,
      environmentId: environment.id,
      dimensions: POND_DIMENSIONS,
      plannedFingerlings: 500,
    }),
  )
  const created = await client
    .post('/cultivations')
    .set('Authorization', bearer(token))
    .set('Idempotency-Key', idempotencyKey('cultivation'))
    .send({
      estimateId: estimate.estimateId,
      speciesId: species.id,
      environmentId: environment.id,
      dimensions: POND_DIMENSIONS,
      initialFingerlings: 500,
      stockedOn,
    })
  return expectEnvelope(created, 201)
}
