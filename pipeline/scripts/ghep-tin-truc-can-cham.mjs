#!/usr/bin/env node
// ghep-tin-truc-can-cham.mjs — PL36 AC-10 (E10a): chấm luật gắn trục trên tập nhãn trục OP1 đóng băng.
//   --tep <tệp đóng băng> --bam <sha256 ghim> [--ra <tệp md>]
// So băm tệp với băm ghim (lệch → thoát 2, gọi tên tập); đọc nhãn người của lát; tính cận dưới Wilson 95% của tỉ lệ gắn trục đúng
// trong số bài máy gắn; thoát 3 khi OP1 dưới 0,95. GP chỉ báo số (Hỏi-1, Mạnh chốt 24/11). Ghi bảng từng bài sai cho người chấm.
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { bamDong } from "../label-dong-bang.mjs";
import { wilson } from "../lib/do-hang-ngay.mjs";
import { chuanTen, chuanTruc } from "../lib/ghep-tin-truc-can.mjs";

export const NGUONG = 0.95;
export const MA_HUT = 3;

/** Đọc tệp đóng băng và so băm ghim: lệch thì ném lỗi gọi tên tập. */
export function docTap(text, bamGhim) {
  const x = JSON.parse(text);
  const tinh = bamDong(x.dong);
  if (tinh !== x.sha256 || (bamGhim && tinh !== bamGhim)) throw new Error(`cham-truc: tập ${x.lat}-${x.seed} lệch băm (ghim ${bamGhim ?? x.sha256}, tính ${tinh})`);
  return x;
}

/**
 * Chấm từng bài: máy gắn trục `truc` của toà `toa`; nhãn người ghi trục `stack` (và toà `building` nếu có).
 * Nhãn người «không nêu trục» là máy gắn sai.
 * @param {object[]} dong dòng của tập đóng băng
 * @param {Map<string, {building?: string|null, stack?: string|null}>} nhan nhãn người theo ref_id
 */
export function chamTap(dong, nhan) {
  const sai = [], chuaNhan = [];
  let dung = 0;
  for (const d of dong) {
    const n = nhan.get(d.ref_id);
    if (!n) { chuaNhan.push(d.ref_id); continue; }
    const trucDung = n.stack != null && chuanTruc(n.stack) === chuanTruc(d.truc);
    const toaDung = !n.building || chuanTen(n.building) === chuanTen(d.toa);
    if (trucDung && toaDung) dung++;
    else sai.push({ ref_id: d.ref_id, ma: d.ma, toa: d.toa, truc_may: d.truc, truc_nguoi: n.stack ?? "không nêu", toa_nguoi: n.building ?? "-" });
  }
  const so = dong.length - chuaNhan.length;
  const w = wilson(dung, so);
  return { so_bai: dong.length, so_cham: so, dung, sai, chua_nhan: chuaNhan, wilson_thap: w?.thap ?? null, dat: Boolean(w && !chuaNhan.length && w.thap >= NGUONG) };
}

export function vietBaoCao(r, x) {
  const f = (v) => (v == null ? "—" : v.toFixed(3));
  return [
    `# Chấm gắn trục PL36 — tập ${x.lat}-${x.seed}`, "",
    `sha256 tập: \`${x.sha256}\``, "",
    "| Khu | Bài trong tập | Đã có nhãn | Máy gắn đúng | Cận dưới Wilson 95% | Ngưỡng | Kết luận |", "|---|---|---|---|---|---|---|",
    `| OP1 | ${r.so_bai} | ${r.so_cham} | ${r.dung} | ${f(r.wilson_thap)} | ${NGUONG} | ${r.dat ? "đạt" : r.chua_nhan.length ? "chưa đủ nhãn" : "hụt"} |`,
    "| GP | 0 | — | — | — | báo số | GP gần như không nêu mã căn (Hỏi-1) |", "",
    `## Bài máy gắn sai (${r.sai.length})`, "",
    "| ref_id | Mã căn nguyên văn | Toà | Trục máy gắn | Trục nhãn người | Toà nhãn người |", "|---|---|---|---|---|---|",
    ...r.sai.map((s) => `| ${s.ref_id} | ${s.ma ?? ""} | ${s.toa ?? ""} | ${s.truc_may ?? ""} | ${s.truc_nguoi} | ${s.toa_nguoi} |`),
    ...(r.chua_nhan.length ? ["", `Chưa có nhãn người: ${r.chua_nhan.length} bài.`] : []), "",
  ].join("\n");
}

async function main() {
  const a = process.argv.slice(2);
  const g = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  const tep = g("--tep");
  if (!tep) { console.error("lenh: --tep <tep dong bang> --bam <sha256> [--ra <tep md>]"); return 2; }
  let x;
  try { x = docTap(readFileSync(tep, "utf8"), g("--bam")); } catch (e) { console.error(e.message); return 2; }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on" });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT DISTINCT ON (i.ref_id, l.field) i.ref_id, l.field, CASE WHEN l.not_stated THEN NULL ELSE l.value END AS value
         FROM eval_label_items i JOIN eval_labels l ON l.item_id = i.item_id
        WHERE i.lat = $1 AND l.field IN ('building', 'stack') ORDER BY i.ref_id, l.field, l.labeled_at DESC`, [x.lat]);
    const nhan = new Map();
    for (const r of rows) (nhan.get(r.ref_id) ?? nhan.set(r.ref_id, {}).get(r.ref_id))[r.field] = r.value;
    const r = chamTap(x.dong, nhan);
    const md = vietBaoCao(r, x);
    const ra = g("--ra"); if (ra) writeFileSync(ra, md);
    console.log(md);
    return r.dat ? 0 : MA_HUT;
  } finally { await c.end(); }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = await main();
