export function computeDurationMinutes(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): number {
  if (!startDate || !startTime || !endDate || !endTime) return 0;
  try {
    const s = new Date(`${startDate}T${startTime}:00`);
    const e = new Date(`${endDate}T${endTime}:00`);
    const diff = e.getTime() - s.getTime();
    if (isNaN(diff) || diff <= 0) return 0;
    return Math.round(diff / 60000);
  } catch {
    return 0;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  return `${h} Std. ${String(m).padStart(2, '0')} Min.`;
}
