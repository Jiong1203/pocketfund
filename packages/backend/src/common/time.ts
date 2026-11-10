// PocketFund's calendar (cycle days, run dates, monthly reports) follows Taiwan time.
// Asia/Taipei has no daylight saving time, so a fixed UTC+8 offset is exact.
export const APP_TIME_ZONE = "Asia/Taipei";
const APP_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

export interface CalendarDay {
  /** YYYY-MM-DD in the app time zone. */
  isoDate: string;
  dayOfMonth: number;
  isLastDayOfMonth: boolean;
}

export function toAppCalendarDay(instant: Date): CalendarDay {
  const local = new Date(instant.getTime() + APP_UTC_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const dayOfMonth = local.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    isoDate: local.toISOString().slice(0, 10),
    dayOfMonth,
    isLastDayOfMonth: dayOfMonth === lastDayOfMonth
  };
}
