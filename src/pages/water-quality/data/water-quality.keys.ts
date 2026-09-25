// Query keys for the water-quality feature. A saved log refreshes its cultivation's history
// under the `['water-quality', 'logs']` prefix of `@core/query`; a safety check stores
// nothing, so no mutation invalidates the ranges.
export const waterQualityKeys = {
  all: () => ['water-quality'] as const,
  thresholds: (speciesId: string, environmentId: string) =>
    ['water-quality', 'thresholds', speciesId, environmentId] as const,
  logs: (cultivationId: string) => ['water-quality', 'logs', cultivationId] as const,
}
