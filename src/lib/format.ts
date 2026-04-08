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
