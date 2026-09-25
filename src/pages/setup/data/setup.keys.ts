// Query keys for the setup wizard's reference data and the recommendations shown once a
// cultivation exists. None of them sits under a `@core/query` prefix: no mutation makes them
// stale.
export const setupKeys = {
  all: () => ['setup'] as const,
  species: () => ['setup', 'species', 'active'] as const,
  environments: () => ['setup', 'environments', 'active'] as const,
  compatibility: (speciesId: string, environmentId: string) =>
    ['setup', 'compatibility', speciesId, environmentId] as const,
  sizing: (speciesId: string, environmentId: string) =>
    ['setup', 'sizing', speciesId, environmentId] as const,
  equipmentRecommendations: (cultivationId: string) =>
    ['setup', 'equipment-recommendations', cultivationId] as const,
}
