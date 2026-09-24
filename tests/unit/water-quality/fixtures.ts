import type {
  WaterSafetyCheck,
  WaterThreshold,
  WaterThresholdSet,
} from '@pages/water-quality/domain/water-quality.model'

const PLACEHOLDER =
  'Placeholder demo range, not taken from a reviewed source. Replace it before relying on it.'

const disclaimer =
  "Gabayan's recommendations are demo estimates and may vary based on water quality, climate, fish health, feed quality, management practices, and local conditions."

function threshold(
  parameter: WaterThreshold['parameter'],
  name: string,
  unit: WaterThreshold['unit'],
  minimum: number | null,
  maximum: number | null,
  explanation: string,
): WaterThreshold {
  return {
    parameter,
    name,
    unit,
    minimum,
    maximum,
    explanation,
    basis:
      parameter === 'DISSOLVED_OXYGEN'
        ? 'Critical under about 2.0-3.0 mg/L (UF/IFAS FA002).'
        : PLACEHOLDER,
    sourceStatus: 'DEMO',
    ruleVersion: 'demo-2026-09-gabayan',
  }
}

// Tilapia in a pond, as the mock seed holds it.
export const tilapiaPondThresholds: WaterThresholdSet = {
  speciesId: 'sp_tilapia',
  environmentId: 'env_pond',
  thresholds: [
    threshold('SALINITY', 'Salinity', 'PPT', null, 15, 'How salty the water is.'),
    threshold('PH', 'pH', 'PH', 6.5, 8.5, 'How acidic or alkaline the water is.'),
    threshold(
      'AMMONIA',
      'Ammonia',
      'MG_PER_L',
      null,
      0.5,
      'A waste that builds up from fish droppings and uneaten feed.',
    ),
    threshold('NITRITE', 'Nitrite', 'MG_PER_L', null, 0.5, 'Forms as ammonia breaks down.'),
    threshold('NITRATE', 'Nitrate', 'MG_PER_L', null, 50, 'The mildest stage of waste breakdown.'),
    threshold(
      'DISSOLVED_OXYGEN',
      'Dissolved oxygen',
      'MG_PER_L',
      3,
      null,
      'The oxygen in the water that stock breathe.',
    ),
    threshold(
      'WATER_TEMPERATURE',
      'Water temperature',
      'CELSIUS',
      25,
      32,
      'How warm the water is.',
    ),
  ],
  guidance: 'Check readings at about the same time each day.',
  sources: [
    {
      title: 'Dissolved Oxygen for Fish Production (FA002)',
      organization: 'University of Florida IFAS Extension',
      url: 'https://ask.ifas.ufl.edu/publication/FA002',
      reviewedAt: null,
      reviewedBy: null,
    },
  ],
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
  disclaimer,
}

// A check with high ammonia and a pH within range; the other five were not entered.
export const highAmmoniaCheck: WaterSafetyCheck = {
  speciesId: 'sp_tilapia',
  environmentId: 'env_pond',
  checkedAt: '2026-09-23T01:00:00Z',
  results: [
    {
      parameter: 'PH',
      name: 'pH',
      unit: 'PH',
      value: 7.2,
      minimum: 6.5,
      maximum: 8.5,
      status: 'WITHIN_RANGE',
      explanation: 'How acidic or alkaline the water is.',
      guidance: {
        severity: 'INFO',
        title: 'Within the suggested range',
        message: 'This reading sits inside the demo range.',
        sourceStatus: 'DEMO',
        ruleVersion: 'demo-2026-09-gabayan',
        disclaimer,
      },
    },
    {
      parameter: 'AMMONIA',
      name: 'Ammonia',
      unit: 'MG_PER_L',
      value: 1.2,
      minimum: null,
      maximum: 0.5,
      status: 'ABOVE_RANGE',
      explanation: 'A waste that builds up from fish droppings and uneaten feed.',
      guidance: {
        severity: 'ACTION',
        title: 'Ammonia is higher than suggested',
        message:
          'Feed less until it comes down. If your stock are gasping, consider changing part of the water where your setup allows it.',
        sourceStatus: 'DEMO',
        ruleVersion: 'demo-2026-09-gabayan',
        disclaimer,
      },
    },
  ],
  notChecked: ['SALINITY', 'NITRITE', 'NITRATE', 'DISSOLVED_OXYGEN', 'WATER_TEMPERATURE'],
  isDemo: true,
  sourceStatus: 'DEMO',
  ruleVersion: 'demo-2026-09-gabayan',
  disclaimer,
}
