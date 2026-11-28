#!/usr/bin/env node
// ap-lan-hai-ban-chep.mjs — DA65 E4 (AC-4): «xong khi» bằng số trên BẢN CHÉP DB máy thu (không bao giờ DB «oneinvest»):
// cấy một dự án S08 giả cùng khoá nhóm với một dự án đã đúc (tên «<tên>_TT», cùng điểm bản đồ), dựng thẻ, áp, áp lần hai.
//   bash db/db-thu.sh oneinvest_suite_da65 --chay node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/ap-lan-hai-ban-chep.mjs
// Đạt: dự án giả về nút cũ; lượt áp đúc đúng số khoá nhóm chưa có nút (bản chép 28/11 08:58Z: 0), số nút S08 sau áp = trước + số đó
// (146 → 146); dòng nối của dự án giả trỏ nút cũ; áp lần hai không đổi. Thoát 0 đạt, 1 lệch (in ô), 2 hỏng/không phải bản chép.
// Không in tên hay mã dự án thật.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GOC = execFileSync("git", ["-C", import.meta.dirname, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const luat = await import(pathToFileURL(join(GOC, "pipeline/noi-du-an-s08-luat.mjs")).href);

const url = process.env.DATABASE_URL;
if (!url) { console.log("HONG thiếu DATABASE_URL — chạy qua db/db-thu.sh --chay"); process.exit(2); }
const c = new pg.Client({ connectionString: url });
await c.connect();
const db = (await c.query("SELECT current_database() AS d")).rows[0].d;
if (!/^oneinvest_(suite|dbv)_/.test(db)) { console.log(`HONG «${db}» không phải DB của riêng lượt — từ chối ghi`); await c.end(); process.exit(2); }

const GIA = "DA65GIA0001";
const soNutS08 = async () => (await c.query("SELECT count(*)::int AS n FROM asset_nodes WHERE meta ->> 'nguon' = 'S08'")).rows[0].n;
const lech = [];
try {
  const truoc = await luat.dungTheLuat(c);
  const mau = truoc.ds.find((d) => d.kq.status === "duc" && d.kq.node_id != null && d.tinhId);
  if (!mau) { console.log("HONG bản chép không có dự án S08 đã đúc nào làm mẫu"); process.exit(2); }
  await c.query(`INSERT INTO stg_s08_project (snapshot_id, project_id, catalog_payload, detail_payload, fetched_at)
    SELECT snapshot_id, $2, jsonb_set(catalog_payload, '{project_name}', to_jsonb((catalog_payload ->> 'project_name') || '_TT')),
           detail_payload, now()
      FROM stg_s08_project WHERE project_id = $1 ORDER BY fetched_at DESC NULLS LAST LIMIT 1`, [mau.ma, GIA]);
  const n0 = await soNutS08();
  const the = await luat.dungTheLuat(c);
  const kqGia = the.ds.find((d) => d.ma === GIA)?.kq;
  const khoaMoi = new Set(the.ds.filter((d) => d.kq.status === "duc" && d.kq.node_id == null).map((d) => d.kq.nhom)).size;
  if (!(kqGia?.status === "duc" && kqGia.node_id === mau.kq.node_id)) lech.push(`thẻ: dự án giả ra ${kqGia ? `${kqGia.status}${kqGia.node_id != null ? " (nút khác)" : kqGia.nhom ? " (nhóm mới)" : ""}` : "không có"}, cần nút cũ`);
  if (the.soNutMoi !== khoaMoi) lech.push(`thẻ hứa ${the.soNutMoi} nút mới, khoá nhóm chưa có nút ${khoaMoi}`);
  const ap = await luat.apTheLuat(c, { bam: the.bam, nguoi: "da65-ban-chep" });
  const n1 = await soNutS08();
  if (ap.soNutMoi !== khoaMoi) lech.push(`áp đúc ${ap.soNutMoi} nút, cần ${khoaMoi}`);
  if (n1 !== n0 + khoaMoi) lech.push(`nút S08 ${n0} → ${n1}, cần ${n0 + khoaMoi}`);
  const { rows: [l] } = await c.query("SELECT asset_node_id::int AS nut, status FROM project_links WHERE source = 'S08' AND source_project_id = $1", [GIA]);
  if (!(l?.status === "noi" && l.nut === mau.kq.node_id)) lech.push("dòng nối của dự án giả không trỏ nút cũ");
  const lan2 = await luat.apTheLuat(c, { bam: (await luat.dungTheLuat(c)).bam, nguoi: "da65-ban-chep" });
  if (!lan2.khongDoi) lech.push("áp lần hai còn đổi");
  const n2 = await soNutS08();
  if (n2 !== n1) lech.push(`áp lần hai đổi số nút S08 ${n1} → ${n2}`);
  console.log(`bản chép ${db}: dự án ${the.ds.length} · nút S08 trước ${n0} · khoá nhóm chưa có nút ${khoaMoi} · sau áp ${n1} · sau áp lần hai ${n2}`
    + ` · dự án giả về nút cũ: ${kqGia?.node_id === mau.kq.node_id ? "có" : "không"} · áp lần hai khongDoi: ${lan2.khongDoi}`);
} catch (e) {
  console.log(`HONG ${e.message}`);
  process.exit(2);
} finally { await c.end().catch(() => {}); }
if (lech.length) { for (const x of lech) console.log(`FAIL ${x}`); process.exit(1); }
console.log("PASS áp sau cùng khoá nhóm không đúc nút thứ hai; số nút S08 chỉ tăng theo khoá nhóm thật sự mới; áp lần hai không đổi");
