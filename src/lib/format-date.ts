export function formatMonthYear(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatLongDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
}
