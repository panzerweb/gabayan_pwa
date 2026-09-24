// Query keys for cultivations and their tasks. Each sits under the matching `@core/query`
// prefix (`['cultivations', 'detail']`, `['cultivations', 'tasks']`, ...), so a mutation's
// invalidation row reaches every list, detail and timeline whatever its id.
export const cultivationsKeys = {
  all: () => ['cultivations'] as const,
  list: () => ['cultivations', 'list'] as const,
  detail: (cultivationId: string) => ['cultivations', 'detail', cultivationId] as const,
  timeline: (cultivationId: string) => ['cultivations', 'timeline', cultivationId] as const,
  tasks: () => ['cultivations', 'tasks'] as const,
  taskList: (cultivationId: string) => ['cultivations', 'tasks', cultivationId] as const,
}
