// Query keys for cultivations, their tasks and their records. Each sits under the matching
// `@core/query` prefix (`['cultivations', 'detail']`, `['cultivations', 'growth']`, ...), so a
// mutation's invalidation row reaches every list, detail and record history whatever its id.
export const cultivationsKeys = {
  all: () => ['cultivations'] as const,
  list: () => ['cultivations', 'list'] as const,
  detail: (cultivationId: string) => ['cultivations', 'detail', cultivationId] as const,
  timeline: (cultivationId: string) => ['cultivations', 'timeline', cultivationId] as const,
  tasks: () => ['cultivations', 'tasks'] as const,
  taskList: (cultivationId: string) => ['cultivations', 'tasks', cultivationId] as const,
  growth: (cultivationId: string) => ['cultivations', 'growth', cultivationId] as const,
  mortality: (cultivationId: string) => ['cultivations', 'mortality', cultivationId] as const,
  feedingPlan: (cultivationId: string, date: string) =>
    ['cultivations', 'feeding-plan', cultivationId, date] as const,
  feedingRecords: (cultivationId: string) =>
    ['cultivations', 'feeding-records', cultivationId] as const,
  waterChecks: (cultivationId: string) => ['cultivations', 'water-checks', cultivationId] as const,
  harvestReadiness: (cultivationId: string) =>
    ['cultivations', 'harvest-readiness', cultivationId] as const,
}
