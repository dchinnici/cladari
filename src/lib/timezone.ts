/**
 * Timezone Utilities
 *
 * Centralizes all date/time handling to ensure consistency across the app.
 * Currently hardcoded to America/New_York (Eastern Time with DST).
 *
 * Future: Read from user settings or detect from browser.
 */

// Default timezone - can be made configurable via settings later
export const APP_TIMEZONE = 'America/New_York';

/**
 * Get today's date as YYYY-MM-DD string in the app timezone
 * Use this instead of: new Date().toISOString().split('T')[0]
 */
export function getTodayString(timezone: string = APP_TIMEZONE): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  // en-CA locale gives YYYY-MM-DD format
}

/**
 * Get current datetime as ISO string adjusted for timezone
 * The date portion will reflect the local date, not UTC
 */
export function getNowISO(timezone: string = APP_TIMEZONE): string {
  const now = new Date();
  // Get the local date parts in the target timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

/**
 * Parse a date input (from form) and create a Date object at noon in the app timezone
 * This prevents off-by-one errors from midnight UTC conversion
 */
export function parseDateAtNoon(dateString: string, timezone: string = APP_TIMEZONE): Date {
  // dateString is YYYY-MM-DD from input[type="date"]
  // Create date at noon local time to avoid timezone boundary issues
  const [year, month, day] = dateString.split('-').map(Number);

  // Create a date string that includes time at noon
  const dateTimeString = `${dateString}T12:00:00`;

  // Get the timezone offset for this specific date (handles DST)
  const tempDate = new Date(dateTimeString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });

  // Parse the offset from the formatted string
  const formatted = formatter.format(tempDate);
  const offsetMatch = formatted.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);

  if (offsetMatch) {
    const offsetStr = offsetMatch[1];
    // Convert offset to ISO format and create proper date
    const isoString = `${dateString}T12:00:00${offsetStr.includes(':') ? offsetStr : offsetStr + ':00'}`;
    return new Date(isoString);
  }

  // Fallback: just use noon UTC (better than midnight)
  return new Date(`${dateString}T12:00:00Z`);
}

/**
 * Format a Date object for display in the app timezone
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  timezone: string = APP_TIMEZONE
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { ...options, timeZone: timezone });
}

/**
 * Format a Date object as YYYY-MM-DD for form inputs
 */
export function formatDateForInput(
  date: Date | string | number,
  timezone: string = APP_TIMEZONE
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Get relative time description (e.g., "2 days ago", "today")
 */
export function getRelativeTime(
  date: Date | string | number,
  timezone: string = APP_TIMEZONE
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const today = getTodayString(timezone);
  const dateStr = formatDateForInput(d, timezone);

  if (dateStr === today) return 'today';

  const todayDate = new Date(today + 'T12:00:00');
  const targetDate = new Date(dateStr + 'T12:00:00');
  const diffDays = Math.round((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'yesterday';
  if (diffDays === -1) return 'tomorrow';
  if (diffDays > 0) return `${diffDays} days ago`;
  return `in ${Math.abs(diffDays)} days`;
}

/**
 * Check if a date is today in the app timezone
 */
export function isToday(
  date: Date | string | number,
  timezone: string = APP_TIMEZONE
): boolean {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDateForInput(d, timezone) === getTodayString(timezone);
}

/**
 * Get days since a date (positive = past, negative = future)
 */
export function getDaysSince(
  date: Date | string | number,
  timezone: string = APP_TIMEZONE
): number {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const today = getTodayString(timezone);
  const dateStr = formatDateForInput(d, timezone);

  const todayDate = new Date(today + 'T12:00:00');
  const targetDate = new Date(dateStr + 'T12:00:00');

  return Math.round((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
}
