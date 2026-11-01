/**
 * IST (Asia/Kolkata, UTC+5:30) date helpers.
 * All daily counters and topics reset at midnight IST.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns current IST date string formatted as YYYY-MM-DD.
 */
export function getISTDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Returns seconds remaining until the next midnight IST.
 */
export function getSecondsUntilISTMidnight(date: Date = new Date()): number {
  const nowMs = date.getTime();
  const istMs = nowMs + IST_OFFSET_MS;
  const msIntoDay = istMs % MS_PER_DAY;
  const msLeft = MS_PER_DAY - msIntoDay;
  return Math.max(1, Math.floor(msLeft / 1000));
}

