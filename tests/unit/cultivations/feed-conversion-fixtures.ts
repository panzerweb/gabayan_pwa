import type { FeedConversion } from '@pages/cultivations/domain/cultivations.model'

const provenance = {
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-fcr',
  disclaimer:
    'Worked out from your own feeding and growth records and the estimated live fish. Missing feeding records or a sample that is not representative change the ratio; use it as a guide, not a measurement.',
} as const

const basis = [
  'Feed recorded from the day of the first growth sample up to the day before the latest one',
  'Stock weight at each sample: average sample weight times the estimated live fish that day',
  'Estimated live fish are the fingerlings stocked less the mortality recorded by that day',
  'Fish that died are not counted as weight gained',
]

// Tilapia Batch #001 as the mock seed answers it.
export const batch001Conversion: FeedConversion = {
  cultivationId: 'cul_tilapia_001',
  status: 'CALCULATED',
  ratio: 1.37,
  periodStart: '2026-08-21',
  periodEnd: '2026-09-21',
  feedGiven: { value: 90.5, unit: 'KG' },
  startBiomass: { value: 21, unit: 'KG' },
  endBiomass: { value: 87.3, unit: 'KG' },
  biomassGain: { value: 66.3, unit: 'KG' },
  feedingRecordCount: 4,
  growthSampleCount: 3,
  intervals: [
    {
      periodStart: '2026-08-21',
      periodEnd: '2026-09-06',
      feedGiven: { value: 42, unit: 'KG' },
      biomassGain: { value: 31.5, unit: 'KG' },
      ratio: 1.33,
    },
    {
      periodStart: '2026-09-06',
      periodEnd: '2026-09-21',
      feedGiven: { value: 48.5, unit: 'KG' },
      biomassGain: { value: 34.8, unit: 'KG' },
      ratio: 1.39,
    },
  ],
  basis,
  message: 'About 1.37 kg of feed went into each kilogram the stock gained.',
  ...provenance,
}

// A cultivation with one growth sample: no period to measure yet.
export const oneSampleConversion: FeedConversion = {
  cultivationId: 'cul_tilapia_harvest',
  status: 'INSUFFICIENT_DATA',
  ratio: null,
  periodStart: null,
  periodEnd: null,
  feedGiven: null,
  startBiomass: null,
  endBiomass: null,
  biomassGain: null,
  feedingRecordCount: 0,
  growthSampleCount: 1,
  intervals: [],
  basis,
  message: 'Record at least two growth samples so the weight gained between them can be measured.',
  ...provenance,
}
