import type {
  CultivationDetail,
  CultivationSummary,
  CultivationTimeline,
  FarmTask,
  FeedingPlan,
  FeedingRecord,
  GrowthMeasurement,
  GrowthMutationResult,
  HarvestCompletion,
  HarvestReadiness,
  MortalityMutationResult,
  MortalityRecord,
  TaskCompletionResult,
  WaterCheck,
  WaterCheckMutationResult,
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

const juan = { id: 'usr_juan', fullName: 'Juan Dela Cruz' }

export function growthSample(id: string, measuredOn: string, grams: number): GrowthMeasurement {
  return {
    id,
    cultivationId: 'cul_tilapia_001',
    measuredOn,
    numberOfFishSampled: 20,
    averageWeight: { value: grams, unit: 'G' },
    notes: null,
    recordedBy: juan,
    createdAt: `${measuredOn}T00:30:00Z`,
    updatedAt: `${measuredOn}T00:30:00Z`,
    version: 1,
  }
}

export const growthSamples: GrowthMeasurement[] = [
  growthSample('grw_tilapia_003', '2026-09-21', 180),
  growthSample('grw_tilapia_002', '2026-09-06', 110),
]

export const feedingPlan: FeedingPlan = {
  id: 'feed_plan_cul_tilapia_001_2026-09-23',
  cultivationId: 'cul_tilapia_001',
  date: '2026-09-23',
  dailyTotal: { value: 2.62, unit: 'KG' },
  feedings: [
    {
      label: 'Morning feeding',
      scheduledAt: '2026-09-23T00:00:00Z',
      recommendedAmount: { value: 1.31, unit: 'KG' },
    },
    {
      label: 'Afternoon feeding',
      scheduledAt: '2026-09-23T08:00:00Z',
      recommendedAmount: { value: 1.31, unit: 'KG' },
    },
  ],
  estimatedLiveFish: 485,
  estimatedAverageWeight: { value: 180, unit: 'G' },
  growthStage: 'Growing',
  feedRatePercent: 3,
  explanation:
    'This demo estimate combines the latest average-weight sample, estimated live fish, and the configured stage feed-rate profile.',
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09',
  disclaimer:
    'Observe feeding response and local conditions. This estimate is not a prescription and may require qualified local guidance.',
}

const readinessProvenance = {
  basis: [
    'Latest recorded average-weight sample',
    'Estimated live fish after recorded mortality',
    'Demo Tilapia target-weight profile',
  ],
  isDemo: true,
  sourceStatus: 'DEMO' as const,
  ruleVersion: 'demo-2026-09',
  disclaimer:
    'Harvest readiness is an estimate, not a guarantee. Use a current representative sample and local professional judgment.',
}

const targetWeightRange = {
  minimum: { value: 350, unit: 'G' as const },
  maximum: { value: 450, unit: 'G' as const },
}

export const monitorReadiness: HarvestReadiness = {
  cultivationId: 'cul_tilapia_001',
  status: 'MONITOR',
  estimatedAverageWeight: { value: 180, unit: 'G' },
  targetWeightRange,
  estimatedLiveFish: 485,
  estimatedBiomass: { value: 87.3, unit: 'KG' },
  estimatedHarvestDate: '2027-01-04',
  latestMeasurementOn: '2026-09-21',
  message: 'The latest sample is below the demo target range. Continue monitoring growth.',
  ...readinessProvenance,
}

export const readyReadiness: HarvestReadiness = {
  cultivationId: 'cul_tilapia_harvest',
  status: 'POTENTIALLY_READY',
  estimatedAverageWeight: { value: 360, unit: 'G' },
  targetWeightRange,
  estimatedLiveFish: 480,
  estimatedBiomass: { value: 172.8, unit: 'KG' },
  estimatedHarvestDate: '2026-09-30',
  latestMeasurementOn: '2026-09-22',
  message:
    'The latest sample is within the demo target range. Confirm market needs, fish condition, and a representative sample before deciding.',
  ...readinessProvenance,
}

export const unmeasuredReadiness: HarvestReadiness = {
  ...monitorReadiness,
  status: 'INSUFFICIENT_DATA',
  estimatedAverageWeight: null,
  estimatedBiomass: null,
  estimatedHarvestDate: null,
  latestMeasurementOn: null,
  message: 'Record a current growth sample before harvest readiness can be estimated.',
}

export const growthResult: GrowthMutationResult = {
  record: growthSample('grw_00005', '2026-09-23', 200),
  previousAverageWeight: { value: 180, unit: 'G' },
  change: { value: 20, unit: 'G' },
  feedingPlan,
  harvestReadiness: monitorReadiness,
}

export const mortalityRecord: MortalityRecord = {
  id: 'mort_tilapia_001',
  cultivationId: 'cul_tilapia_001',
  occurredOn: '2026-09-10',
  fishCount: 15,
  reason: 'WATER_QUALITY',
  notes: 'Recorded during the weekly count.',
  recordedBy: juan,
  createdAt: '2026-09-10T02:00:00Z',
}

export const mortalityResult: MortalityMutationResult = {
  record: { ...mortalityRecord, id: 'mort_00003', fishCount: 5, reason: 'UNKNOWN', notes: null },
  stock: { initialFingerlings: 500, recordedMortality: 20, estimatedLiveFish: 480 },
  feedingPlan,
}

export const feedingRecord: FeedingRecord = {
  id: 'feed_tilapia_001',
  cultivationId: 'cul_tilapia_001',
  taskId: 'task_feed_am',
  fedAt: '2026-09-23T00:12:00Z',
  amount: { value: 1.2, unit: 'KG' },
  notes: 'Fish responded normally.',
  recordedBy: juan,
  createdAt: '2026-09-23T00:12:00Z',
}

export const calmWaterCheck: WaterCheck = {
  id: 'water_tilapia_001',
  cultivationId: 'cul_tilapia_001',
  checkedAt: '2026-09-21T22:30:00Z',
  observation: {
    clarity: 'Slightly green',
    odor: 'No unusual odor',
    fishBehavior: 'Active near feeding time',
    unusualChanges: false,
  },
  actionTaken: null,
  notes: null,
  guidance: [
    {
      severity: 'INFO',
      title: 'Continue regular observation',
      message:
        'No unusual change was recorded. Continue observing fish behavior and water condition.',
      sourceStatus: 'DEMO',
      ruleVersion: 'demo-2026-09',
      disclaimer:
        'This is conditional demo guidance and is not a site-specific water-quality assessment.',
    },
  ],
  recordedBy: juan,
  createdAt: '2026-09-21T22:30:00Z',
}

const cautionGuidance = {
  severity: 'CAUTION' as const,
  title: 'Review the change promptly',
  message:
    'An unusual change was recorded. Check available water-quality measurements and seek local technical guidance before taking major action.',
  sourceStatus: 'DEMO' as const,
  ruleVersion: 'demo-2026-09',
  disclaimer:
    'This conditional demo guidance does not prescribe full water replacement or diagnose a cause.',
}

export const waterCheckResult: WaterCheckMutationResult = {
  record: {
    ...calmWaterCheck,
    id: 'water_00002',
    checkedAt: '2026-09-23T00:00:00.000Z',
    observation: {
      clarity: 'Cloudier than usual',
      odor: 'Normal',
      fishBehavior: 'Slower near one corner',
      unusualChanges: true,
    },
    guidance: [cautionGuidance],
  },
  generatedTasks: [],
  guidance: [cautionGuidance],
}

export const harvestCompletion: HarvestCompletion = {
  cultivation: {
    ...batch001Detail,
    id: 'cul_tilapia_harvest',
    name: 'Tilapia Harvest Demo',
    status: 'COMPLETED',
  },
  harvest: {
    id: 'harvest_00001',
    cultivationId: 'cul_tilapia_harvest',
    harvestDate: '2026-09-23',
    numberHarvested: 470,
    totalHarvestWeight: { value: 169.2, unit: 'KG' },
    averageFishWeight: { value: 360, unit: 'G' },
    sellingPricePerKg: { amountMinor: 12000, currency: 'PHP' },
    notes: 'Harvest completed and weighed.',
    estimatedRevenue: { amountMinor: 2030400, currency: 'PHP' },
    createdAt: '2026-09-23T06:00:00Z',
    recordedBy: juan,
  },
  summary: {
    cultureDurationDays: 150,
    fingerlingsStocked: 500,
    fishHarvested: 470,
    recordedMortality: 30,
    survivalRatePercent: 94,
    totalHarvestWeight: { value: 169.2, unit: 'KG' },
    estimatedFeedUsed: { value: 210, unit: 'KG' },
    estimatedExpenses: null,
    estimatedRevenue: { amountMinor: 2030400, currency: 'PHP' },
    isDemo: true,
  },
}
