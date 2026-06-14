/**
 * Datetime display helpers — always render in Asia/Ho_Chi_Minh (ICT), independent
 * of the runtime's timezone, so server (SSR) and client format identically.
 *
 * Storage stays in UTC / absolute instants; this is presentation only.
 */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format an instant as date + time in ICT, e.g. "14/06/2026 17:00". */
export function formatDateTimeICT(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : "";
}

/** Format an instant as date only in ICT, e.g. "14/06/2026". */
export function formatDateICT(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateFmt.format(d) : "";
}
