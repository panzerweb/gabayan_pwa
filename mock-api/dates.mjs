// Calendar helpers shared by the mock's handlers. Dates are `YYYY-MM-DD` strings; the farm's
// day is read in Asia/Manila, which keeps UTC+8 all year.

export function dateInManila(isoTimestamp) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoTimestamp))
}

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(fromIsoDate, toIsoDate) {
  return Math.round(
    (Date.parse(`${toIsoDate}T00:00:00Z`) - Date.parse(`${fromIsoDate}T00:00:00Z`)) / 86400000,
  )
}

// The UTC instant of a Manila wall-clock time (`HH:mm`) on `isoDate`.
export function manilaInstant(isoDate, timeOfDay) {
  return new Date(`${isoDate}T${timeOfDay}:00+08:00`).toISOString().replace('.000Z', 'Z')
}
