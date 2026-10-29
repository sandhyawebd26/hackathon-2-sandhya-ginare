export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    weekday: WEEKDAY[map.weekday] ?? 0,
  };
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let i = 0; i < 3; i += 1) {
    const parts = zonedParts(utc, timeZone);
    const asIf = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const desired = Date.UTC(year, month - 1, day, hour, minute);
    const diff = desired - asIf;
    if (diff === 0) break;
    utc = new Date(utc.getTime() + diff);
  }
  return utc;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function startOfZonedDay(date: Date, timeZone: string): Date {
  const parts = zonedParts(date, timeZone);
  return zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, timeZone);
}

export function dateKey(date: Date, timeZone: string): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function weekdayName(weekday: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday] ?? "Day";
}

export function eachOpenHour(
  from: Date,
  to: Date,
  timeZone: string,
  openingHour: number,
  closingHour: number,
): Date[] {
  const hours: Date[] = [];
  let cursor = startOfZonedDay(from, timeZone);
  const end = to.getTime();
  while (cursor.getTime() < end) {
    const parts = zonedParts(cursor, timeZone);
    for (let hour = openingHour; hour < closingHour; hour += 1) {
      const slot = zonedTimeToUtc(parts.year, parts.month, parts.day, hour, 0, timeZone);
      if (slot.getTime() >= from.getTime() && slot.getTime() < end) hours.push(slot);
    }
    cursor = addDays(cursor, 1);
  }
  return hours;
}

export function formatWhen(iso: string, timeZone: string, withWeekday = true): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: withWeekday ? "short" : undefined,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseFlexibleTimestamp(value: string, timeZone: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dmy = trimmed.match(
    /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/,
  );
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const hour = Number(dmy[4] ?? 12);
    const minute = Number(dmy[5] ?? 0);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return zonedTimeToUtc(year, month, day, hour, minute, timeZone).toISOString();
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}
