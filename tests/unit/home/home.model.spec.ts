import {
  cultivationDayLabel,
  daysUntilHarvestLabel,
  homeDashboardSchema,
  homeHeadline,
  tasksRemaining,
  tipSourceDisplay,
} from '@pages/home/domain/home.model'

import { dashboard, demoTip, newcomerDashboard } from './fixtures'

describe('home model', () => {
  it('parses a dashboard with and without a primary cultivation', () => {
    expect(homeDashboardSchema.parse(dashboard).tasks).toHaveLength(2)
    expect(homeDashboardSchema.parse(newcomerDashboard).farmOverview).toBeNull()
  })

  it('counts the tasks still open and never goes below zero', () => {
    expect(tasksRemaining({ completed: 1, total: 3 })).toBe(2)
    expect(tasksRemaining({ completed: 4, total: 3 })).toBe(0)
  })

  it('invites a farmer without a cultivation to start one', () => {
    expect(homeHeadline(dashboard)).toBe('Here’s today’s farm plan.')
    expect(homeHeadline(newcomerDashboard)).toBe('Ready when you are.')
  })

  it('labels the cultivation day, or planning before stocking', () => {
    expect(cultivationDayLabel(46)).toBe('Day 46')
    expect(cultivationDayLabel(null)).toBe('Planning')
  })

  it('shows days to harvest only when the server has an estimate', () => {
    expect(daysUntilHarvestLabel(dashboard.farmOverview)).toBe('103 days')
    expect(daysUntilHarvestLabel({ ...dashboard.farmOverview!, daysUntilHarvest: 1 })).toBe('1 day')
    expect(daysUntilHarvestLabel({ ...dashboard.farmOverview!, daysUntilHarvest: null })).toBe('—')
    expect(daysUntilHarvestLabel(null)).toBe('—')
  })

  it('marks demo tips as demo guidance whatever their source status says', () => {
    expect(tipSourceDisplay(demoTip).label).toBe('Demo guidance')
    expect(tipSourceDisplay({ isDemo: true, sourceStatus: 'VERIFIED' }).label).toBe('Demo guidance')
    expect(tipSourceDisplay({ isDemo: false, sourceStatus: 'VERIFIED' })).toEqual({
      label: 'Reviewed guidance',
      tone: 'success',
      icon: 'check',
    })
    expect(tipSourceDisplay({ isDemo: false, sourceStatus: 'DRAFT' }).label).toBe('Draft guidance')
  })
})
