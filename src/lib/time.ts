/** All church times are Lagos time (UTC+1, no daylight saving). */
const LAGOS_OFFSET_MIN = 60;

/** Parse "2026-12-06" or "2026-12-06T10:00" (Lagos) into a real instant. */
export function lagosToDate(s: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) throw new Error(`Bad date: ${s}`);
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  return new Date(utc - LAGOS_OFFSET_MIN * 60000);
}

/** When an event is over: its end, or 23:59 on its start day. */
export function endOf(ev: { start: string; end?: string }): Date {
  if (ev.end) return lagosToDate(ev.end.length === 10 ? `${ev.end}T23:59` : ev.end);
  return lagosToDate(`${ev.start.slice(0, 10)}T23:59`);
}

export function isOver(ev: { start: string; end?: string }, now = new Date()): boolean {
  return endOf(ev) < now;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', ...opts });
export const longDate = (s: string) => fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(lagosToDate(s));
export const shortDate = (s: string) => fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(lagosToDate(s));

/** ICS timestamp in UTC, e.g. 20261206T090000Z */
export const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
