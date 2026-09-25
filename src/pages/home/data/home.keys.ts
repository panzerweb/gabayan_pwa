// Query keys for Home, under the `['home']` prefix every cultivation, record and order write
// invalidates through `@core/query`.
export const homeKeys = {
  all: () => ['home'] as const,
  dashboard: (date: string) => ['home', 'dashboard', date] as const,
}
