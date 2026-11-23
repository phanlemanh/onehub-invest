#!/usr/bin/env node
// ghep-tin-danh-muc-cham.mjs — PL20 (AC-9): chấm độ đúng của máy trên lát hai-khu-ghep-b, tính lại từ nhãn thô.
//   --cham <tệp đóng băng> [--ra <báo cáo.md>]       thoát 0 khi cả N1, N2 đạt
//   --cham <tệp đóng băng> --doi-chieu <báo cáo.md>  tính lại và đỏ khi số khác báo cáo
//   --cham <tệp đóng băng> --tien-do                 in tiến độ gắn nhãn, không kết luận
//   thêm --nhap <csv>: tính tỉ lệ «Mạnh sửa nháp» theo nhóm (so nháp trợ lý với nhãn đã lưu trong DB)
//   vòng 2: --cham <tệp lát -b> --cham-n2 <tệp lát -c> --db-n1 <url bản chép>  n1 chấm lát -b trên bản chép lúc chấm vòng 1, n2 chấm
//           lát mới trên DATABASE_URL; mỗi lát so đầu ra mã cuối với tệp đóng băng của chính nó; --nhap-n2 <csv> cho sổ nháp lát mới
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
/** Hai nhóm đều phải đạt thì hàng mới đạt. Nguồn D, G đang tắt nên không có nhóm chấm. */
const NHOM_BAT_BUOC = ["n1", "n2"];
const NGUON_CUA_NHOM = { n1: ["A", "B"], n2: ["C", "F"] };

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
  // Danh bạ còn toà chưa có vùng: người ghi cả toà lẫn đúng vùng thì vẫn tính đúng.
  if (nhan.vung !== undefined && chuoiVung(nhan.vung, d).has(may.k)) return true;
  return nhan.toa !== undefined && chuoiVung(d.vungCuaToa.get(nhan.toa), d).has(may.k);
}

const cong = (o, k, dung) => { o[k] ??= { n: 0, dung: 0 }; o[k].n++; if (dung) o[k].dung++; };

/**
 * @param {{ dong: object[], nhan: Map<string, {labeler_id: string, building?: string, subzone?: string}[]>, danhBa: Map<string, object> }} vao
 */
export function chamLat({ dong, nhan, danhBa }) {
  const nhom = {};
  for (const n of Object.keys(NGUON_CUA_NHOM)) nhom[n] = { tong: 0, n: 0, dung: 0, sai: 0, chua_gan: 0, lech: [], ds_sai: [], theo_nguon: {}, theo_muc: {}, theo_khu: {} };
  for (const x of dong) {
    const g = nhom[x.stratum];
    g.tong++;
    const ds = nhan.get(x.ref_id) ?? [];
    if (!ds.length) { g.chua_gan++; continue; }
    const d = danhBa.get(String(x.du_an));
    const kq = ds.map((l) => chamBai(x, quyNhan(l, d), d));
    if (new Set(kq).size > 1) { g.lech.push(x.ref_id); continue; }
    g.n++; if (kq[0]) g.dung++; else g.sai++;
    // Bài máy sai giữ cách quy nhãn để người soát lỗ danh bạ trước khi kết luận.
    if (!kq[0]) g.ds_sai.push({ ref_id: x.ref_id, may: `${x.muc}/${x.k}`, nhan: ds.map((l) => ({ building: l.building ?? null, subzone: l.subzone ?? null, quy: quyNhan(l, d) })) });
    cong(g.theo_nguon, x.nguon, kq[0]); cong(g.theo_muc, x.muc, kq[0]); cong(g.theo_khu, String(x.du_an), kq[0]);
  }
  for (const g of Object.values(nhom)) {
    g.wilson = g.n ? Number(wilsonDuoi(g.dung, g.n).toFixed(4)) : null;
    // 110 bài chỉ chịu được một bài sai: từ bài sai thứ hai là đã hụt, dừng gắn nhãn nhóm đó.
    g.trang = g.sai >= 2 ? "hut" : g.n < CO_MAU ? "chua-du" : g.wilson >= NGUONG ? "dat" : "hut";
  }
  return ketLuan(nhom);
}

function ketLuan(nhom) {
  const nguon_phai_tat = Object.entries(nhom).filter(([, g]) => g.trang !== "dat").flatMap(([n]) => NGUON_CUA_NHOM[n]);
  return { dat: NHOM_BAT_BUOC.every((n) => nhom[n].trang === "dat"), nguon_phai_tat, nhom };
}

/**
 * Vòng 2 AC-9: n1 chấm trên lát vòng 1, n2 trên lát mới. Mỗi nhóm lấy từ lượt chấm của chính lát nó, ngưỡng và cỡ mẫu không đổi.
 * @param {object} n1 nhóm n1 của lượt chấm lát vòng 1 · @param {object} n2 nhóm n2 của lượt chấm lát mới
 */
export function gopKetQua(n1, n2) {
  return ketLuan({ n1, n2 });
}

/** Đọc sổ nháp của trợ lý (CSV, dòng «#» là chú thích): item_id → ô toà, ô khu và cờ Mạnh tự quyết. */
export function docNhap(text) {
  const dong = [];
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const f = []; let cur = "", q = false;
    for (const ch of line) { if (ch === '"') { q = !q; continue; } if (ch === "," && !q) { f.push(cur); cur = ""; continue; } cur += ch; }
    f.push(cur); dong.push(f);
  }
  const [h, ...r] = dong;
  const c = (k) => h.indexOf(k);
  const m = new Map();
  if (c("o") >= 0 && c("tro_ly_de_xuat") >= 0) return docNhapDai(r, c, m);
  for (const f of r) {
    // «(KO)» là nháp «không nêu»; ô có «(Mạnh …» là Mạnh tự quyết ô đó, không tính là giữ nháp.
    const o = (v) => ((v ?? "").trim() === "(KO)" ? "" : (v ?? ""));
    const toa = o(f[c("de_xuat_toa")]), khu = o(f[c("de_xuat_khu")]);
    const sua = f[c("manh_sua")] ?? "";
    // Cách gắn đọc từ cột ghi chú của sổ: trợ lý lưu trước lời duyệt (Mạnh duyệt hồi tố), lưu sau lời duyệt lô, còn lại Mạnh từng thẻ.
    const loai = /trước lời duyệt|hồi tố/.test(sua) ? "luu-truoc-duyet-hoi-to" : /sau duyệt lô/.test(sua) ? "duyet-lo-truoc-luu" : "manh-tung-the";
    const gio = sua.match(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ/g);
    m.set(f[c("item_id")], { toa, khu, tu_quyet: /\(Mạnh/.test(toa) || /\(Mạnh/.test(khu), loai, gio_duyet: gio ? gio[gio.length - 1] : null });
  }
  return m;
}

/**
 * Sổ dạng dài (lát hai-khu-ghep-c): một dòng một ô, đề xuất «giá trị (Căn cứ)», «KO» là không nêu. Ô thẻ cài ghi giá trị cài ở
 * cột đề xuất và «thẻ cài» ở cột kết quả: bài đó đếm riêng là thẻ cài, không tính vào giữ hay sửa nháp.
 */
function docNhapDai(r, c, m) {
  const gt = (v) => { const s = (v ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim(); return s === "KO" ? "" : s; };
  for (const f of r) {
    const o = f[c("o")];
    if (o !== "building" && o !== "subzone") continue;
    const id = f[c("item_id")], kq = f[c("ket_qua_Manh")] ?? "";
    const x = m.get(id) ?? { toa: "", khu: "", tu_quyet: false, the_cai: false, loai: "manh-tung-the", gio_duyet: null };
    x[o === "building" ? "toa" : "khu"] = gt(f[c("tro_ly_de_xuat")]);
    if (/thẻ cài/.test(kq)) x.the_cai = true;
    if (/Mạnh (tự|sửa)/.test(kq)) x.tu_quyet = true;
    if (/sau «Duyệt lô/.test(kq)) x.loai = "duyet-lo-truoc-luu";
    const gio = kq.match(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ/g);
    if (gio) x.gio_duyet = gio[gio.length - 1];
    m.set(id, x);
  }
  return m;
}

const chuan = (v) => (v ?? "").trim().toLowerCase();

/** Tỉ lệ Mạnh sửa nháp theo nhóm: so ô nháp với nhãn đã lưu trong DB, không tin cột tự khai của sổ. */
export function tiLeSua({ dong, nhan, nhap }) {
  const ra = {};
  for (const n of Object.keys(NGUON_CUA_NHOM)) ra[n] = { co_nhap: 0, giu: 0, sua: 0, tu_quyet: 0, ds_sua: [], ds_tu_quyet: [] };
  for (const x of dong) {
    const g = ra[x.stratum];
    for (const l of nhan.get(x.ref_id) ?? []) {
      const p = nhap.get(String(l.item_id));
      if (!p) { g.khong_nhap = (g.khong_nhap ?? 0) + 1; continue; }
      g.co_nhap++;
      if (p.the_cai) { g.the_cai = (g.the_cai ?? 0) + 1; continue; }
      if (p.tu_quyet) { g.tu_quyet++; g.ds_tu_quyet.push(x.ref_id); continue; }
      if (chuan(p.toa) === chuan(l.building) && chuan(p.khu) === chuan(l.subzone)) g.giu++;
      else { g.sua++; g.ds_sua.push(x.ref_id); }
    }
  }
  return ra;
}

export const LOAI_THE = ["manh-tung-the", "duyet-lo-truoc-luu", "luu-truoc-duyet-hoi-to"];

/** Số chấm theo cách gắn thẻ; ghim bài có giờ lưu (eval_labels.labeled_at) sớm hơn giờ duyệt ghi trong sổ. */
export function tachLoaiThe({ dong, nhan, nhap, danhBa }) {
  const ra = {};
  for (const n of Object.keys(NGUON_CUA_NHOM)) { ra[n] = {}; for (const l of LOAI_THE) ra[n][l] = { n: 0, dung: 0, ds: [], luu_truoc_gio_duyet: [] }; }
  for (const x of dong) {
    const ds = nhan.get(x.ref_id) ?? [];
    if (ds.length !== 1) continue; // chưa gắn hoặc nhiều người: chamLat đã báo
    const l = ds[0], p = nhap.get(String(l.item_id));
    const o = ra[x.stratum][p?.loai ?? "manh-tung-the"];
    const d = danhBa.get(String(x.du_an));
    o.n++; o.ds.push(x.ref_id);
    if (chamBai(x, quyNhan(l, d), d)) o.dung++;
    if (p?.gio_duyet && l.labeled_at && new Date(l.labeled_at) < new Date(p.gio_duyet)) o.luu_truoc_gio_duyet.push(x.ref_id);
  }
  return ra;
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
  const dong = [`# PL20 — Chấm độ đúng trên lát ${r.lat ?? LAT}`, "", `Tệp đầu ra máy đóng băng: ${r.tep ?? `\`${sha256}\``}. Ngưỡng: cận dưới Wilson 95% từ ${NGUONG}, mỗi nhóm ${CO_MAU} bài.`, "",
    `**Kết luận: ${r.dat ? "đạt" : "chưa đạt"}.** Nguồn phải tắt: ${r.nguon_phai_tat.join(", ") || "không có"}.`, "",
    "| Nhóm | Nguồn | Đã chấm | Đúng | Sai | Cận dưới Wilson | Trạng thái |", "|---|---|---:|---:|---:|---:|---|"];
  for (const [n, g] of Object.entries(r.nhom)) dong.push(`| ${n} | ${NGUON_CUA_NHOM[n].join(", ")} | ${g.n}/${g.tong} | ${g.dung} | ${g.sai} | ${g.wilson ?? "n/a"} | ${g.trang} |`);
  for (const [ten, khoa] of [["Theo nguồn", "theo_nguon"], ["Theo mức gắn", "theo_muc"], ["Theo khu", "theo_khu"]]) {
    dong.push("", `## ${ten}`, "", "| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |", "|---|---|---:|---:|---:|");
    for (const [n, g] of Object.entries(r.nhom)) for (const [k, v] of Object.entries(g[khoa])) dong.push(`| ${n} | ${k} | ${v.n} | ${v.dung} | ${pt(v.dung, v.n)} |`);
  }
  dong.push("", "## Bài máy sai — soát lỗ danh bạ trước khi kết luận", "", "| Nhóm | Bài | Máy gắn | Người ghi (toà · khu) | Quy về danh bạ |", "|---|---|---|---|---|");
  const quyChu = (q) => (q.toa || q.vung ? [q.toa && `toa=${q.toa}`, q.vung && `vung=${q.vung}`].filter(Boolean).join(" ") : "không quy được");
  for (const [n, g] of Object.entries(r.nhom)) for (const s of g.ds_sai) for (const l of s.nhan) dong.push(`| ${n} | ${s.ref_id} | ${s.may} | ${l.building ?? "—"} · ${l.subzone ?? "—"} | ${quyChu(l.quy)} |`);
  if (r.sua_nhap) {
    dong.push("", "## Mạnh sửa nháp của trợ lý", "", "| Nhóm | Có nháp | Giữ nguyên | Sửa | Mạnh tự quyết | Thẻ cài (đếm riêng) | Tỉ lệ sửa (trừ thẻ cài) |", "|---|---:|---:|---:|---:|---:|---:|");
    for (const [n, t] of Object.entries(r.sua_nhap)) dong.push(`| ${n} | ${t.co_nhap} | ${t.giu} | ${t.sua} | ${t.tu_quyet} | ${t.the_cai ?? 0} | ${pt(t.sua + t.tu_quyet, t.co_nhap - (t.the_cai ?? 0))} |`);
  }
  if (r.loai_the) {
    dong.push("", "## Số theo cách gắn thẻ", "", "| Nhóm | Cách gắn | Bài | Đúng | Tỉ lệ | Lưu trước giờ duyệt |", "|---|---|---:|---:|---:|---|");
    for (const [n, o] of Object.entries(r.loai_the)) for (const [l, v] of Object.entries(o)) if (v.n) dong.push(`| ${n} | ${l} | ${v.n} | ${v.dung} | ${pt(v.dung, v.n)} | ${v.luu_truoc_gio_duyet.join(", ") || "—"} |`);
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

/** Đọc một lát: đầu ra mã cuối phải khớp tệp đóng băng trên các bài của nhóm được chấm, rồi lấy nhãn thô của lát. */
async function docLat(c, tep, { lat, nhom }) {
  const dong = tep.dong.filter((x) => !nhom || x.stratum === nhom);
  const vao = await docDauVao(c, { offerIds: dong.map((x) => x.offer_id) });
  const loi = kiemDauRa(dong, tinhGan(vao).ketQuaBai);
  const { rows } = await c.query(
    `SELECT i.ref_id, i.item_id, l.labeler_id, l.field, CASE WHEN l.not_stated THEN NULL ELSE l.value END AS value, l.labeled_at
       FROM eval_labels l JOIN eval_label_items i USING (item_id) WHERE i.lat = $1 AND l.field IN ('building', 'subzone')`, [lat]);
  const theoNguoi = new Map();
  for (const r of rows) { const k = `${r.ref_id}|${r.labeler_id}`; const x = theoNguoi.get(k) ?? { ref_id: r.ref_id, item_id: r.item_id, labeler_id: r.labeler_id }; x[r.field] = r.value; if (r.labeled_at && (!x.labeled_at || r.labeled_at > x.labeled_at)) x.labeled_at = r.labeled_at; theoNguoi.set(k, x); }
  const nhan = new Map();
  for (const x of theoNguoi.values()) nhan.set(x.ref_id, [...(nhan.get(x.ref_id) ?? []), x]);
  return { dong, nhan, danhBa: vao.danhBa, loi };
}

const moDb = async (url) => { const c = new pg.Client({ connectionString: url }); await c.connect(); await c.query("SET default_transaction_read_only = on"); return c; };

async function main() {
  const a = process.argv.slice(2);
  const lay = (k) => { const i = a.indexOf(k); return i < 0 ? undefined : a[i + 1]; };
  if (!lay("--cham")) { console.error("lenh: --cham <tep dong bang> [--cham-n2 <tep lat moi> --db-n1 <url>] [--ra <md> | --doi-chieu <md> | --tien-do]"); return 2; }
  const tep = docTepMau(lay("--cham")); // băm sai thì ném
  const tep2 = lay("--cham-n2") ? docTepMau(lay("--cham-n2")) : null;
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  // Vòng 2: n1 đọc trên bản chép DB lúc chấm vòng 1 (danh bạ trước DA51), n2 trên DB hiện hành.
  const c1 = await moDb(tep2 ? (lay("--db-n1") ?? url) : url);
  const c2 = tep2 ? await moDb(url) : null;
  try {
    const l1 = await docLat(c1, tep, { lat: LAT, nhom: tep2 ? "n1" : null });
    const l2 = tep2 ? await docLat(c2, tep2, { lat: tep2.lat, nhom: "n2" }) : null;
    const loi = [...l1.loi, ...(l2?.loi ?? [])];
    for (const l of loi.slice(0, 20)) console.error(`DO: ${l}`);
    if (loi.length) { console.error(`DO: ${loi.length} bai co dau ra khac ban dong bang`); return 1; }
    const r1 = chamLat(l1);
    const r = l2 ? gopKetQua(r1.nhom.n1, chamLat(l2).nhom.n2) : r1;
    if (l2) { r.lat = `${LAT} (n1) · ${tep2.lat} (n2)`; r.tep = `\`${tep.sha256}\` (n1) · \`${tep2.sha256}\` (n2)`; }
    for (const [k, l, n] of [["--nhap", l1, tep2 ? "n1" : null], ["--nhap-n2", l2, "n2"]]) {
      if (!lay(k) || !l) continue;
      const nhap = docNhap(readFileSync(lay(k), "utf8"));
      const t = tiLeSua({ dong: l.dong, nhan: l.nhan, nhap }), u = tachLoaiThe({ dong: l.dong, nhan: l.nhan, nhap, danhBa: l.danhBa });
      r.sua_nhap = { ...(r.sua_nhap ?? {}), ...(n ? { [n]: t[n] } : t) };
      r.loai_the = { ...(r.loai_the ?? {}), ...(n ? { [n]: u[n] } : u) };
    }
    for (const [n, g] of Object.entries(r.nhom)) console.log(`${n}: da cham ${g.n}/${g.tong} · dung ${g.dung} · sai ${g.sai} · wilson ${g.wilson ?? "n/a"} · ${g.trang}${g.sai >= 2 ? " · DUNG GAN NHAN NHOM NAY" : ""}`);
    for (const [n, g] of Object.entries(r.nhom)) for (const s of g.ds_sai) console.log(`  may sai ${n} ${s.ref_id}: may ${s.may} · nguoi ${s.nhan.map((l) => `${l.building ?? "-"}/${l.subzone ?? "-"} -> ${JSON.stringify(l.quy)}`).join(" ; ")}`);
    for (const [n, t] of Object.entries(r.sua_nhap ?? {})) console.log(`${n}: co nhap ${t.co_nhap} · giu ${t.giu} · sua ${t.sua} · tu quyet ${t.tu_quyet}${t.the_cai ? ` · the cai ${t.the_cai}` : ""}${t.khong_nhap ? ` · khong co nhap ${t.khong_nhap}` : ""}`);
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
    await c1.end();
    await c2?.end();
  }
}

const laChinh = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (laChinh) main().then((m) => { process.exitCode = m; }, (e) => { console.error(e.message ?? e); process.exitCode = 1; });
