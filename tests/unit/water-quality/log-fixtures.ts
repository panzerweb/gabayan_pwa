import type {
  WaterLogReading,
  WaterParameterLog,
} from '@pages/water-quality/domain/water-quality.model'

const disclaimer =
  "Gabayan's recommendations are demo estimates and may vary based on water quality, climate, fish health, feed quality, management practices, and local conditions."

const ranges: Record<WaterLogReading['parameter'], Omit<WaterLogReading, 'value' | 'status'>> = {
  SALINITY: { parameter: 'SALINITY', name: 'Salinity', unit: 'PPT', minimum: null, maximum: 15 },
  PH: { parameter: 'PH', name: 'pH', unit: 'PH', minimum: 6.5, maximum: 8.5 },
  AMMONIA: { parameter: 'AMMONIA', name: 'Ammonia', unit: 'MG_PER_L', minimum: null, maximum: 0.5 },
  NITRITE: { parameter: 'NITRITE', name: 'Nitrite', unit: 'MG_PER_L', minimum: null, maximum: 0.5 },
  NITRATE: { parameter: 'NITRATE', name: 'Nitrate', unit: 'MG_PER_L', minimum: null, maximum: 50 },
  DISSOLVED_OXYGEN: {
    parameter: 'DISSOLVED_OXYGEN',
    name: 'Dissolved oxygen',
    unit: 'MG_PER_L',
    minimum: 3,
    maximum: null,
  },
  WATER_TEMPERATURE: {
    parameter: 'WATER_TEMPERATURE',
    name: 'Water temperature',
    unit: 'CELSIUS',
    minimum: 25,
    maximum: 32,
  },
}

const fields = {
  SALINITY: 'salinityPpt',
  PH: 'ph',
  AMMONIA: 'ammoniaMgL',
  NITRITE: 'nitriteMgL',
  NITRATE: 'nitrateMgL',
  DISSOLVED_OXYGEN: 'dissolvedOxygenMgL',
  WATER_TEMPERATURE: 'temperatureC',
} as const

type Values = Partial<Record<WaterLogReading['parameter'], number>>

// A Tilapia pond log evaluated as the mock evaluates it, against the seeded ranges.
export function waterLog(
  id: string,
  loggedAt: string,
  values: Values,
  notes: string | null = null,
) {
  const codes = Object.keys(ranges) as WaterLogReading['parameter'][]
  const results = codes.flatMap((code) => {
    const value = values[code]
    if (value === undefined) return []
    const range = ranges[code]
    const status: WaterLogReading['status'] =
      range.minimum !== null && value < range.minimum
        ? 'BELOW_RANGE'
        : range.maximum !== null && value > range.maximum
          ? 'ABOVE_RANGE'
          : 'WITHIN_RANGE'
    return [{ ...range, value, status }]
  })
  const log: WaterParameterLog = {
    id,
    cultivationId: 'cul_tilapia_001',
    loggedAt,
    readings: Object.fromEntries(
      codes.map((code) => [fields[code], values[code] ?? null]),
    ) as WaterParameterLog['readings'],
    results,
    notLogged: codes.filter((code) => values[code] === undefined),
    outOfRangeCount: results.filter((result) => result.status !== 'WITHIN_RANGE').length,
    notes,
    recordedBy: { id: 'usr_juan', fullName: 'Juan Dela Cruz' },
    createdAt: loggedAt,
    isDemo: true,
    sourceStatus: 'DEMO',
    ruleVersion: 'demo-2026-09-gabayan',
    disclaimer,
  }
  return log
}

// The three seeded logs of Tilapia Batch #001, newest first as the server lists them.
export const seededLogs: WaterParameterLog[] = [
  waterLog(
    'wlog_tilapia_003',
    '2026-09-21T22:00:00Z',
    {
      SALINITY: 0.5,
      PH: 7.6,
      AMMONIA: 0.4,
      NITRITE: 0.2,
      NITRATE: 18,
      DISSOLVED_OXYGEN: 2.6,
      WATER_TEMPERATURE: 30.5,
    },
    'Fish were gulping at the surface before sunrise.',
  ),
  waterLog(
    'wlog_tilapia_002',
    '2026-09-16T23:00:00Z',
    { PH: 7.8, AMMONIA: 0.8, NITRITE: 0.3, DISSOLVED_OXYGEN: 4.2, WATER_TEMPERATURE: 29 },
    'Water looked greener than last week.',
  ),
  waterLog(
    'wlog_tilapia_001',
    '2026-09-09T23:00:00Z',
    {
      SALINITY: 0.5,
      PH: 7.4,
      AMMONIA: 0.2,
      NITRITE: 0.1,
      NITRATE: 12,
      DISSOLVED_OXYGEN: 5.8,
      WATER_TEMPERATURE: 28.5,
    },
    'Morning reading with the freshwater test kit.',
  ),
]
