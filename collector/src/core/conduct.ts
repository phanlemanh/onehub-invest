/**
 * CCP — Collection Conduct Policy (ADR-0007): helpers thuần cho hành vi
 * "gần người" của collector. Pure functions để test được; scheduler wiring
 * sống ở scheduler.ts.
 */

/** Jitter ngẫu nhiên đều trong [minMs, maxMs] — tránh nhịp metronome. */
export function jitterMs(minMs = 2000, maxMs = 15000): number {
  if (minMs > maxMs) throw new Error(`jitterMs: min (${minMs}) > max (${maxMs})`);
  return minMs + Math.random() * (maxMs - minMs);
}

/**
 * Có nằm trong cửa sổ giờ hoạt động không. window "H1-H2" (giờ địa phương,
 * đóng-mở: [H1, H2)); "off" → luôn true (chạy tay / smoke test ban ngày).
 */
export function inActivityWindow(now = new Date(), window = "19-23"): boolean {
  if (window === "off") return true;
  const m = window.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) throw new Error(`inActivityWindow: window sai định dạng: ${window}`);
  const [lo, hi] = [Number(m[1]), Number(m[2])];
  const h = now.getHours();
  return h >= lo && h < hi;
}

/** Trạng thái ngân sách/ngày cho cap volume — ngày mới reset về 0 (giờ địa phương). */
export function dailyBudget(
  prev: { date: string; used: number } | undefined,
  now = new Date(),
): { date: string; used: number } {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  if (prev && prev.date === date) return { date, used: prev.used };
  return { date, used: 0 };
}
