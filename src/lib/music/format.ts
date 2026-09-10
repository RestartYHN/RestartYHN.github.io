export function formatClock(sec: number | null | undefined): string {
  const t = Number.isFinite(sec) ? Math.max(0, Math.floor(sec as number)) : 0;
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPlayedTime(ms: number | null | undefined, isEn: boolean): string {
  if (!ms) return "";
  const diff = Date.now() - Number(ms);
  if (diff <= 0) return isEn ? "just now" : "刚刚";
  const min = Math.floor(diff / 60000);
  if (min < 60) return isEn ? `${min}m ago` : `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return isEn ? `${hour}h ago` : `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  return isEn ? `${day}d ago` : `${day} 天前`;
}

// Truncate by visual width (CJK counts as 1, ASCII as 0.5).
export function cut(value: unknown, max = 12): string {
  const str = String(value || "");
  let width = 0;
  let i = 0;
  for (; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    const isWide =
      (c >= 0x2e80 && c <= 0x9fff) ||
      (c >= 0xac00 && c <= 0xd7af) ||
      (c >= 0x3040 && c <= 0x30ff) ||
      (c >= 0xff00 && c <= 0xffef) ||
      (c >= 0x4e00 && c <= 0xa000);
    width += isWide ? 1 : 0.5;
    if (width > max) break;
  }
  return i < str.length ? `${str.slice(0, i)}\u2026` : str;
}
