import { addDays, dateInManila } from './dates.mjs'

// Weather alerts (contract §12 "Weather alerts", BLOCKERS D-11). The mock reads its forecast
// from the `weatherForecasts` fixture, with days counted from today, and evaluates it against
// the DEMO rows of `weatherAlertRules`. Nothing runs in the background: an alert is raised when
// Home, the notifications or the weather alerts are read, once per farm, location, kind and
// first day, and it keeps the figures of the forecast that raised it.

export const WEATHER_FORECAST_DAYS = 3

const DISCLAIMER =
  'A demo weather alert from a general forecast, not a warning for your pond. Check your water and fish, and follow local technical guidance.'

// The measure each rule reads from a forecast day, with the unit its values carry.
const MEASURES = {
  MAXIMUM_AIR_TEMPERATURE: { field: 'maximumAirTemperatureC', unit: 'CELSIUS' },
  MEAN_CLOUD_COVER: { field: 'meanCloudCoverPercent', unit: 'PERCENT' },
}

function normalise(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

// The farm's place, or null when it lacks a municipality or a province.
export function farmLocation(farm) {
  const municipality = String(farm?.municipality ?? '').trim()
  const province = String(farm?.province ?? '').trim()
  return municipality && province ? { municipality, province } : null
}

function locationKey(location) {
  return `${normalise(location.municipality)}|${normalise(location.province)}`
}

/**
 * The fixture forecast for `location` from `today`: `{ days: [{ date, ...measures }] }` for the
 * next `WEATHER_FORECAST_DAYS` days, or null when the fixture marks the place unreadable. A
 * place the fixture does not list reads as its fallback row.
 */
export function fixtureForecast(forecasts, location, today) {
  const row =
    forecasts.find(
      (candidate) =>
        !candidate.fallback &&
        normalise(candidate.municipality) === normalise(location.municipality) &&
        normalise(candidate.province) === normalise(location.province),
    ) ?? forecasts.find((candidate) => candidate.fallback)
  if (!row || row.unavailable) return null
  return {
    days: row.days
      .filter((day) => day.offset >= 0 && day.offset < WEATHER_FORECAST_DAYS)
      .sort((left, right) => left.offset - right.offset)
      .map(({ offset, ...measures }) => ({ date: addDays(today, offset), ...measures })),
  }
}

/**
 * The runs of consecutive forecast `days` on which `rule`'s measure reaches its threshold for
 * at least its minimum run, each as `{ periodStart, periodEnd, peak, severity }`.
 */
export function weatherPeriods(days, rule) {
  const { field } = MEASURES[rule.measure]
  const periods = []
  let run = []
  const close = () => {
    if (run.length >= rule.minimumConsecutiveDays) {
      const peak = Math.max(...run.map((day) => day[field]))
      periods.push({
        periodStart: run[0].date,
        periodEnd: run[run.length - 1].date,
        peak,
        severity: peak >= rule.warningFrom ? 'WARNING' : 'ADVISORY',
      })
    }
    run = []
  }
  for (const day of days) {
    if (typeof day[field] === 'number' && day[field] >= rule.advisoryFrom) run.push(day)
    else close()
  }
  close()
  return periods
}

function alertFor(rule, period, location, raisedAt, id) {
  const { unit } = MEASURES[rule.measure]
  const peakText = unit === 'CELSIUS' ? `${period.peak} °C` : `${period.peak}%`
  return {
    id,
    kind: rule.kind,
    severity: period.severity,
    location,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    peak: { value: period.peak, unit },
    threshold: { value: rule.advisoryFrom, unit },
    title: rule.title,
    message: `${location.municipality}: ${rule.summary} (up to ${peakText}).`,
    explanation: rule.explanation,
    actions: rule.actions,
    raisedAt,
    basis: rule.basis,
    isDemo: rule.sourceStatus !== 'VERIFIED',
    sourceStatus: rule.sourceStatus,
    ruleVersion: rule.ruleVersion,
    disclaimer: DISCLAIMER,
  }
}

// A stored alert without the keys that tie it to its owner, as the contract publishes it.
function publicAlert(stored) {
  const alert = { ...stored }
  delete alert.ownerUserId
  delete alert.farmId
  delete alert.locationKey
  return alert
}

function slug(value) {
  return normalise(value).replace(/[^0-9a-z]+/g, '-')
}

/**
 * Raises the weather alerts the forecast calls for on `user`'s farm at `now` (an RFC 3339
 * instant), each with its WEATHER_ALERT notification, and answers the contract's
 * WeatherAlerts for that farm.
 */
export function raiseWeatherAlerts(db, { user, now }) {
  const today = dateInManila(now)
  const farm = db.get('farms').find({ ownerUserId: user.id }).value()
  const location = farmLocation(farm)
  if (!location) {
    return {
      status: 'LOCATION_MISSING',
      location: null,
      forecastDays: WEATHER_FORECAST_DAYS,
      checkedAt: null,
      alerts: [],
      message:
        "Add your farm's municipality and province in your profile to get alerts about hot or cloudy days ahead.",
    }
  }

  const key = locationKey(location)
  const forecast = fixtureForecast(db.get('weatherForecasts').value() ?? [], location, today)
  if (forecast) {
    const rules = db
      .get('weatherAlertRules')
      .filter((rule) => rule.active)
      .value()
    for (const rule of rules) {
      for (const period of weatherPeriods(forecast.days, rule)) {
        const decided = db
          .get('weatherAlerts')
          .find({
            farmId: farm.id,
            locationKey: key,
            kind: rule.kind,
            periodStart: period.periodStart,
          })
          .value()
        if (decided) continue
        const id = `wal_${farm.id}_${slug(location.municipality)}_${rule.kind.toLowerCase()}_${period.periodStart.replaceAll('-', '')}`
        const alert = alertFor(rule, period, location, now, id)
        db.get('weatherAlerts')
          .push({ ...alert, ownerUserId: user.id, farmId: farm.id, locationKey: key })
          .write()
        db.get('notifications')
          .push({
            id: `ntf_weather_${id.slice('wal_'.length)}`,
            ownerUserId: user.id,
            category: 'CULTIVATION',
            type: 'WEATHER_ALERT',
            title: alert.title,
            message: alert.message,
            recommendedAmount: null,
            occurredAt: now,
            readAt: null,
            action: null,
            cultivationId: null,
            orderId: null,
            taskId: null,
            reminder: null,
            weatherAlert: alert,
          })
          .write()
      }
    }
  }

  const alerts = db
    .get('weatherAlerts')
    .filter(
      (alert) => alert.farmId === farm.id && alert.locationKey === key && alert.periodEnd >= today,
    )
    .value()
    .sort(
      (left, right) =>
        left.periodStart.localeCompare(right.periodStart) || left.kind.localeCompare(right.kind),
    )
    .map(publicAlert)

  const place = location.municipality
  let message
  if (!forecast) {
    message = `We could not read the weather forecast for ${place} right now. Try again later.`
  } else if (alerts.length) {
    message = `Weather to watch in ${place} over the next ${WEATHER_FORECAST_DAYS} days.`
  } else {
    message = `No hot or cloudy spells are forecast for ${place} in the next ${WEATHER_FORECAST_DAYS} days.`
  }
  return {
    status: forecast ? 'AVAILABLE' : 'FORECAST_UNAVAILABLE',
    location,
    forecastDays: WEATHER_FORECAST_DAYS,
    checkedAt: forecast ? now : null,
    alerts,
    message,
  }
}
