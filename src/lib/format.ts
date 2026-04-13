export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDateTime(value: string | Date, timeZone = 'America/Chicago'): string {
  const date = typeof value === 'string' ? new Date(value) : value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}

export function formatDateRange(start: string | Date, end: string | Date, timeZone = 'America/Chicago') {
  return `${formatDateTime(start, timeZone)} - ${formatDateTime(end, timeZone)}`
}

const TZ_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern',
  'America/Chicago': 'Central',
  'America/Denver': 'Mountain',
  'America/Phoenix': 'Mountain',
  'America/Los_Angeles': 'Pacific',
  'America/Anchorage': 'Alaska',
  'Pacific/Honolulu': 'Hawaii',
}

/**
 * Convert an IANA timezone (e.g. "America/Chicago") to a US-style label
 * ("Central"). Falls back to the IANA city name if unknown.
 */
export function formatTimezoneLabel(timeZone: string): string {
  if (TZ_LABELS[timeZone]) return TZ_LABELS[timeZone]
  return timeZone.replace(/^America\//, '').replace(/^Pacific\//, '').replace(/_/g, ' ')
}
