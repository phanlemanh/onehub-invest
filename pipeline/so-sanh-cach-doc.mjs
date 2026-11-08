#!/usr/bin/env node
// so-sanh-cach-doc.mjs — DO1 (AC-10): so một cách đọc mới với cách đọc cũ TRÊN CÙNG các bài — thẻ mẫu soát cuốn chiếu đã gắn
// nhãn trong N tuần gần nhất. Bài chưa có kết quả của khoá mới được gọi đọc gộp một lần (trần tiền mỗi lượt), rồi mỗi ô ra
// một dòng so cặp (giữ cũ, giữ mới, chênh cặp, khoảng 95%, có ý nghĩa) ghi vào dq_check_results `do1-so-sanh` (entity = khoá mới).
//   node pipeline/so-sanh-cach-doc.mjs --cu <khoá> --moi <khoá> [--tuan 4] [--tran-usd 0.30] [--ngay YYYY-MM-DD] [--write]
// Khoá mới của đọc gộp phải mang PROMPT_VERSION hiện tại của mã (đổi prompt là đổi mã); model chọn qua bảng chọn tạm.
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { giuO, khoaSilver, ngayVn, oCuaSilver, soCap } from "./lib/do-hang-ngay.mjs";
import { goiDocGopThat, LAT_CUON_CHIEU } from "./mau-soat-cuon-chieu.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Tách khoá `doc-gop:<model>:<prompt_version>` (model có thể chứa «:»). */
export function tachKhoa(khoa) {
  const ds = String(khoa).split(":");
  if (ds.length < 3 || !["doc-gop", "doc-chu"].includes(ds[0])) throw new Error(`so-sanh: khoá lạ «${khoa}»`);
  return { loai: ds[0], model: ds.slice(1, -1).join(":"), pv: ds.at(-1) };
}

/** Gọi đọc gộp thật cho khoá mới: bảng chọn tạm đặt mac_dinh = model của khoá. */
export async function goiTheoKhoa(ids, tran, { runId, khoa }) {
  const { model, pv } = tachKhoa(khoa);
  const cur = /PROMPT_VERSION = "([^"]+)"/.exec(readFileSync(path.join(ROOT, "agent/src/enrich/doc-gop-s03/prompt.ts"), "utf8"))?.[1];
  if (pv !== cur) throw new Error(`so-sanh: khoá mới mang prompt ${pv}, mã hiện tại là ${cur} — đổi prompt là đổi mã`);
  const cau = JSON.parse(readFileSync(path.join(ROOT, "agent/config/doc-gop-s03.json"), "utf8"));
  const ten = Object.entries(cau.model).find(([, m]) => `gateway:${m.gateway}` === model)?.[0];
  if (!ten) throw new Error(`so-sanh: model «${model}» không có trong bảng chọn`);
  const tep = path.join(mkdtempSync(path.join(tmpdir(), "do1-ss-")), "cau-hinh.json");
  writeFileSync(tep, JSON.stringify({ ...cau, mac_dinh: ten }));
  return goiDocGopThat(ids, tran, { runId, cauHinh: tep });
}

async function thePhuHop(client, ngay, tuan) {
  const { rows } = await client.query(
    `SELECT i.item_id, i.ref_id, i.stratum, i.draft,
            (SELECT jsonb_object_agg(field, jsonb_build_object('value', value, 'not_stated', not_stated))
               FROM (SELECT DISTINCT ON (field) field, value, not_stated FROM eval_labels l WHERE l.item_id = i.item_id
                      ORDER BY field, labeled_at DESC) x) AS nhan
       FROM eval_label_items i
      WHERE i.lat = $1 AND i.stratum > to_char($2::date - $3::int * 7, 'YYYY-MM-DD') AND i.stratum <= $4`,
    [LAT_CUON_CHIEU, ngay, tuan, ngay]);
  return rows.filter((r) => r.nhan);
}

async function ketQua(client, ids, khoa) {
  const { rows } = await client.query(
    `SELECT DISTINCT ON (post_id, model, prompt_version) post_id, model, prompt_version, json_ok, listing_intent, kind, quote_ok, probabilities
       FROM silver_labels WHERE source_code = 'S03' AND post_id = ANY ($1) ORDER BY post_id, model, prompt_version, labeled_at DESC`, [ids]);
  const m = new Map();
  for (const r of rows) if (khoaSilver(r) === khoa && r.json_ok) m.set(r.post_id, oCuaSilver(r).o);
  return m;
}

/**
 * @param {import("pg").Client} client
 * @param {{cu: string, moi: string, tuan?: number, tranUsd?: number, ngay?: string, goiDocGop?: Function, log?: Function, dotBien?: string}} opts
 */
export async function soSanh(client, { cu, moi, tuan = 4, tranUsd = 0.3, ngay = ngayVn(Date.now()), goiDocGop = goiTheoKhoa, log = console.log, dotBien } = {}) {
  tachKhoa(cu); tachKhoa(moi);
  const the = await thePhuHop(client, ngay, tuan);
  const ids = the.map((t) => t.ref_id);
  const daMoi = await ketQua(client, ids, moi);
  const thieu = dotBien === "goi-lai" ? ids : ids.filter((id) => !daMoi.has(id));
  let goi = { goi: 0, cham_tran: false };
  if (thieu.length) {
    goi = await goiDocGop(thieu, dotBien === "bo-tran" ? 1e9 : tranUsd, { runId: `do1-ss-${ngay}`, khoa: moi });
    if (goi.cham_tran) log(`so-sanh: CHAM TRAN SO SANH ${tranUsd} USD — ${goi.goi}/${thieu.length} bài đã gọi`);
  }
  const giaMoi = await ketQua(client, ids, moi);
  const giaCu = await ketQua(client, ids, cu);
  const cap = {};
  for (const t of the) {
    const oCu = t.draft?.cach_doc?.[cu]?.trang_thai === "co" ? t.draft.cach_doc[cu].o : giaCu.get(t.ref_id);
    const oMoi = giaMoi.get(t.ref_id);
    for (const [f, nhan] of Object.entries(t.nhan)) {
      const coCu = oCu && f in oCu, coMoi = oMoi && f in oMoi;
      if (dotBien === "khong-cap") {
        cap[f] ??= [];
        if (coCu) cap[f].push({ cu: giuO(f, oCu[f], nhan), moi: coMoi ? giuO(f, oMoi[f], nhan) : false });
        continue;
      }
      if (!coCu || !coMoi) continue;
      (cap[f] ??= []).push({ cu: giuO(f, oCu[f], nhan), moi: giuO(f, oMoi[f], nhan) });
    }
  }
  const o = Object.fromEntries(Object.entries(cap).map(([f, ds]) => [f, soCap(ds)]));
  return { goi: goi.goi, cham_tran: goi.cham_tran, dong: { check_name: "do1-so-sanh", entity: moi, status: "pass", detail: { ngay, cu, moi, tuan, o } } };
}

async function main() {
  const a = process.argv.slice(2);
  const lay = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  try {
    const kq = await soSanh(client, { cu: lay("--cu"), moi: lay("--moi"), tuan: Number(lay("--tuan", 4)), tranUsd: Number(lay("--tran-usd", 0.3)), ngay: lay("--ngay", ngayVn(Date.now())) });
    if (a.includes("--write")) {
      await client.query("DELETE FROM dq_check_results WHERE check_name = 'do1-so-sanh' AND entity = $1", [kq.dong.entity]);
      await client.query("INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)",
        [kq.dong.check_name, kq.dong.entity, kq.dong.status, JSON.stringify(kq.dong.detail)]);
    }
    for (const [f, r] of Object.entries(kq.dong.detail.o)) {
      console.log(`${f}: n=${r.n_cap} cũ ${r.giu_cu} mới ${r.giu_moi} chênh ${r.chenh_cap?.toFixed(3)}${r.co_y_nghia ? " (có ý nghĩa)" : ""}`);
    }
  } finally { await client.end(); }
}
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
