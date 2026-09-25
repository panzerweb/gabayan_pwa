import type { EducationalTip, HomeDashboard } from '@pages/home/domain/home.model'

import { afternoonFeeding, batch001, waterCheck } from '../cultivations/fixtures'

export const demoTip: EducationalTip = {
  id: 'tip_feeding_response',
  title: 'Watch how fish respond to feed',
  message: 'Stop feeding when most fish lose interest, and note it in your feeding record.',
  image: null,
  learnMoreUrl: null,
  sourceStatus: 'DEMO',
  isDemo: true,
  ruleVersion: 'demo-tips-2026.09',
  disclaimer: 'General demo guidance, not advice for your specific pond.',
}

export const dashboard: HomeDashboard = {
  date: '2026-09-23',
  greetingName: 'Juan',
  primaryCultivation: batch001,
  taskSummary: { completed: 1, total: 3 },
  tasks: [waterCheck, afternoonFeeding],
  farmOverview: {
    fishAgeDays: 46,
    estimatedAverageWeight: { value: 85, unit: 'G' },
    dailyFeed: { value: 2.4, unit: 'KG' },
    daysUntilHarvest: 103,
  },
  tip: demoTip,
  unreadNotificationCount: 3,
}

export const newcomerDashboard: HomeDashboard = {
  ...dashboard,
  greetingName: 'Maria',
  primaryCultivation: null,
  taskSummary: { completed: 0, total: 0 },
  tasks: [],
  farmOverview: null,
  unreadNotificationCount: 0,
}
