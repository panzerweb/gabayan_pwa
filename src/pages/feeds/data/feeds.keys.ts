// Query keys for the feed guides. A guide is reference data no mutation changes.
export const feedsKeys = {
  all: () => ['feeds'] as const,
  guide: (speciesId: string) => ['feeds', 'guide', speciesId] as const,
}
