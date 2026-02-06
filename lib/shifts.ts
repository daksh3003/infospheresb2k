export const SHIFTS = [
  { name: "Night", start: 22 * 60, end: 6 * 60, startTime: "22:00", endTime: "06:00", spansMidnight: true },
  { name: "Evening", start: 18 * 60, end: 2 * 60, startTime: "18:00", endTime: "02:00", spansMidnight: true },
  { name: "Afternoon", start: 14 * 60, end: 22 * 60, startTime: "14:00", endTime: "22:00", spansMidnight: false },
  { name: "Middle", start: 11 * 60, end: 20 * 60, startTime: "11:00", endTime: "20:00", spansMidnight: false },
  { name: "General", start: 10 * 60, end: 19 * 60, startTime: "10:00", endTime: "19:00", spansMidnight: false },
];

export const SHIFT_NAMES = SHIFTS.map((s) => s.name);

export function getShiftByName(name: string) {
  return SHIFTS.find((s) => s.name === name) ?? null;
}

export function isShiftActive(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  return today >= start && today <= end;
}

export function isShiftExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  return today > end;
}
