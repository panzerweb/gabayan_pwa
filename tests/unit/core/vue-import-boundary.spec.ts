// @vitest-environment node
import { ESLint } from 'eslint'

const eslint = new ESLint()

const VIEW_PATH = 'src/pages/cultivations/presentation/views/ExampleView.vue'

function sfcImporting(specifier: string) {
  return [
    '<script setup lang="ts">',
    `import * as imported from '${specifier}'`,
    'void imported',
    '</script>',
    '',
    '<template>',
    '  <div />',
    '</template>',
    '',
  ].join('\n')
}

async function restrictedImports(specifier: string, filePath = VIEW_PATH) {
  const [result] = await eslint.lintText(sfcImporting(specifier), { filePath })
  return (result?.messages ?? []).filter(({ ruleId }) => ruleId === 'no-restricted-imports')
}

describe('.vue import boundary', () => {
  // The first lint loads the flat config, the Vue and TypeScript parsers and
  // every plugin; on a busy machine that alone can exceed the per-test timeout.
  beforeAll(async () => {
    await restrictedImports('@core/utils/format')
  }, 60_000)

  it.each([
    '@tanstack/vue-query',
    '@core/http',
    '@/core/http',
    '../../data/cultivations.api',
    '../../data/cultivations.repository',
    '@pages/orders/data/orders.keys',
  ])('reports a feature view importing %s', async (specifier) => {
    expect(await restrictedImports(specifier)).toHaveLength(1)
  })

  it('reports a feature component as well as a view', async () => {
    const componentPath = 'src/pages/orders/presentation/components/OrderCard.vue'

    expect(await restrictedImports('@core/http', componentPath)).toHaveLength(1)
  })

  it.each([
    '../composables/useCultivation',
    '../../domain/cultivations.model',
    '@core/utils/format',
    '@components/ui/BaseButton.vue',
  ])('allows a feature view to import %s', async (specifier) => {
    expect(await restrictedImports(specifier)).toEqual([])
  })
})
