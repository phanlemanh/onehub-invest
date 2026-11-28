#!/usr/bin/env node
// bat-bien-that.mjs — DA65 E3 (AC-3): bất biến «nhóm đã đúc thì không đúc lại» trên DB máy thu, CHỈ ĐỌC (giao dịch READ ONLY).
//   node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs     thoát 0 = đạt, 1 = lệch (in loại lỗi + số), 2 = hỏng
// Đầu vào đọc bằng chính docDauVao + dungTheLuat của lệnh luật (không chép SQL). Ba phần, phần nào đỏ thì thoát 1:
//   (A) Bất biến trên thẻ thật: (1) ngả đúc chưa có nút thì khoá nhóm chưa có nút S08; (2) khoá nhóm đúng một nút thì trỏ nút ấy;
//       (3) số nút mới thẻ hứa = số khoá nhóm chưa có nút. Đây là BẤT BIẾN — dữ liệu hôm nay không có ca vi phạm nên (A) xanh cả
//       trên mã trước DA65; phép PHÂN BIỆT có sửa hay không là (C) dưới đây và E4 (áp lần hai trên bản chép).
//   (B) Đối chứng dương cho chính bộ đếm: cấy trong bộ nhớ trên thẻ thật ba vi phạm (một dự án nhóm đã có nút bỏ node_id, một dự án
//       trỏ nút khác, số nút hứa lệch 1) — mỗi lần cấy bộ đếm phải đếm đúng loại đó. Không ghi DB.
//   (C) Phân biệt: dự án giả cùng khoá với một dự án đã đúc (không ghi DB) — luật bỏ bảng nhóm đã đúc phải đúc nhóm mới, luật hiện
//       tại phải về nút cũ. Trên mã trước DA65 (lib/noi-du-an-s08-lop.mjs ở main) vế «luật hiện tại» đỏ → thoát 1.
// Không in tên hay mã dự án.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GOC = execFileSync("git", ["-C", import.meta.dirname, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const luat = await import(pathToFileURL(join(GOC, "pipeline/noi-du-an-s08-luat.mjs")).href);
const lop = await import(pathToFileURL(join(GOC, "pipeline/lib/noi-du-an-s08-lop.mjs")).href);

/** Bộ đếm thuần: số vi phạm theo loại trên một thẻ và bảng nhóm đã đúc. */
export function demViPham(the, daDuc) {
  const duc = the.ds.filter((d) => d.kq.status === "duc");
  const lech = { duc_lai_nhom_da_co: 0, khong_tro_nut_nhom: 0, nut_moi_lech: 0 };
  for (const d of duc) {
    const co = d.tinhId ? daDuc.get(lop.khoaNhom(d.ten, d.tinhId)) ?? [] : [];
    if (d.kq.node_id == null && co.length) lech.duc_lai_nhom_da_co++;
    if (co.length === 1 && d.kq.node_id != null && d.kq.node_id !== co[0]) lech.khong_tro_nut_nhom++;
  }
  const khoaMoi = new Set(duc.filter((d) => d.kq.node_id == null).map((d) => d.kq.nhom)).size;
  if (the.soNutMoi !== khoaMoi) lech.nut_moi_lech = Math.abs(the.soNutMoi - khoaMoi);
  return lech;
}

const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
let the, vao;
try {
  await c.connect();
  await c.query("BEGIN READ ONLY");
  vao = await luat.docDauVao(c);
  the = await luat.dungTheLuat(c);
  await c.query("ROLLBACK");
} catch (e) {
  console.log(`HONG không đọc được DB: ${e.message}`);
  process.exit(2);
} finally { await c.end().catch(() => {}); }
const { nut, daDuc } = vao;
let loi = 0;

// (A)
const duc = the.ds.filter((d) => d.kq.status === "duc");
const v = [...daDuc.values()];
console.log(`dự án ${the.ds.length} · ngả đúc ${duc.length} (vào nút cũ ${duc.filter((d) => d.kq.node_id != null).length}, nút mới hứa ${the.soNutMoi})`
  + ` · nhóm có nút S08 ${v.length} (một nút ${v.filter((x) => x.length === 1).length}, từ hai nút ${v.filter((x) => x.length > 1).length})`);
const sai = Object.entries(demViPham(the, daDuc)).filter(([, n]) => n);
if (sai.length) { console.log(`FAIL (A) bất biến lệch: ${sai.map(([k, n]) => `${k} ${n}`).join(", ")}`); loi = 1; }
else console.log("PASS (A) ba bất biến: không đúc lại nhóm đã có nút, dự án nhóm một nút trỏ nút ấy, nút mới hứa = khoá nhóm chưa có nút");

// (B) mẫu: dự án đúc vào nút cũ, khoá nhóm đúng một nút.
const mau = duc.find((d) => d.kq.node_id != null && d.tinhId && (daDuc.get(lop.khoaNhom(d.ten, d.tinhId)) ?? []).length === 1);
if (!mau) { console.log("FAIL (B)(C) không có dự án đã đúc vào nhóm một nút làm mẫu — thước không đo được gì"); process.exit(1); }
const cay = (doi) => ({ ...the, ...doi.the, ds: the.ds.map((d) => (d === mau && doi.kq ? { ...d, kq: { ...d.kq, ...doi.kq } } : d)) });
const khac = nut.find((n) => n.id !== mau.kq.node_id)?.id ?? -1;
for (const [loai, doi] of [
  ["duc_lai_nhom_da_co", { kq: { node_id: undefined, nhom: lop.khoaNhom(mau.ten, mau.tinhId) }, the: { soNutMoi: the.soNutMoi + 1 } }],
  ["khong_tro_nut_nhom", { kq: { node_id: khac } }],
  ["nut_moi_lech", { the: { soNutMoi: the.soNutMoi + 1 } }],
]) {
  const n = demViPham(cay(doi), daDuc)[loai];
  if (n === 1) console.log(`PASS (B) đối chứng dương: cấy ${loai} → bộ đếm đếm 1`);
  else { console.log(`FAIL (B) đối chứng dương: cấy ${loai} mà bộ đếm đếm ${n}`); loi = 1; }
}

// (C)
const gia = { ma: "gia-da65", ten: `${mau.ten}_TT`, tinh: mau.tinhId };
const cu = lop.phanLopS08(gia, nut, null, null), moi = lop.phanLopS08(gia, nut, null, daDuc);
if (cu.status === "duc" && cu.node_id == null && cu.nhom) console.log("PASS (C) đối chứng đỏ: bỏ bảng nhóm đã đúc thì dự án giả cùng khoá đúc nhóm mới");
else { console.log(`FAIL (C) đối chứng đỏ: luật bỏ bảng nhóm ra ${cu.status}`); loi = 1; }
if (moi.status === "duc" && moi.node_id === mau.kq.node_id) console.log("PASS (C) phân biệt: luật hiện tại đưa dự án giả về nút cũ");
else { console.log(`FAIL (C) phân biệt: luật hiện tại ra ${moi.status}${moi.node_id == null ? " (nhóm mới)" : " (nút khác)"}`); loi = 1; }
process.exit(loi);
