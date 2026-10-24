// last-log-line.mjs — «Dòng log cuối» của một job là dòng có nghĩa cuối cùng (ON2, OPS-19).
// Node in cảnh báo (DeprecationWarning…) ra stderr SAU dòng kết quả của job; launchd gộp stderr vào cùng tệp log, nên
// dòng cuối thô thường là «(Use `node --trace-deprecation ...`)». Bản chép: app/src/lib/last-log-line.ts — giữ hai bản
// cùng luật (pipeline/scripts/last-log-line.test.mjs đo cả hai trên một ma trận).
import { readFile, stat } from "node:fs/promises";

// Cảnh báo của chính Node: «(node:<pid>) [DEP0040] DeprecationWarning: …» và dòng gợi ý «(Use `node --trace-…`».
const NODE_NOISE = [/^\(node:\d+\) (\[[A-Z]+\d+\] )?\w*Warning\b/, /^\(Use `node --trace-/];

/** Dòng không rỗng cuối cùng không phải cảnh báo Node; chỉ có cảnh báo hoặc rỗng → null. */
export function lastMeaningfulLine(text) {
  const lines = text.split("\n").filter((l) => l.trim() && !NODE_NOISE.some((re) => re.test(l.trim())));
  return lines.at(-1) ?? null;
}

/** Mốc sửa tệp + dòng có nghĩa cuối (cắt 140 ký tự); tệp vắng/không đọc được → cả hai null. */
export async function tailLog(file) {
  try {
    const st = await stat(file);
    const line = lastMeaningfulLine(await readFile(file, "utf8"));
    return { lastLogAt: st.mtime.toISOString(), lastLine: line?.slice(0, 140) ?? null };
  } catch {
    return { lastLogAt: null, lastLine: null };
  }
}
