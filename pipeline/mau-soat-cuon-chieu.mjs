#!/usr/bin/env node
// mau-soat-cuon-chieu.mjs — DO1 (AC-1): rút 20 bài S03 nhận trong một ngày (giờ VN) vào lát `s03-cuon-chieu`, gọi đọc gộp cho bài
// chưa có kết quả (một lần, TRƯỚC khi chụp, có trần tiền ngày), rồi chụp nháp của mọi cách đọc vào `eval_label_items.draft`.
//   node pipeline/mau-soat-cuon-chieu.mjs [--ngay YYYY-MM-DD] [--n 20] [--tran-usd 0.05] [--thu]
// Mặc định ngày = hôm qua giờ VN. Gồm cả bài máy không nhận là tin rao. Gạt bài thử bằng đúng bộ lọc của transform
// (lib/test-posts.mjs), khử trùng nội dung, chọn tất định theo hạt giống `cc-<ngày>`. Ngày đã có thẻ → không rút, không gọi.
// --thu: in danh sách bài sẽ rút, không ghi, không gọi model. Bảng chỉ ở máy thu (083: draft không sync cloud).
import { execFile } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import pg from "pg";

import { chuanHoa } from "./lib/chuan-hoa-nhan.mjs";
import { khoaSilver, oCuaSilver } from "./lib/do-hang-ngay.mjs";
import { chonMau, textHash } from "./lib/eval-labels.mjs";
import { testMarker } from "./lib/test-posts.mjs";

export const LAT_CUON_CHIEU = "s03-cuon-chieu";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Khoá cách đọc gộp mặc định: model `mac_dinh` của agent/config/doc-gop-s03.json + PROMPT_VERSION của prompt.ts. */
export function khoaDocGopMacDinh(root = ROOT) {
  const cau = JSON.parse(readFileSync(path.join(root, "agent/config/doc-gop-s03.json"), "utf8"));
  const pv = /PROMPT_VERSION = "([^"]+)"/.exec(readFileSync(path.join(root, "agent/src/enrich/doc-gop-s03/prompt.ts"), "utf8"))?.[1];
  if (!pv) throw new Error("mau-soat: không đọc được PROMPT_VERSION của doc-gop-s03");
  return { khoa: `doc-gop:gateway:${cau.model[cau.mac_dinh].gateway}:${pv}`, oNguoi: Object.entries(cau.o ?? {}).filter(([, v]) => v === "nguoi").map(([k]) => k) };
}

/** Khoảng mốc thời gian UTC của một ngày giờ VN. */
export const khoangNgay = (ngay) => [`${ngay}T00:00:00+07:00`, new Date(new Date(`${ngay}T00:00:00+07:00`).getTime() + 86400e3).toISOString()];

/** Ô của bộ đọc luật từ một dòng sale_offer_records (đã phân xử), đã chuẩn hoá về khuôn eval_labels. */
export function oBoDocLuat(r) {
  const tho = {
    listing_intent: "offer", kind: r.kind, property_type: r.property_type, price_min_vnd: r.price_vnd, price_max_vnd: r.price_vnd,
    area_m2: r.area_m2 === null ? null : Number(r.area_m2), bedrooms: r.bedrooms, bathrooms: r.bathrooms, building: r.block_raw,
    floor: r.floor_raw, unit_number: r.unit_number, seller_name: r.seller_name, seller_phone: r.seller_phone,
  };
  const o = {};
  for (const [f, v] of Object.entries(tho)) {
    const c = chuanHoa(f, typeof v === "string" && /^\d+(\.\d+)?$/.test(v) && f.startsWith("price") ? Number(v) : v);
    o[f] = c.ok ? c.v : null;
  }
  return o;
}

/** Gọi đọc gộp qua lệnh của agent cho đúng danh sách bài, với trần còn lại. Trả số lời gọi, USD, có chạm trần. */
export async function goiDocGopThat(postIds, tranConLai, { runId, cauHinh }) {
  const env = path.join(ROOT, ".env");
  const args = [...(existsSync(env) ? [`--env-file=${env}`] : []), "--import", "tsx", "scripts/doc-gop-s03.ts", "chay",
    "--post", postIds.join(","), "--tran-usd", String(tranConLai), "--run-id", runId, ...(cauHinh ? ["--cau-hinh", cauHinh] : [])];
  try {
    const { stdout } = await promisify(execFile)("node", args, { cwd: path.join(ROOT, "agent"), maxBuffer: 1 << 24 });
    process.stdout.write(stdout);
    return { goi: postIds.length, cham_tran: false };
  } catch (e) {
    if (e.code === 3) return { goi: postIds.length, cham_tran: true }; // doc-gop thoát 3 = dừng vì trần
    throw new Error(`mau-soat: doc-gop-s03 chay lỗi (mã ${e.code}): ${String(e.stderr ?? e.message).slice(0, 400)}`);
  }
}

async function chiDocGopNgay(client, ngay) {
  const { rows: [{ usd }] } = await client.query(
    `SELECT coalesce(sum(cost_usd), 0)::float AS usd FROM silver_labels WHERE run_id LIKE $1`, [`do1-mau-${ngay}%`]);
  return usd;
}

async function silverCua(client, postIds) {
  const { rows } = await client.query(
    `SELECT DISTINCT ON (post_id, model, prompt_version) post_id, model, prompt_version, json_ok, listing_intent, kind, quote_ok,
            probabilities, labeled_at
       FROM silver_labels WHERE source_code = 'S03' AND post_id = ANY ($1)
      ORDER BY post_id, model, prompt_version, labeled_at DESC`, [postIds]);
  return rows;
}

/** Nháp của mọi cách đọc cho một bài. */
export function dungNhap({ tin, silver, khoaGop, oNguoi, luc, dotBien }) {
  const cach_doc = {};
  cach_doc["bo-doc-luat"] = tin ? { trang_thai: "co", o: oBoDocLuat(tin) }
    : dotBien === "khong-tin-thanh-co" ? { trang_thai: "co", o: { listing_intent: null, kind: null } } : { trang_thai: "khong-tin", o: {} };
  for (const r of silver) {
    const k = khoaSilver(r);
    if (!r.json_ok) { cach_doc[k] ??= { trang_thai: "vang", o: {} }; continue; }
    const { o } = oCuaSilver(r); // ô giao người giữ trong nháp (đo giữ nháp); màn bỏ chúng theo draft.o_nguoi
    cach_doc[k] = { trang_thai: o.listing_intent === "offer" ? "co" : "khong-tin", o };
  }
  cach_doc[khoaGop] ??= { trang_thai: "vang", o: {} };
  const hien = cach_doc[khoaGop].trang_thai === "co" || dotBien === "hien-luon-gop" ? khoaGop : "bo-doc-luat";
  return { hien, cach_doc, o_nguoi: oNguoi, chup_luc: luc };
}

/**
 * @param {import("pg").Client} client
 * @param {{ngay: string, n?: number, tranUsd?: number, thu?: boolean, goiDocGop?: (ids: string[], tran: number, o: {runId: string}) => Promise<{goi: number, cham_tran: boolean}>, khoaGop?: {khoa: string, oNguoi: string[]}, log?: (s: string) => void, dotBien?: string}} opts
 */
export async function rutMau(client, { ngay, n = 20, tranUsd = 0.05, thu = false, goiDocGop = goiDocGopThat, khoaGop, log = console.log, dotBien } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay ?? "")) throw new Error("mau-soat: --ngay phải là YYYY-MM-DD");
  const kg = khoaGop ?? khoaDocGopMacDinh();
  const { rows: [{ co }] } = await client.query(
    `SELECT count(*)::int AS co FROM eval_label_items WHERE lat = $1 AND stratum = $2`, [LAT_CUON_CHIEU, ngay]);
  if (co > 0 && !thu) { log(`mau-soat: ngày ${ngay} đã có ${co} thẻ — không rút, không gọi`); return { them: 0, goi: 0, cham_tran: false, the: [] }; }

  const [tu, den] = khoangNgay(ngay);
  const { rows: tho } = await client.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, group_name, coalesce(posted_at, captured_at) AS luc
       FROM stg_zalo_posts
      WHERE (agent_id IS NULL OR agent_id <> 'apify-facebook') AND coalesce(posted_at, captured_at) >= $1 AND coalesce(posted_at, captured_at) < $2
      ORDER BY post_id, captured_at DESC`, [tu, den]);
  const thuong = dotBien === "giu-bai-thu" ? tho : tho.filter((r) => !testMarker(r));
  const { rows: da } = await client.query(`SELECT text_hash FROM eval_label_items WHERE lat = $1`, [LAT_CUON_CHIEU]);
  const daCo = new Set(da.map((r) => r.text_hash));
  const ungVien = thuong.filter((p) => !daCo.has(textHash(p.text)));
  const { rows: tinRows } = await client.query(
    `SELECT DISTINCT ON (pid) pid, r.*
       FROM sale_offer_records r, unnest(r.post_ids) AS pid
      WHERE r.source = 'S03' AND pid = ANY ($1)
      ORDER BY pid, (r.retired_at IS NULL) DESC, r.offer_id`, [ungVien.map((p) => p.post_id)]);
  const tinCua = new Map(tinRows.map((r) => [r.pid, r]));
  const ungVienLoc = dotBien === "bo-bai-khong-nhan" ? ungVien.filter((p) => tinCua.has(p.post_id)) : ungVien;
  const chon = dotBien === "theo-thu-tu-chen"
    ? ungVienLoc.slice(0, n).map((p) => ({ ref_id: p.post_id, text_hash: textHash(p.text) }))
    : chonMau(ungVienLoc, { n, seed: `cc-${ngay}`, tiLeTrung: 0, tinCua: new Map([...tinCua].map(([k, v]) => [k, v.offer_id])) }).chon;
  const ids = chon.map((c) => c.ref_id);
  if (thu) { log(`mau-soat --thu: ${ngay} sẽ rút ${ids.length}/${ungVienLoc.length} bài`); return { them: 0, goi: 0, cham_tran: false, the: chon }; }

  const chup = async () => silverCua(client, ids);
  let silver = dotBien === "chup-truoc-goi" ? await chup() : null;
  // Bài chưa có kết quả đọc gộp của khoá mặc định → gọi một lần, trong trần còn lại của ngày.
  const daGop = new Set((await chup()).filter((r) => khoaSilver(r) === kg.khoa && r.json_ok).map((r) => r.post_id));
  const thieu = dotBien === "goi-lai" ? ids : ids.filter((id) => !daGop.has(id));
  let goi = 0, chamTran = false;
  if (thieu.length) {
    const con = tranUsd - (dotBien === "bo-tran" ? 0 : await chiDocGopNgay(client, ngay));
    if (con <= 0 && dotBien !== "bo-tran") { chamTran = true; log(`mau-soat: CHAM TRAN DOC GOP ${tranUsd} USD ngày ${ngay} — không gọi`); }
    else {
      const kq = await goiDocGop(thieu, dotBien === "bo-tran" ? 1e9 : con, { runId: `do1-mau-${ngay}` });
      goi = kq.goi; chamTran = kq.cham_tran;
      if (chamTran) log(`mau-soat: CHAM TRAN DOC GOP ${tranUsd} USD ngày ${ngay}`);
    }
  }
  silver ??= await chup();
  const luc = new Date().toISOString();
  const the = [];
  let them = 0;
  for (const c of chon) {
    const draft = dungNhap({ tin: tinCua.get(c.ref_id), silver: silver.filter((r) => r.post_id === c.ref_id), khoaGop: kg.khoa, oNguoi: kg.oNguoi, luc, dotBien });
    const res = await client.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum, draft)
       VALUES ($1, 'S03', $2, $3, 'dev', false, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING item_id`,
      [LAT_CUON_CHIEU, c.ref_id, c.text_hash, `cc-${ngay}`, ngay, draft]);
    them += res.rowCount;
    if (res.rowCount) the.push({ item_id: Number(res.rows[0].item_id), post_id: c.ref_id, draft });
  }
  log(`mau-soat: ${ngay} rút ${them} thẻ, gọi đọc gộp ${goi} bài${chamTran ? " (chạm trần)" : ""}`);
  return { them, goi, cham_tran: chamTran, the };
}

const homQuaVn = () => new Date(Date.now() + 7 * 3600e3 - 86400e3).toISOString().slice(0, 10);

async function main() {
  const a = process.argv.slice(2);
  const lay = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  try {
    await rutMau(client, { ngay: lay("--ngay", homQuaVn()), n: Number(lay("--n", 20)), tranUsd: Number(lay("--tran-usd", 0.05)), thu: a.includes("--thu") });
  } finally { await client.end(); }
}
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
