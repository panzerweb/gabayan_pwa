// Query keys for the suggested water ranges. A safety check stores nothing, so no mutation
// invalidates them.
export const waterQualityKeys = {
  all: () => ['water-quality'] as const,
  thresholds: (speciesId: string, environmentId: string) =>
    ['water-quality', 'thresholds', speciesId, environmentId] as const,
}
