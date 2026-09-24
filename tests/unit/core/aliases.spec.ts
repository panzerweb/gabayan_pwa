import tsconfigSource from '../../../tsconfig.app.json?raw'
import viteConfigSource from '../../../vite.config.ts?raw'
import vitestConfigSource from '../../../vitest.config.ts?raw'

const expectedAliases: Record<string, string> = {
  '@': './src',
  '@core': './src/core',
  '@components': './src/components',
  '@stores': './src/stores',
  '@layouts': './src/layouts',
  '@router': './src/router',
  '@pages': './src/pages',
}

// Reads `'@x': fileURLToPath(new URL('./src/x', import.meta.url))` entries from a config source.
function bundlerAliases(source: string) {
  const entries = source.matchAll(/'(@[\w-]*)':\s*fileURLToPath\(new URL\('([^']+)'/g)
  return Object.fromEntries([...entries].map(([, alias, target]) => [alias, target]))
}

function typescriptAliases(source: string) {
  const config = JSON.parse(source) as { compilerOptions: { paths: Record<string, string[]> } }
  return Object.fromEntries(
    Object.entries(config.compilerOptions.paths).map(([alias, [target]]) => [
      alias.replace(/\/\*$/, ''),
      target?.replace(/\/\*$/, ''),
    ]),
  )
}

describe('module aliases', () => {
  it('resolves every alias to the same folder in Vite', () => {
    expect(bundlerAliases(viteConfigSource)).toEqual(expectedAliases)
  })

  it('resolves every alias to the same folder in Vitest', () => {
    expect(bundlerAliases(vitestConfigSource)).toEqual(expectedAliases)
  })

  it('resolves every alias to the same folder in the TypeScript project', () => {
    expect(typescriptAliases(tsconfigSource)).toEqual(expectedAliases)
  })
})
