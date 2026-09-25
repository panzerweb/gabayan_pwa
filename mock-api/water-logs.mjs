import { dateInManila } from './dates.mjs'

// Pro water-parameter logs and the feed conversion ratio (contract §9 "Water-parameter logs"
// and "Feed conversion"). Both are plain functions over rows the handlers have already read,
// so the seed's logs and a newly saved log are evaluated by the same code.

export const WATER_LOG_NOTES_LIMIT = 500

export const FEED_CONVERSION_RULE_VERSION = 'demo-2026-09-fcr'

const FEED_CONVERSION_DISCLAIMER =
  'Worked out from your own feeding and growth records and the estimated live fish. Missing feeding records or a sample that is not representative change the ratio; use it as a guide, not a measurement.'

const FEED_CONVERSION_BASIS = [
  'Feed recorded from the day of the first growth sample up to the day before the latest one',
  'Stock weight at each sample: average sample weight times the estimated live fish that day',
  'Estimated live fish are the fingerlings stocked less the mortality recorded by that day',
  'Fish that died are not counted as weight gained',
]

// Checks each entered reading against the values the contract accepts. `entered` maps a
// parameter code to its value, in parameter order; `fields` holds a message per bad reading
// and one for `readings` when nothing was entered.
export function parseWaterReadings(parameters, readings) {
  const entered = new Map()
  const fields = {}
  const values = readings && typeof readings === 'object' ? readings : {}
  for (const parameter of parameters) {
    const value = values[parameter.readingField]
    if (value === undefined || value === null) continue
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < parameter.inputMinimum ||
      value > parameter.inputMaximum
    ) {
      fields[`readings.${parameter.readingField}`] = [
        `Enter a number from ${parameter.inputMinimum} to ${parameter.inputMaximum}.`,
      ]
      continue
    }
    entered.set(parameter.code, value)
  }
  if (!entered.size && !Object.keys(fields).length)
    fields.readings = ['Enter at least one reading.']
  return { entered, fields }
}

// A reading equal to a bound is within the range.
export function readingStatus(row, value) {
  if (row.minimum !== null && value < row.minimum) return 'BELOW_RANGE'
  if (row.maximum !== null && value > row.maximum) return 'ABOVE_RANGE'
  return 'WITHIN_RANGE'
}

// The evaluated part of a water-parameter log: every reading field (null when not measured),
// one result per entered reading against the pairing's ranges, and the parameters passed
// over. `thresholds` is `[{ parameter, row }]` in parameter order.
export function evaluateWaterLog(parameters, thresholds, entered) {
  const readings = Object.fromEntries(
    parameters.map((parameter) => [parameter.readingField, entered.get(parameter.code) ?? null]),
  )
  const results = []
  const notLogged = []
  for (const { parameter, row } of thresholds) {
    if (!entered.has(parameter.code)) {
      notLogged.push(parameter.code)
      continue
    }
    const value = entered.get(parameter.code)
    results.push({
      parameter: parameter.code,
      name: parameter.name,
      unit: parameter.unit,
      value,
      minimum: row.minimum,
      maximum: row.maximum,
      status: readingStatus(row, value),
    })
  }
  return {
    readings,
    results,
    notLogged,
    outOfRangeCount: results.filter((result) => result.status !== 'WITHIN_RANGE').length,
    ruleVersion: thresholds[0]?.row.ruleVersion ?? 'demo-2026-09-gabayan',
  }
}

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function kilograms(quantity) {
  return quantity.unit === 'KG' ? quantity.value : quantity.value / 1000
}

function kg(value) {
  return { value: round(value), unit: 'KG' }
}

// Feed given over the weight the stock gained, or null when either figure cannot carry one.
function ratioOf(feedKg, gainKg) {
  return feedKg > 0 && gainKg > 0 ? round(feedKg / gainKg) : null
}

// Contract §9 FeedConversion for one cultivation, from its growth samples, mortality and
// feeding records (BLOCKERS D-23: calculated, never typed in). The period runs from the
// first sample to the latest; each pair of consecutive samples is one interval of history.
export function feedConversionFor({ cultivation, samples, mortality, feedings }) {
  const ordered = [...samples].sort((left, right) =>
    left.measuredOn.localeCompare(right.measuredOn),
  )
  const liveFishOn = (date) =>
    cultivation.initialFingerlings -
    mortality
      .filter((record) => record.occurredOn <= date)
      .reduce((total, record) => total + record.fishCount, 0)
  const biomassKg = (sample) => kilograms(sample.averageWeight) * liveFishOn(sample.measuredOn)
  const feedingsBetween = (from, to) =>
    feedings.filter((record) => {
      const day = dateInManila(record.fedAt)
      return day >= from && day < to
    })
  const feedKg = (records) => records.reduce((total, record) => total + kilograms(record.amount), 0)

  const intervals = ordered.slice(1).map((sample, index) => {
    const start = ordered[index]
    const feed = feedKg(feedingsBetween(start.measuredOn, sample.measuredOn))
    const gain = round(biomassKg(sample)) - round(biomassKg(start))
    return {
      periodStart: start.measuredOn,
      periodEnd: sample.measuredOn,
      feedGiven: kg(feed),
      biomassGain: kg(gain),
      ratio: ratioOf(round(feed), round(gain)),
    }
  })

  const first = ordered[0] ?? null
  const latest = ordered.length > 1 ? ordered[ordered.length - 1] : null
  const periodFeedings = latest ? feedingsBetween(first.measuredOn, latest.measuredOn) : []
  const startBiomass = latest ? round(biomassKg(first)) : null
  const endBiomass = latest ? round(biomassKg(latest)) : null
  const gain = latest ? round(endBiomass - startBiomass) : null
  const feed = latest ? round(feedKg(periodFeedings)) : null
  const ratio = latest ? ratioOf(feed, gain) : null

  let message
  if (!latest) {
    message =
      'Record at least two growth samples so the weight gained between them can be measured.'
  } else if (!periodFeedings.length) {
    message =
      'Record the feed you give between growth samples to see how well it turns into growth.'
  } else if (gain <= 0) {
    message = 'The growth samples show no weight gained yet, so there is no ratio to show.'
  } else {
    message = `About ${ratio} kg of feed went into each kilogram the stock gained.`
  }

  return {
    cultivationId: cultivation.id,
    status: ratio === null ? 'INSUFFICIENT_DATA' : 'CALCULATED',
    ratio,
    periodStart: latest ? first.measuredOn : null,
    periodEnd: latest ? latest.measuredOn : null,
    feedGiven: latest ? kg(feed) : null,
    startBiomass: latest ? kg(startBiomass) : null,
    endBiomass: latest ? kg(endBiomass) : null,
    biomassGain: latest ? kg(gain) : null,
    feedingRecordCount: periodFeedings.length,
    growthSampleCount: ordered.length,
    intervals,
    basis: FEED_CONVERSION_BASIS,
    message,
    isDemo: true,
    sourceStatus: 'DEMO',
    ruleVersion: FEED_CONVERSION_RULE_VERSION,
    disclaimer: FEED_CONVERSION_DISCLAIMER,
  }
}
