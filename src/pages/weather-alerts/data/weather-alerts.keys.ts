// Query keys for weather alerts, under the `['weather-alerts']` prefix a farm-location change
// invalidates through `@core/query`.
export const weatherAlertsKeys = {
  all: () => ['weather-alerts'] as const,
  current: () => ['weather-alerts', 'current'] as const,
}
