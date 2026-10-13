// Calendar helpers in the device's local time zone. Never UTC: a reminder at 09:00 must show at 09:00.

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTHS_SHORT_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS_SHORT_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// The calendar starts on Sunday, the usual convention in Mexico.
export const WEEKDAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const pad = (value: number) => String(value).padStart(2, '0');

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isSameDay(a: Date, b: Date): boolean {
  return isSameMonth(a, b) && a.getDate() === b.getDate();
}

// "2026-10-05": a stable key to group reminders by local day.
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Weeks of seven cells, Sunday first. Null marks the empty slots around the month.
export function getMonthWeeks(monthStart: Date): (Date | null)[][] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array.from({ length: monthStart.getDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (Date | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function monthTitle(date: Date): string {
  const name = MONTHS_ES[date.getMonth()];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "12 de octubre"
export function formatLongDay(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

// "lun 12 oct"
export function formatShortDay(date: Date): string {
  return `${WEEKDAYS_SHORT_ES[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT_ES[date.getMonth()]}`;
}

export function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT_ES[date.getDay()];
}
