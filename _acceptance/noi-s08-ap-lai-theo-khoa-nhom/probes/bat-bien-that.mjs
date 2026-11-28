#!/usr/bin/env node
// bat-bien-that.mjs — DA65 E3 (AC-3): bất biến «nhóm đã đúc thì không đúc lại» trên DB máy thu, CHỈ ĐỌC (giao dịch READ ONLY).
//   node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs     thoát 0 = đạt, 1 = lệch (in loại lỗi + số), 2 = hỏng
// Ba bất biến trên thẻ dựng từ dữ liệu thật: (1) dự án ngả đúc chưa có nút thì khoá nhóm chưa có nút S08; (2) dự án ngả đúc mà khoá
// nhóm có đúng một nút S08 thì trỏ nút ấy; (3) số nút mới thẻ hứa = số khoá nhóm chưa có nút. Đối chứng đỏ không ghi DB: nhân bản
// một dự án đã đúc thành dự án giả cùng khoá, bỏ dòng nối — luật bỏ bảng nhóm đã đúc (mã trước DA65) phải đúc nhóm mới, luật hiện
// tại phải về nút cũ. Không in tên hay mã dự án.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GOC = execFileSync("git", ["-C", import.meta.dirname, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const luat = await import(pathToFileURL(join(GOC, "pipeline/noi-du-an-s08-luat.mjs")).href);
const lop = await import(pathToFileURL(join(GOC, "pipeline/lib/noi-du-an-s08-lop.mjs")).href);

const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
let the, nut, daDuc;
try {
  await c.connect();
  await c.query("BEGIN READ ONLY");
  the = await luat.dungTheLuat(c);
  const duAn = await luat.docDuAn(c);
  nut = await luat.docNut(c);
  const { rows } = await c.query(`SELECT pl.source_project_id AS ma, pl.asset_node_id::int AS node_id, n.meta ->> 'nguon' AS nguon_nut
    FROM project_links pl LEFT JOIN asset_nodes n ON n.id = pl.asset_node_id WHERE pl.source = 'S08'`);
  daDuc = luat.nhomDaDuc(duAn, nut, new Map(rows.map((r) => [r.ma, r])));
  await c.query("ROLLBACK");
} catch (e) {
  console.log(`HONG không đọc được DB máy thu: ${e.message}`);
  process.exit(2);
} finally { await c.end().catch(() => {}); }

const duc = the.ds.filter((d) => d.kq.status === "duc");
const lech = { duc_lai_nhom_da_co: 0, khong_tro_nut_nhom: 0, nut_moi_lech: 0 };
for (const d of duc) {
  const k = d.tinhId ? lop.khoaNhom(d.ten, d.tinhId) : null;
  const co = k ? daDuc.get(k) ?? [] : [];
  if (d.kq.node_id == null && co.length) lech.duc_lai_nhom_da_co++;
  if (co.length === 1 && d.kq.node_id !== co[0]) lech.khong_tro_nut_nhom++;
}
const khoaMoi = new Set(duc.filter((d) => d.kq.node_id == null).map((d) => d.kq.nhom));
if (the.soNutMoi !== khoaMoi.size) lech.nut_moi_lech = Math.abs(the.soNutMoi - khoaMoi.size);
const v = [...daDuc.values()];
console.log(`dự án ${the.ds.length} · ngả đúc ${duc.length} (vào nút cũ ${duc.filter((d) => d.kq.node_id != null).length}, nút mới hứa ${the.soNutMoi})`
  + ` · nhóm có nút S08 ${v.length} (một nút ${v.filter((x) => x.length === 1).length}, từ hai nút ${v.filter((x) => x.length > 1).length})`);

// Đối chứng đỏ: dự án giả cùng khoá với một dự án đã đúc, chưa có dòng nối.
const mau = duc.find((d) => d.kq.node_id != null && d.tinhId && (daDuc.get(lop.khoaNhom(d.ten, d.tinhId)) ?? []).length === 1);
let dc = 0;
if (!mau) { console.log("FAIL đối chứng: không có dự án đã đúc nào làm mẫu — thước không đo được gì"); dc = 1; }
else {
  const gia = { ma: "gia-da65", ten: `${mau.ten}_TT`, tinh: mau.tinhId };
  const cu = lop.phanLopS08(gia, nut, null, null), moi = lop.phanLopS08(gia, nut, null, daDuc);
  if (cu.status === "duc" && cu.node_id == null && cu.nhom) console.log("PASS đối chứng đỏ: bỏ bảng nhóm đã đúc thì dự án giả cùng khoá đúc nhóm mới");
  else { console.log(`FAIL đối chứng đỏ: luật bỏ bảng nhóm ra ${lop.ketCucChuan(cu)}`); dc = 1; }
  if (moi.status === "duc" && moi.node_id === mau.kq.node_id) console.log("PASS đối chứng xanh: luật hiện tại đưa dự án giả về nút cũ");
  else { console.log(`FAIL đối chứng xanh: luật hiện tại ra ${moi.status}`); dc = 1; }
}
const sai = Object.entries(lech).filter(([, n]) => n);
if (sai.length) console.log(`FAIL bất biến lệch: ${sai.map(([k, n]) => `${k} ${n}`).join(", ")}`);
else console.log("PASS ba bất biến: không đúc lại nhóm đã có nút, dự án nhóm một nút trỏ nút ấy, nút mới hứa = khoá nhóm chưa có nút");
process.exit(sai.length || dc ? 1 : 0);
