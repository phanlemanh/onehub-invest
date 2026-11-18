#!/usr/bin/env node
// ghep-tin-danh-muc-doc-bu.mjs — PL20 (AC-10): danh sách bài cho lượt model đọc bù. Lệnh này không gọi model và không ghi DB.
//   --lap [--ra <thư mục>]                     lập danh sách, đóng băng thành tệp có băm
//   --kiem <tệp>                               kiểm danh sách trước lượt đọc (thoát 1, ghim mã bài khi sai)
//   --in <tệp> [--dau N | --bo-dau N]          in mã bài ngăn bằng dấu phẩy, để truyền cho lệnh đọc
//   --kiem-thu <run_id> --so-bai N             kiểm nấc thử trước khi đọc cả lô (thoát 1 khi quá ngưỡng dừng)
//   --sau-doc <tệp> --run-id <a,b> --tran-usd <số>   kiểm sau lượt đọc: tiền thật và mọi dòng thuộc danh sách
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { bamDong } from "../label-dong-bang.mjs";
import { PROMPT_VERSION_DOC, docDauVao, tinhGan } from "../lib/ghep-tin-danh-muc-doc.mjs";
import { testMarker } from "../lib/test-posts.mjs";

const THU_MUC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../eval-sets");
/** Lý do mà có thêm bản đọc của model thì bài còn có thể gắn được. */
const MODEL_GIUP_DUOC = new Set(["khong-neu", "chi-luat"]);

/** Mỗi tin chưa gắn, chưa có bản đọc: một bài có chữ, ưu tiên bài model còn giúp được, rồi bài dài nhất. */
export function chonBaiDocBu({ tin, bai, danhBa }, { theoTin, ketQuaBai }) {
  const post_ids = [];
  let khong_chu = 0;
  for (const t of tin) {
    if (!danhBa.has(t.du_an) || theoTin.get(t.offer_id)?.status !== "chua_gan") continue;
    const ds = (t.post_ids ?? []).filter((p) => bai.has(p));
    if (ds.some((p) => bai.get(p).banDoc)) continue;
    const coChu = ds.filter((p) => (bai.get(p).chu ?? "").trim());
    if (!coChu.length) { if (ds.length) khong_chu++; continue; }
    const diem = (p) => (MODEL_GIUP_DUOC.has(ketQuaBai.get(p)?.ly_do) ? 1 : 0);
    coChu.sort((a, b) => diem(b) - diem(a) || bai.get(b).chu.length - bai.get(a).chu.length || a.localeCompare(b));
    post_ids.push(coChu[0]);
  }
  return { post_ids, khong_chu };
}

/** Danh sách đã sắp kèm băm: cùng dữ liệu ra cùng băm. */
export function dongBangDanhSach(ids) {
  const post_ids = [...new Set(ids)].sort();
  return { sha256: bamDong(post_ids), so_bai: post_ids.length, post_ids };
}

function docTep(tep) {
  const x = JSON.parse(readFileSync(tep, "utf8"));
  const tinh = bamDong(x.post_ids);
  if (tinh !== x.sha256) throw new Error(`doc-bu: băm trong tệp ${x.sha256} khác băm tính lại ${tinh}`);
  return x;
}

/** Kiểm danh sách trước lượt đọc. Trả các lỗi, mỗi lỗi ghim mã bài. */
export async function kiemTruocDoc(c, postIds) {
  const loi = [];
  const { rows: tin } = await c.query(
    `SELECT p.post_id, o.offer_id, op.project_node_id::text AS du_an, o.property_type, o.post_ids
       FROM unnest($1::text[]) AS p(post_id)
       LEFT JOIN sale_offers o ON o.source = 'S03' AND p.post_id = ANY (o.post_ids)
       LEFT JOIN offer_project op ON op.offer_id = o.offer_id`, [postIds]);
  const { rows: stg } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, group_name FROM stg_zalo_posts WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [postIds]);
  const bai = new Map(stg.map((r) => [r.post_id, r]));
  const vao = await docDauVao(c);
  const { theoTin } = tinhGan(vao);
  const daDoc = new Set((await c.query(
    `SELECT DISTINCT post_id FROM silver_labels WHERE source_code = 'S03' AND prompt_version = $1 AND probabilities ->> 'nguon' = 'doc-gop' AND json_ok`, [PROMPT_VERSION_DOC])).rows.map((r) => r.post_id));
  const theoTinDs = new Map();
  for (const r of tin) {
    if (!r.offer_id) { loi.push(`khong-co-tin ${r.post_id}`); continue; }
    if (!vao.danhBa.has(r.du_an) || r.property_type !== "apartment") loi.push(`ngoai-pham-vi ${r.post_id}`);
    if (!bai.has(r.post_id) || testMarker(bai.get(r.post_id))) loi.push(`bai-thu ${r.post_id}`);
    if (theoTin.get(r.offer_id)?.status === "gan") loi.push(`tin-da-gan ${r.post_id}`);
    if ((r.post_ids ?? []).some((p) => daDoc.has(p))) loi.push(`da-co-ban-doc ${r.post_id}`);
    if (theoTinDs.has(r.offer_id)) loi.push(`hai-bai-cung-tin ${r.post_id} ${theoTinDs.get(r.offer_id)}`);
    theoTinDs.set(r.offer_id, r.post_id);
  }
  // Phép đếm độc lập: đi thẳng từ SQL, không qua luật chọn bài.
  const { rows: [{ n }] } = await c.query(
    `SELECT count(*)::int AS n FROM sale_offers o JOIN offer_project op USING (offer_id)
      WHERE o.source = 'S03' AND o.property_type = 'apartment' AND op.project_node_id = ANY ($1::bigint[])
        AND NOT EXISTS (SELECT 1 FROM silver_labels s WHERE s.source_code = 'S03' AND s.post_id = ANY (o.post_ids) AND s.prompt_version = $2
                          AND s.probabilities ->> 'nguon' = 'doc-gop' AND s.json_ok)`, [[...vao.danhBa.keys()], PROMPT_VERSION_DOC]);
  const conLai = vao.tin.filter((t) => vao.danhBa.has(t.du_an) && !(t.post_ids ?? []).some((p) => daDoc.has(p)));
  const daXong = conLai.filter((t) => theoTin.get(t.offer_id)?.status !== "chua_gan").length;
  const khongBai = conLai.filter((t) => theoTin.get(t.offer_id)?.status === "chua_gan" && !(t.post_ids ?? []).some((p) => (vao.bai.get(p)?.chu ?? "").trim())).length;
  if (n !== postIds.length + daXong + khongBai) loi.push(`lech-dem danh-sach ${postIds.length} + da-gan ${daXong} + khong-chu ${khongBai} khac dem-doc-lap ${n}`);
  return loi;
}

/** Kiểm sau lượt đọc: tiền thật theo run_id và mọi dòng mang run_id thuộc danh sách. */
export async function kiemSauDoc(c, postIds, runIds, tranUsd) {
  const { rows } = await c.query(`SELECT post_id, coalesce(cost_usd, 0)::float8 AS usd FROM silver_labels WHERE run_id = ANY ($1)`, [runIds]);
  const ds = new Set(postIds);
  const loi = rows.filter((r) => !ds.has(r.post_id)).map((r) => `ngoai-danh-sach ${r.post_id}`);
  const usd = rows.reduce((s, r) => s + r.usd, 0);
  if (usd > tranUsd) loi.push(`vuot-tran ${usd.toFixed(4)} USD > ${tranUsd} USD`);
  return { loi, usd, so_dong: rows.length };
}

/** Ngưỡng dừng của nấc thử: quá 10% số bài hỏng hoặc tiền trung bình quá 0,004 USD mỗi bài thì không đọc cả lô. */
export function xetNacThu({ so_bai, ok, usd }) {
  const loi = [];
  if (so_bai - ok > Math.floor(so_bai * 0.1)) loi.push(`qua-nhieu-bai-hong ${so_bai - ok}/${so_bai}`);
  if (ok > 0 && usd / ok > 0.004) loi.push(`tien-moi-bai ${(usd / ok).toFixed(5)} USD > 0.004 USD`);
  if (ok === 0) loi.push("khong-co-bai-doc-duoc");
  return loi;
}

async function main() {
  const a = process.argv.slice(2);
  const lay = (k) => { const i = a.indexOf(k); return i < 0 ? undefined : a[i + 1]; };
  if (lay("--in")) {
    const { post_ids } = docTep(lay("--in"));
    const ds = lay("--dau") ? post_ids.slice(0, Number(lay("--dau"))) : lay("--bo-dau") ? post_ids.slice(Number(lay("--bo-dau"))) : post_ids;
    console.log(ds.join(","));
    return 0;
  }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    if (a.includes("--lap")) {
      const vao = await docDauVao(c);
      const { post_ids, khong_chu } = chonBaiDocBu(vao, tinhGan(vao));
      const x = dongBangDanhSach(post_ids);
      const ra = lay("--ra") ? path.resolve(lay("--ra")) : THU_MUC;
      const tep = path.join(ra, `pl20-doc-bu-${x.sha256.slice(0, 12)}.json`);
      if (!existsSync(tep)) { mkdirSync(ra, { recursive: true }); writeFileSync(tep, `${JSON.stringify(x, null, 1)}\n`); }
      console.log(`doc-bu: ${x.so_bai} bai · bo ${khong_chu} tin khong co chu · uoc ${(x.so_bai * 0.00145).toFixed(2)} USD, p95 ${(x.so_bai * 0.00192).toFixed(2)} USD`);
      console.log(`sha256 ${x.sha256}`);
      console.log(tep);
      return 0;
    }
    if (lay("--kiem")) {
      const { post_ids } = docTep(lay("--kiem"));
      const loi = await kiemTruocDoc(c, post_ids);
      for (const l of loi) console.error(`DO: ${l}`);
      console.log(loi.length ? `doc-bu: ${loi.length} loi` : `doc-bu: danh sach ${post_ids.length} bai dung`);
      return loi.length ? 1 : 0;
    }
    if (lay("--kiem-thu")) {
      const so_bai = Number(lay("--so-bai"));
      if (!Number.isInteger(so_bai) || so_bai <= 0) { console.error("can --so-bai <so nguyen duong>"); return 2; }
      const { rows: [r] } = await c.query(
        `SELECT count(*) FILTER (WHERE json_ok)::int AS ok, coalesce(sum(cost_usd), 0)::float8 AS usd FROM silver_labels WHERE run_id = $1`, [lay("--kiem-thu")]);
      const loi = xetNacThu({ so_bai, ok: r.ok, usd: r.usd });
      for (const l of loi) console.error(`DUNG: ${l}`);
      console.log(`doc-bu thu: ${r.ok}/${so_bai} bai doc duoc · ${r.usd.toFixed(4)} USD`);
      return loi.length ? 1 : 0;
    }
    if (lay("--sau-doc")) {
      const { post_ids } = docTep(lay("--sau-doc"));
      const tran = Number(lay("--tran-usd"));
      if (!lay("--run-id") || !Number.isFinite(tran)) { console.error("can --run-id va --tran-usd"); return 2; }
      const { loi, usd, so_dong } = await kiemSauDoc(c, post_ids, lay("--run-id").split(","), tran);
      for (const l of loi) console.error(`DO: ${l}`);
      console.log(`doc-bu: ${so_dong} dong · ${usd.toFixed(4)} USD / tran ${tran} USD`);
      return loi.length ? 1 : 0;
    }
    console.error("lenh: --lap | --kiem <tep> | --in <tep> | --sau-doc <tep> --run-id <a,b> --tran-usd <so>");
    return 2;
  } finally {
    await c.end();
  }
}

const laChinh = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (laChinh) main().then((m) => { process.exitCode = m; }, (e) => { console.error(e.message ?? e); process.exitCode = 1; });
