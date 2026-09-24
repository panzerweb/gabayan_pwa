import type {
  CultivationDetail,
  CultivationSummary,
  CultivationTimeline,
  FarmTask,
  TaskCompletionResult,
} from '@pages/cultivations/domain/cultivations.model'

const disclaimer =
  "Gabayan's recommendations are demo estimates and may vary based on local conditions."

const tilapia = {
  id: 'sp_tilapia',
  commonName: 'Tilapia',
  localName: 'Tilapia',
  image: { url: '/mock-media/tilapia.svg', alt: 'Tilapia swimming in clear water' },
}

const pond = { id: 'env_pond', code: 'POND', name: 'Pond' }

export const batch001: CultivationSummary = {
  id: 'cul_tilapia_001',
  name: 'Tilapia Batch #001',
  species: tilapia,
  environment: pond,
  status: 'GROWING',
  dayNumber: 46,
  estimatedDurationDays: 150,
  progressPercent: 31,
  initialFingerlings: 500,
  estimatedLiveFish: 485,
  estimatedHarvestDate: '2027-01-04',
  nextTaskAt: '2026-09-23T08:00:00Z',
  stockingStatus: 'RECOMMENDED',
  createdAt: '2026-08-07T00:00:00Z',
  updatedAt: '2026-09-22T00:00:00Z',
  version: 1,
}

export const harvestedBatch: CultivationSummary = {
  ...batch001,
  id: 'cul_tilapia_000',
  name: 'Tilapia Batch #000',
  status: 'COMPLETED',
  dayNumber: 150,
  progressPercent: 100,
  estimatedLiveFish: 470,
  nextTaskAt: null,
}

export const batch001Detail: CultivationDetail = {
  ...batch001,
  dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
  surfaceAreaM2: 20,
  estimatedWaterVolumeM3: 30,
  stockedOn: '2026-08-07',
  recordedMortality: 15,
  latestGrowthMeasurement: {
    id: 'grw_tilapia_003',
    cultivationId: 'cul_tilapia_001',
    measuredOn: '2026-09-21',
    numberOfFishSampled: 20,
    averageWeight: { value: 180, unit: 'G' },
    notes: null,
    recordedBy: { id: 'usr_juan', fullName: 'Juan Dela Cruz' },
    createdAt: '2026-09-21T00:30:00Z',
    updatedAt: '2026-09-21T00:30:00Z',
    version: 1,
  },
  growthStage: { code: 'GROWING', name: 'Growing', isEstimated: true },
  feedingSummary: {
    dailyFeed: { value: 2.4, unit: 'KG' },
    feedingsPerDay: 2,
    nextFeedingAt: '2026-09-23T08:00:00Z',
    planId: 'feed_plan_tilapia_001',
  },
  harvestSummary: {
    targetWeight: { value: 350, unit: 'G' },
    readinessStatus: 'MONITOR',
    estimatedHarvestDate: '2027-01-04',
  },
  stockingEstimateSnapshot: {
    estimateId: 'est_demo_tilapia_pond_500',
    species: {
      ...tilapia,
      slug: 'tilapia',
      shortDescription: 'Beginner-friendly and adaptable to many freshwater culture systems.',
      beginnerFriendly: true,
      estimatedCultureDays: { minimum: 120, maximum: 180 },
      active: true,
      sourceStatus: 'DEMO',
    },
    environment: {
      ...pond,
      shortDescription: 'For traditional earthen, concrete, or lined pond setups.',
      image: { url: '/mock-media/pond.svg', alt: 'A managed fish pond' },
      active: true,
      dimensionModel: 'RECTANGULAR_VOLUME',
      guidanceSummary: 'Plan using the pond surface area and estimated water volume.',
      sourceStatus: 'DEMO',
    },
    dimensions: { lengthM: 5, widthM: 4, waterDepthM: 1.5 },
    surfaceAreaM2: 20,
    estimatedWaterVolumeM3: 30,
    plannedFingerlings: 500,
    recommendedMinimum: 450,
    recommendedMaximum: 550,
    status: 'RECOMMENDED',
    differenceToRange: 0,
    suggestedFingerlings: 500,
    basis: {
      type: 'WATER_VOLUME',
      densityMinimum: 15,
      densityMaximum: 18.3333,
      densityUnit: 'FISH_PER_M3',
      inputAreaM2: 20,
      inputVolumeM3: 30,
      explanation: 'Demo density range for this prototype profile.',
    },
    compatibility: {
      speciesId: 'sp_tilapia',
      environmentId: 'env_pond',
      status: 'COMPATIBLE',
      title: 'This setup can be planned',
      message: 'This demo profile supports Tilapia in a pond.',
      alternatives: [],
      sourceStatus: 'DEMO',
      ruleVersion: 'demo-2026-09',
    },
    isDemo: true,
    sourceStatus: 'DEMO',
    ruleVersion: 'demo-2026-09',
    expiresAt: '2026-09-21T09:00:00Z',
    disclaimer,
  },
  recommendationDisclaimer: disclaimer,
  notes: null,
}

export const timeline: CultivationTimeline = {
  cultivationId: 'cul_tilapia_001',
  currentStage: { code: 'GROWING', name: 'Growing', isEstimated: true },
  events: [
    {
      id: 'timeline_stocked',
      type: 'STOCKING',
      label: 'Fingerlings stocked',
      status: 'COMPLETED',
      occurredOn: '2026-08-07',
      estimatedOn: null,
      detail: '500 Tilapia fingerlings recorded.',
    },
    {
      id: 'timeline_growing',
      type: 'GROWTH_STAGE',
      label: 'Growing stage',
      status: 'CURRENT',
      occurredOn: '2026-09-06',
      estimatedOn: null,
      detail: 'Current stage is estimated from the configured demo profile and recent records.',
    },
    {
      id: 'timeline_harvest',
      type: 'HARVEST',
      label: 'Estimated harvest window',
      status: 'UPCOMING',
      occurredOn: null,
      estimatedOn: '2027-01-04',
      detail: 'Readiness still requires current growth measurements and a harvest assessment.',
    },
  ],
}

export const afternoonFeeding: FarmTask = {
  id: 'task_feed_pm',
  cultivationId: 'cul_tilapia_001',
  type: 'FEEDING',
  title: 'Afternoon feeding',
  instruction: 'Give the planned afternoon portion and stop if fish are not actively feeding.',
  scheduledAt: '2026-09-23T08:00:00Z',
  dueAt: '2026-09-23T09:00:00Z',
  status: 'DUE',
  recommendedAmount: { value: 1.2, unit: 'KG' },
  completedAt: null,
  completionRecordType: null,
  completionRecordId: null,
  deepLink: '/app/cultivations/cul_tilapia_001/tasks?taskId=task_feed_pm',
  audit: { createdAt: '2026-09-21T08:00:00Z', updatedAt: '2026-09-21T08:00:00Z', version: 1 },
}

export const waterCheck: FarmTask = {
  ...afternoonFeeding,
  id: 'task_water_check',
  type: 'WATER_CHECK',
  title: 'Check water condition',
  instruction: 'Observe the water color, odor, and fish behavior. Record any concerns.',
  scheduledAt: '2026-09-23T02:00:00Z',
  dueAt: '2026-09-23T04:00:00Z',
  recommendedAmount: null,
  deepLink: '/app/cultivations/cul_tilapia_001/tasks?taskId=task_water_check',
}

export const feedingCompletion: TaskCompletionResult = {
  task: {
    ...afternoonFeeding,
    status: 'COMPLETED',
    completedAt: '2026-09-23T08:05:00Z',
    completionRecordType: 'FEEDING_RECORD',
    completionRecordId: 'feed_00002',
    audit: { ...afternoonFeeding.audit, updatedAt: '2026-09-23T08:05:00Z', version: 2 },
  },
  linkedRecord: {
    id: 'feed_00002',
    cultivationId: 'cul_tilapia_001',
    taskId: 'task_feed_pm',
    fedAt: '2026-09-23T08:05:00Z',
    amount: { value: 1.1, unit: 'KG' },
    notes: 'Fish responded normally.',
    recordedBy: { id: 'usr_juan', fullName: 'Juan Dela Cruz' },
    createdAt: '2026-09-23T08:05:00Z',
  },
  cultivationSnapshot: batch001,
}
