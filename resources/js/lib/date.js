export const APP_LOCALE = "id-ID";   
export const APP_TIMEZONE = "Asia/Jakarta";

const dateFmt = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFmt = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Format ISO string → e.g. 05/10/2025 (in APP_TIMEZONE) */
export function fmtDate(iso) {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso));
}

/** Format ISO string → e.g. 05/10/2025, 14.30 (in APP_TIMEZONE) */
export function fmtDateTime(iso) {
  if (!iso) return "—";
  return dateTimeFmt.format(new Date(iso));
}

/** Format to time only → e.g. 14.30 (in APP_TIMEZONE) */
export function fmtTime(iso) {
  if (!iso) return "—";
  const t = new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return t.format(new Date(iso));
}

/**
 * Convert ISO (UTC or with offset) to value for <input type="datetime-local">
 * Example output: "2025-10-05T21:20"
 * NOTE: This uses the user's local browser time (no timezone label).
 */
export function isoToInputLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/**
 * Convert <input type="datetime-local"> value to ISO string (UTC).
 * inputLocal: "2025-10-05T21:20" → "2025-10-05T14:20:00.000Z" (depends on user TZ)
 * If you want to “treat it as APP_TIMEZONE” regardless of user device TZ,
 * use `inputLocalToIsoAssumingAppTz` below.
 */
export function inputLocalToIso(inputLocal) {
  if (!inputLocal) return null;
  const d = new Date(inputLocal);
  return d.toISOString();
}

/**
 * Interpret the local input value as APP_TIMEZONE and return an ISO string.
 * This avoids “user device TZ” affecting stored value. Good when your business
 * timezone is fixed (frontdesk in Jakarta, etc).
 */
export function inputLocalToIsoAssumingAppTz(inputLocal) {
  if (!inputLocal) return null;

  // Parse "YYYY-MM-DDTHH:mm"
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(inputLocal);
  if (!m) return null;
  const [_, y, mo, d, h, mi] = m.map(Number);

  // Get offset for APP_TIMEZONE at that moment using Intl (hacky but effective)
  // Build a Date in UTC first, then compute the tz offset by comparing formats.
  const dateInUtc = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));

  // Format the UTC date in APP_TIMEZONE to get the “wall clock” time parts
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(dateInUtc)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});

  // We want the instant where APP_TIMEZONE wall clock == input value.
  // Find the offset between what Intl thinks and our input, and adjust.
  const want = Date.UTC(y, mo - 1, d, h, mi, 0);
  const got = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    0
  );

  // Shift dateInUtc by the diff so that its formatted parts match inputLocal
  const adjusted = new Date(dateInUtc.getTime() + (want - got));
  return adjusted.toISOString();
}

function partsFromISOInTz(iso, tz = APP_TIMEZONE) {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(d);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    y: get("year"),
    M: get("month"),
    d: get("day"),
    h: get("hour"),
    m: get("minute"),
    s: get("second"),
    str: `${get("year")}-${String(get("month")).padStart(2, "0")}-${String(get("day")).padStart(2, "0")} ${String(get("hour")).padStart(2, "0")}:${String(get("minute")).padStart(2, "0")}:${String(get("second")).padStart(2, "0")}`,
  };
}

function compareParts(a, b) {
  const A = [a.y, a.M, a.d, a.h, a.m, a.s];
  const B = [b.y, b.M, b.d, b.h, b.m, b.s];
  for (let i = 0; i < A.length; i++) {
    if (A[i] !== B[i]) return A[i] - B[i];
  }
  return 0;
}

// Apakah ISO `iso` lebih “akhir” daripada sekarang menurut zona hotel?
export function isAfterNowInTz(iso, tz = APP_TIMEZONE) {
  const now = new Date();
  const nowParts = partsFromISOInTz(now.toISOString(), tz);
  const targetParts = partsFromISOInTz(iso, tz);
  if (!nowParts || !targetParts) return false;
  return compareParts(targetParts, nowParts) > 0;
}
