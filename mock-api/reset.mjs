import { copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const seedPath = fileURLToPath(new URL('./fixtures/seed.json', import.meta.url))
const databasePath = fileURLToPath(new URL('./db.json', import.meta.url))

await copyFile(seedPath, databasePath)
console.info('Mock API database reset from deterministic seed.')
