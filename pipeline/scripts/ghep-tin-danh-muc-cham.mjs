#!/usr/bin/env node
// ghep-tin-danh-muc-cham.mjs — PL20 (AC-9): chấm độ đúng của máy trên lát hai-khu-ghep-b, tính lại từ nhãn thô.
//   --cham <tệp đóng băng> [--ra <báo cáo.md>]       thoát 0 khi N1, N2 đạt
//   --cham <tệp đóng băng> --doi-chieu <báo cáo.md>  tính lại và đỏ khi số khác báo cáo
//   --cham <tệp đóng băng> --tien-do                 in tiến độ gắn nhãn, không kết luận
// Chỉ đọc DB. Máy gắn toà đúng khi người ghi đúng toà đó. Máy gắn vùng đúng khi người ghi đúng vùng đó, vùng con của nó, hay một toà
// nằm trong nó. Không quy được về danh bạ hoặc người ghi «không nêu» thì tính máy sai.
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { chuoiVung, khopTen } from "../lib/ghep-tin-danh-muc.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-danh-muc-doc.mjs";
import { wilsonDuoi } from "../lib/eval-classify.mjs";
import { LAT, docTepMau } from "./ghep-tin-danh-muc-lat-nhan.mjs";

export const CO_MAU = 110;
export const NGUONG = 0.95;
/** Nhóm phải đạt thì hàng mới đạt. N3 chưa chấm hay hụt thì D, G tắt và hàng vẫn xét tiếp. */
const NHOM_BAT_BUOC = ["n1", "n2"];
const NGUON_CUA_NHOM = { n1: ["A", "B"], n2: ["C", "F"], n3: ["D", "G"] };

/** Quy tên người gắn về nút của dự án. */
export function quyNhan({ building, subzone }, d) {
  const ra = {};
  for (const v of [building, subzone]) {
    const m = khopTen(v ?? "", d);
    if (m.muc === "toa" && !ra.toa) ra.toa = m.k;
    if (m.muc === "vung" && !ra.vung) ra.vung = m.k;
  }
  return ra;
}

export function chamBai(may, nhan, d) {
  if (may.muc === "toa") return nhan.toa === may.k;
  if (nhan.toa) return chuoiVung(d.vungCuaToa.get(nhan.toa), d).has(may.k);
  return nhan.vung !== undefined && chuoiVung(nhan.vung, d).has(may.k);
}

const cong = (o, k, dung) => { o[k] ??= { n: 0, dung: 0 }; o[k].n++; if (dung) o[k].dung++; };

/**
 * @param {{ dong: object[], nhan: Map<string, {labeler_id: string, building?: string, subzone?: string}[]>, danhBa: Map<string, object> }} vao
 */
export function chamLat({ dong, nhan, danhBa }) {
  const nhom = {};
  for (const n of Object.keys(NGUON_CUA_NHOM)) nhom[n] = { tong: 0, n: 0, dung: 0, sai: 0, chua_gan: 0, lech: [], theo_nguon: {}, theo_muc: {}, theo_khu: {} };
  for (const x of dong) {
    const g = nhom[x.stratum];
    g.tong++;
    const ds = nhan.get(x.ref_id) ?? [];
    if (!ds.length) { g.chua_gan++; continue; }
    const d = danhBa.get(String(x.du_an));
    const kq = ds.map((l) => chamBai(x, quyNhan(l, d), d));
    if (new Set(kq).size > 1) { g.lech.push(x.ref_id); continue; }
    g.n++; if (kq[0]) g.dung++; else g.sai++;
    cong(g.theo_nguon, x.nguon, kq[0]); cong(g.theo_muc, x.muc, kq[0]); cong(g.theo_khu, String(x.du_an), kq[0]);
  }
  for (const g of Object.values(nhom)) {
    g.wilson = g.n ? Number(wilsonDuoi(g.dung, g.n).toFixed(4)) : null;
    // 110 bài chỉ chịu được một bài sai: từ bài sai thứ hai là đã hụt, dừng gắn nhãn nhóm đó.
    g.trang = g.sai >= 2 ? "hut" : g.n < CO_MAU ? "chua-du" : g.wilson >= NGUONG ? "dat" : "hut";
  }
  const nguon_phai_tat = Object.entries(nhom).filter(([, g]) => g.trang !== "dat").flatMap(([n]) => NGUON_CUA_NHOM[n]);
  return { dat: NHOM_BAT_BUOC.every((n) => nhom[n].trang === "dat"), nguon_phai_tat, nhom };
}

/** So đầu ra của mã cuối với bản đóng băng; mỗi lỗi ghim mã bài. */
export function kiemDauRa(dong, ketQuaBai) {
  const loi = [];
  for (const x of dong) {
    const y = ketQuaBai.get(x.ref_id);
    if (!y || y.muc !== x.muc || String(y.k) !== String(x.k) || y.nguon !== x.nguon || y.rule_id !== x.rule_id) {
      loi.push(`dau-ra-khac ${x.ref_id}: dong bang ${x.nguon}/${x.muc}/${x.k}, ma cuoi ${y ? `${y.nguon ?? y.ly_do}/${y.muc ?? "-"}/${y.k ?? "-"}` : "khong con ket qua"}`);
    }
  }
  return loi;
}

const pt = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : "n/a");

/** Báo cáo cho người đọc, kèm khối số để lần sau đối chiếu. */
export function vietBaoCao(r, sha256) {
  const dong = ["# PL20 — Chấm độ đúng trên lát hai-khu-ghep-b", "", `Tệp đầu ra máy đóng băng: \`${sha256}\`. Ngưỡng: cận dưới Wilson 95% từ ${NGUONG}, mỗi nhóm ${CO_MAU} bài.`, "",
    `**Kết luận: ${r.dat ? "đạt" : "chưa đạt"}.** Nguồn phải tắt: ${r.nguon_phai_tat.join(", ") || "không có"}.`, "",
    "| Nhóm | Nguồn | Đã chấm | Đúng | Sai | Cận dưới Wilson | Trạng thái |", "|---|---|---:|---:|---:|---:|---|"];
  for (const [n, g] of Object.entries(r.nhom)) dong.push(`| ${n} | ${NGUON_CUA_NHOM[n].join(", ")} | ${g.n}/${g.tong} | ${g.dung} | ${g.sai} | ${g.wilson ?? "n/a"} | ${g.trang} |`);
  for (const [ten, khoa] of [["Theo nguồn", "theo_nguon"], ["Theo mức gắn", "theo_muc"], ["Theo khu", "theo_khu"]]) {
    dong.push("", `## ${ten}`, "", "| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |", "|---|---|---:|---:|---:|");
    for (const [n, g] of Object.entries(r.nhom)) for (const [k, v] of Object.entries(g[khoa])) dong.push(`| ${n} | ${k} | ${v.n} | ${v.dung} | ${pt(v.dung, v.n)} |`);
  }
  dong.push("", "## Số để đối chiếu", "", "```json", JSON.stringify(r), "```", "");
  return dong.join("\n");
}

/** Đọc lại khối số của báo cáo. */
export function docBaoCao(md) {
  const m = md.match(/```json\n(.+)\n```/);
  if (!m) throw new Error("cham: bao cao khong co khoi so");
  return JSON.parse(m[1]);
}

async function main() {
  const a = process.argv.slice(2);
  const lay = (k) => { const i = a.indexOf(k); return i < 0 ? undefined : a[i + 1]; };
  if (!lay("--cham")) { console.error("lenh: --cham <tep dong bang> [--ra <md> | --doi-chieu <md> | --tien-do]"); return 2; }
  const tep = docTepMau(lay("--cham")); // băm sai thì ném
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    const vao = await docDauVao(c, { offerIds: tep.dong.map((x) => x.offer_id) });
    const loi = kiemDauRa(tep.dong, tinhGan(vao).ketQuaBai);
    for (const l of loi.slice(0, 20)) console.error(`DO: ${l}`);
    if (loi.length) { console.error(`DO: ${loi.length} bai co dau ra khac ban dong bang`); return 1; }
    const { rows } = await c.query(
      `SELECT i.ref_id, l.labeler_id, l.field, CASE WHEN l.not_stated THEN NULL ELSE l.value END AS value
         FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1 AND l.field IN ('building', 'subzone')`, [LAT]);
    const theoNguoi = new Map();
    for (const r of rows) { const k = `${r.ref_id}|${r.labeler_id}`; const x = theoNguoi.get(k) ?? { ref_id: r.ref_id, labeler_id: r.labeler_id }; x[r.field] = r.value; theoNguoi.set(k, x); }
    const nhan = new Map();
    for (const x of theoNguoi.values()) nhan.set(x.ref_id, [...(nhan.get(x.ref_id) ?? []), x]);
    const r = chamLat({ dong: tep.dong, nhan, danhBa: vao.danhBa });
    for (const [n, g] of Object.entries(r.nhom)) console.log(`${n}: da cham ${g.n}/${g.tong} · dung ${g.dung} · sai ${g.sai} · wilson ${g.wilson ?? "n/a"} · ${g.trang}${g.sai >= 2 ? " · DUNG GAN NHAN NHOM NAY" : ""}`);
    if (a.includes("--tien-do")) return 0;
    if (lay("--doi-chieu")) {
      const cu = docBaoCao(readFileSync(lay("--doi-chieu"), "utf8"));
      if (JSON.stringify(cu) !== JSON.stringify(r)) { console.error("DO: so trong bao cao khac so tinh lai tu nhan tho"); return 1; }
      console.log("doi chieu: so trong bao cao khop");
    }
    if (lay("--ra")) writeFileSync(lay("--ra"), vietBaoCao(r, tep.sha256));
    console.log(r.dat ? `DAT · nguon phai tat: ${r.nguon_phai_tat.join(", ") || "khong"}` : "CHUA DAT");
    return r.dat ? 0 : 1;
  } finally {
    await c.end();
  }
}

const laChinh = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (laChinh) main().then((m) => { process.exitCode = m; }, (e) => { console.error(e.message ?? e); process.exitCode = 1; });
