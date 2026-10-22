// context.ts — token budget + tool output offloading (chuẩn T2 harness survey:
// tool-call offloading: giữ head/tail, full vào trace)
export function offload(text: string, head = 300, tail = 200): string {
  if (text.length <= head + tail + 20) return text;
  return (
    text.slice(0, head) +
    `\n...[offloaded ${text.length - head - tail} chars — full trong trace]...\n` +
    text.slice(-tail)
  );
}

/** Đếm token gần đúng (VN ~2 token/ký tự, EN ~0.25) — chỉ cho budget guard. */
export function estimateTokens(text: string): number {
  const vnChars = (text.match(/[à-ỹá-úđ]/gi) ?? []).length;
  const otherChars = text.length - vnChars;
  return Math.ceil(vnChars * 2 + otherChars * 0.25);
}
