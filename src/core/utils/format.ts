export function formatPhp(amountMinor: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    amountMinor / 100,
  )
}

export function formatQuantity(value: number, unit: string, maximumFractionDigits = 2) {
  const label: Record<string, string> = {
    G: 'g',
    KG: 'kg',
    M: 'm',
    M2: 'm²',
    M3: 'm³',
    CELSIUS: '°C',
    COUNT: '',
    PERCENT: '%',
    PPT: 'ppt',
    MG_PER_L: 'mg/L',
    PH: 'pH',
  }
  return `${new Intl.NumberFormat('en-PH', { maximumFractionDigits }).format(value)}${unit === 'PERCENT' ? '' : ' '}${label[unit] ?? unit}`.trim()
}

export function formatManilaTime(timestamp: string) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatManilaDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

// The Asia/Manila calendar date (YYYY-MM-DD) of a timestamp.
export function manilaDateOf(timestamp: string | Date) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp))
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function manilaDateToday() {
  return manilaDateOf(new Date())
}
