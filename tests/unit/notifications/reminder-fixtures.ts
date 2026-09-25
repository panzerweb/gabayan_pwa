import type { Notification, ReminderDetail } from '@pages/notifications/domain/notifications.model'

import { feedingDue } from './fixtures'

// Reminders as the mock raises them for Tilapia Batch #001 (contract §12 Reminders).

const provenance = {
  basis: 'Placeholder figures not yet reviewed for this species.',
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
} as const

export const waterChangeDetail: ReminderDetail = {
  ...provenance,
  waterChangePercent: 30,
  harvestWindowDays: null,
  latestAverageWeight: null,
  targetWeightRange: null,
  disclaimer: 'A demo schedule, not yet reviewed for your farm.',
}

export const harvestDetail: ReminderDetail = {
  ...provenance,
  waterChangePercent: null,
  harvestWindowDays: { minimum: 120, maximum: 150 },
  latestAverageWeight: { value: 380, unit: 'G' },
  targetWeightRange: { minimum: { value: 350, unit: 'G' }, maximum: { value: 450, unit: 'G' } },
  disclaimer: 'Harvest readiness is an estimate, not a guarantee.',
}

export const feedingDetail: ReminderDetail = {
  ...provenance,
  waterChangePercent: null,
  harvestWindowDays: null,
  latestAverageWeight: null,
  targetWeightRange: null,
  disclaimer: 'Observe feeding response and local conditions.',
}

export const waterChangeDue: Notification = {
  ...feedingDue,
  id: 'ntf_water_change_cul_tilapia_001_7',
  type: 'WATER_CHANGE_DUE',
  title: 'Partial water change due',
  message: 'Tilapia Batch #001: change about 30% of the water, a little at a time.',
  recommendedAmount: null,
  occurredAt: '2026-09-25T00:05:00Z',
  action: {
    label: 'Open water records',
    deepLink: '/app/cultivations/cul_tilapia_001/records?tab=water',
  },
  taskId: null,
  reminder: waterChangeDetail,
}

export const harvestAlert: Notification = {
  ...feedingDue,
  id: 'ntf_harvest_cul_tilapia_001_grw_00009',
  type: 'HARVEST_APPROACHING',
  title: 'Your fish may be near harvest size',
  message: 'The latest sample from Tilapia Batch #001 averages 380 g.',
  recommendedAmount: null,
  occurredAt: '2026-09-25T00:20:00Z',
  action: {
    label: 'Check harvest readiness',
    deepLink: '/app/cultivations/cul_tilapia_001/harvest',
  },
  taskId: null,
  reminder: harvestDetail,
}
