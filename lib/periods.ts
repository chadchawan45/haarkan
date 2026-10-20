/** Date-only helpers. Weeks are calculated from the group's configured start (0=Sunday). */
export function startOfWeek(date: Date, weekStartsOn: number): Date {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) throw new Error("วันเริ่มสัปดาห์ต้องอยู่ระหว่าง 0 ถึง 6");
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  result.setUTCDate(result.getUTCDate() - ((result.getUTCDay() - weekStartsOn + 7) % 7));
  return result;
}
export function endOfWeek(date: Date, weekStartsOn: number): Date { const start = startOfWeek(date, weekStartsOn); start.setUTCDate(start.getUTCDate() + 6); return start; }
