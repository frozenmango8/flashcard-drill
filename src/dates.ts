export function todayISO(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = atNoon(iso);
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

export function daysBetween(from: string, to: string): number {
  const ms = atNoon(to).getTime() - atNoon(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDay(iso: string): string {
  return atNoon(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function atNoon(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12);
}
