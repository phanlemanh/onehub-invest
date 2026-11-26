#!/usr/bin/env node
// do-phut-s4.mjs — lệnh đo đích của hồ sơ db-thu-tach-khoi-cum-that (AC-8): số lượt, trung vị và p75 của KHOẢNG CẤP s4 —
// phút từ một lần cấp s4 tới lần cấp (hoặc thu hồi) s4 kế, trong cửa sổ [--tu, --den]. Nhật ký đợt không ghi lần nhả, nên
// đây là cận trên của phút giữ khoá, sát phút giữ khi hàng chờ không rỗng. Lần cấp cuối cửa sổ (chưa có mốc kết) không tính.
// p75 theo hạng gần nhất (phần tử thứ ⌈0,75·n⌉). Chỉ đọc.
// Chạy: node scripts/do-phut-s4.mjs --tu <ISO> [--den <ISO>] [--tep <su-kien.jsonl>] [--json]
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const TEP_MAC_DINH = "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/su-kien.jsonl";

/** Đọc dòng sự kiện; dòng hỏng bỏ qua. */
export function docSuKien(noiDung) {
  const out = [];
  for (const l of noiDung.split("\n")) {
    if (!l.trim()) continue;
    try { out.push(JSON.parse(l)); } catch { /* dòng hỏng */ }
  }
  return out;
}

/** Khoảng cấp s4 (phút) trong cửa sổ. `tu`, `den`: chuỗi ISO hay null. */
export function khoangCap(suKien, { tu = null, den = null } = {}) {
  const t = (s) => Date.parse(s);
  const moc = suKien
    .filter((e) => e.tai_nguyen === "s4" && (e.loai === "cap" || e.loai === "thu-hoi") && typeof e.luc === "string")
    .filter((e) => (tu == null || t(e.luc) >= t(tu)) && (den == null || t(e.luc) <= t(den)))
    .sort((a, b) => t(a.luc) - t(b.luc));
  const phut = [];
  for (let i = 0; i < moc.length - 1; i++) {
    if (moc[i].loai !== "cap") continue;
    phut.push((t(moc[i + 1].luc) - t(moc[i].luc)) / 60000);
  }
  return phut;
}

/** { n, trung_vi, p75 } — n=0 thì không có số. */
export function thongKe(phut) {
  const a = [...phut].sort((x, y) => x - y);
  const n = a.length;
  if (!n) return { n: 0, trung_vi: null, p75: null };
  const trung_vi = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
  const p75 = a[Math.ceil(0.75 * n) - 1];
  return { n, trung_vi, p75 };
}

export function inDong({ n, trung_vi, p75 }) {
  if (!n) return "khoảng cấp s4: n=0 — cửa sổ không có lượt nào";
  return `khoảng cấp s4: n=${n} · trung vị ${Math.round(trung_vi)}′ · p75 ${Math.round(p75)}′`;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const tu = arg("--tu");
  if (!tu || Number.isNaN(Date.parse(tu))) { console.error("do-phut-s4: thiếu hay sai --tu <ISO>"); process.exit(2); }
  const den = arg("--den");
  if (den && Number.isNaN(Date.parse(den))) { console.error("do-phut-s4: sai --den <ISO>"); process.exit(2); }
  const tk = thongKe(khoangCap(docSuKien(readFileSync(arg("--tep") ?? TEP_MAC_DINH, "utf8")), { tu, den }));
  console.log(process.argv.includes("--json") ? JSON.stringify(tk) : inDong(tk));
}
