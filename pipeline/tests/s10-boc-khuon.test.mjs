// 1211-23(a) — khuôn bóc S10: ca lệch cột 177 (giá ở ô 9, không rơi status_raw),
// ca trùng 177/178 chung stock_id (giữ 177), ca 178 giá rỗng. Thuần hàm, không DB.
import test from "node:test";
import assert from "node:assert/strict";
import { bocS10, KHUON_S10 } from "../lib/s10-bang-hang.mjs";

const dong177 = (ma, giaTy = "5223000000 tỷ", trangThai = "") =>
  `<tr class="p_row"><td data-url="x?stock_id=${ma}"></td>` +
  [
    `<td>Thiên Đường Nhiệt Đới</td>`, `<td>Nhiệt Đới 1</td>`, `<td>Liền kề</td>`,
    `<td>60.1 m</td>`, `<td>180 m</td>`, `<td>Liền kề</td>`, `<td>TN</td>`,
    `<td>${trangThai}</td>`, `<td>${giaTy}</td>`, `<td></td>`, `<td></td>`,
    `<td>6834000000</td>`, `<td>06/10/2026</td>`, `<td></td>`, `<td></td>`, `<td></td>`,
    `<td>---</td>`, `<td>---</td>`, `<td></td>`, `<td>TECHCOMBANK</td>`,
    `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`,
  ].join("") + `</tr>`;

const dong178 = (ma, giaTrieu = "") =>
  `<tr class="p_row"><td data-url="x?stock_id=${ma}"></td>` +
  [
    `<td>Quận 9</td>`, `<td>The Global City</td>`, `<td>Căn hộ</td>`,
    `<td></td>`, `<td>75.3 m</td>`, `<td></td>`, `<td>ĐN</td>`, `<td>Tiêu chuẩn CĐT</td>`,
    `<td></td>`, `<td>${giaTrieu}</td>`, `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`, `<td></td>`,
  ].join("") + `</tr>`;

const item = (bt, html) => ({
  source: "s10-bang-hang", sourceId: `p36-bt${bt}`, kind: "stock_table",
  payload: { html },
  meta: { request: { project_id: 36, block_type: String(bt) } },
});

test("khuôn 177: 29 ô — giá ở ô 9 vào list_price_vnd, status_raw KHÔNG là giá", () => {
  const r = bocS10(item(177, dong177("101")));
  assert.equal(r.lechKhuon, 0);
  const d = r.dong[0];
  assert.equal(d.list_price_vnd, "5223000000", "giá «5223000000 tỷ» → 5223000000");
  assert.ok(d.status_raw == null || !/^\d/.test(d.status_raw), "status_raw không là giá");
  assert.equal(d.source_modified_on, "2026-10-06", "ngày ô 13 → yyyy-mm-dd");
  assert.ok((d.remarks_raw ?? "").includes("TECHCOMBANK"), "ghi chú ngân hàng ô 20");
});

test("khuôn 177: dòng lệch số ô → giữ raw, mọi trường NULL", () => {
  const html = dong177("102").replace("<td>TN</td>", ""); // bớt 1 ô → 28
  const r = bocS10(item(177, html));
  assert.equal(r.lechKhuon, 1);
  const d = r.dong[0];
  assert.equal(d.list_price_vnd, null);
  assert.equal(d.lech_khuon, true);
  assert.ok(d.raw_row.includes("stock_id=102"));
});

test("khuôn 178: giá rỗng (ô 10 trống) → list_price_vnd null, không lỗi", () => {
  const r = bocS10(item(178, dong178("201")));
  assert.equal(r.lechKhuon, 0);
  const d = r.dong[0];
  assert.equal(d.list_price_vnd, null, "gia: null khuôn 178");
  assert.equal(d.subdivision_name, "Quận 9", "ô 1 là phân khu (ô 0 là ô mã data-url)");
});

test("khuôn 178 có giá «17000000 triệu»: status_raw giữ nguyên (giới hạn đã biết — 1211-23)", () => {
  const r = bocS10(item(178, dong178("202", "17000000 triệu")));
  const d = r.dong[0];
  assert.equal(d.status_raw, "17000000 triệu", "giữ nguyên — giới hạn đã biết, không suy giá");
  assert.equal(d.list_price_vnd, null);
});

test("KHUON_S10: 177 không có cột trạng thái (1211-22), 178 gia null", () => {
  assert.equal(KHUON_S10[177].trangThai, null);
  assert.equal(KHUON_S10[177].gia, 9);
  assert.equal(KHUON_S10[178].gia, null);
});
