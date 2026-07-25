export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function staffName(staff: { user_id: string; display_name: string | null; email: string }[], userId: string | null): string {
  if (!userId) return "—";
  const s = staff.find((x) => x.user_id === userId);
  return s ? s.display_name || s.email : "Unknown";
}
