#!/usr/bin/env node
// transform-s10.mjs — DA29: nối dự án S10 (bảng hàng chủ đầu tư) vào nút dự án của danh bạ từ tệp bảng nối ở máy thu.
// Cùng luật DN1 của S08 (noi-du-an-s08.mjs): tệp gitignored do người duyệt, kiểm tín hiệu tên, nút project, không hai dòng,
// không mã lạ, không sót ứng viên; lỗi thì không ghi dòng nào. Ghi s10_project_links (089), không sync cloud.
// Tên dự án lấy từ stg_s10_project (bộ nạp v11), snapshot mới nhất mỗi project_id: du_an phải một giá trị; phân khu, nhãn gộp
// theo thứ tự chữ. In số và mã lỗi, không in tên hay mã dự án S10.
// Dùng: node pipeline/transform-s10.mjs --tep <tệp> [--thu]   (--thu chỉ kiểm). Thoát: 0 được · 1 tệp hay DB lỗi · 2 sai cách gọi.
import fs from "node:fs";
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { kiemBangNoi, kiemTep } from "./noi-du-an-s08.mjs";

/** Tên dự án S10 mỗi project_id ở snapshot mới nhất. Trả { loi, duAn } — du_an nhiều giá trị là lỗi «du-an-nhieu-ten». */
export async function docDuAnS10(c) {
  const { rows } = await c.query(
    `WITH moi AS (
       SELECT DISTINCT ON (project_id) project_id, snapshot_id FROM stg_s10_project
        ORDER BY project_id, captured_at DESC NULLS LAST, snapshot_id DESC)
     SELECT p.project_id,
            count(DISTINCT p.du_an)::int AS n_ten,
            min(p.du_an) AS ten,
            coalesce(string_agg(DISTINCT p.project_label, ' / ' ORDER BY p.project_label), '') AS ma,
            coalesce(string_agg(DISTINCT p.phan_khu, ' / ' ORDER BY p.phan_khu), '') AS phan_khu
       FROM stg_s10_project p JOIN moi USING (project_id, snapshot_id)
      GROUP BY p.project_id ORDER BY p.project_id`);
  if (rows.some((r) => r.n_ten > 1)) return { loi: ["du-an-nhieu-ten"], duAn: [] };
  return { loi: [], duAn: rows.map((r) => ({ project_id: r.project_id, ten: r.ten ?? "", ma: r.ma, phan_khu: r.phan_khu })) };
}

async function main() {
  const i = process.argv.indexOf("--tep");
  const tep = i > 0 ? process.argv[i + 1] : null;
  const thu = process.argv.includes("--thu");
  if (!tep) { console.error("thieu --tep"); process.exit(2); }
  const baoLoi = (ma) => { console.log(`loi: ${ma}`); process.exit(1); };
  const tuyetDoi = path.resolve(tep);
  if (!fs.existsSync(tuyetDoi)) baoLoi("tep-khong-co");
  const loiTep = kiemTep(tuyetDoi);
  if (loiTep) baoLoi(loiTep);
  let bang;
  try { bang = JSON.parse(fs.readFileSync(tuyetDoi, "utf8")); } catch { baoLoi("tep-khong-doc-duoc"); }

  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const doc = await docDuAnS10(c);
    if (doc.loi.length) { for (const m of doc.loi) console.log(`loi: ${m}`); process.exitCode = 1; return; }
    const { rows: nutRows } = await c.query(`SELECT id, slug, node_type FROM asset_nodes`);
    const nut = new Map(nutRows.map((n) => [n.slug, n.node_type]));
    const idNut = new Map(nutRows.map((n) => [n.slug, n.id]));
    const { loi, dong } = kiemBangNoi({ bang, duAn: doc.duAn, nut });
    if (loi.length) { for (const m of loi) console.log(`loi: ${m}`); process.exitCode = 1; return; }
    const chuaNoi = dong.filter((d) => d.status === "chua_noi").length;
    console.log(`noi ${dong.length - chuaNoi} · chua_noi ${chuaNoi}`);
    if (thu) { console.log("thu: khong ghi"); return; }
    await c.query("BEGIN");
    await c.query(
      `INSERT INTO s10_project_links (project_id, asset_node_id, status, ly_do)
       SELECT * FROM unnest($1::text[], $2::bigint[], $3::text[], $4::text[])
       ON CONFLICT (project_id) DO UPDATE SET asset_node_id = EXCLUDED.asset_node_id, status = EXCLUDED.status, ly_do = EXCLUDED.ly_do, updated_at = now()
       WHERE (s10_project_links.asset_node_id, s10_project_links.status, s10_project_links.ly_do)
             IS DISTINCT FROM (EXCLUDED.asset_node_id, EXCLUDED.status, EXCLUDED.ly_do)`,
      [dong.map((d) => d.project_id), dong.map((d) => (d.slug ? idNut.get(d.slug) : null)), dong.map((d) => d.status), dong.map((d) => d.ly_do)]);
    await c.query("COMMIT");
    console.log("da ghi");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.log(`loi: db ${e.code ?? "?"} ${e.constraint ?? ""}`.trim()); // không in e.detail: Postgres chép cả dòng vào đó
    process.exitCode = 1;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
