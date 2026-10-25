// last-log-line.ts — «Dòng log cuối» của một job là dòng có nghĩa cuối cùng (ON2, OPS-19).
// Bản chép của pipeline/lib/last-log-line.mjs (dùng bởi push-ops-facts.mjs) — giữ hai bản cùng luật;
// pipeline/scripts/last-log-line.test.mjs đo cả hai trên một ma trận. TS thuần (không import) để Node nạp thẳng.

// Cảnh báo của chính Node: «(node:<pid>) [DEP0040] DeprecationWarning: …» và dòng gợi ý «(Use `node --trace-…`».
const NODE_NOISE = [/^\(node:\d+\) (\[[A-Z]+\d+\] )?\w*Warning\b/, /^\(Use `node --trace-/];

/** Dòng không rỗng cuối cùng không phải cảnh báo Node; chỉ có cảnh báo hoặc rỗng → null. */
export function lastMeaningfulLine(text: string): string | null {
  const lines = text.split("\n").filter((l) => l.trim() && !NODE_NOISE.some((re) => re.test(l.trim())));
  return lines.at(-1) ?? null;
}
