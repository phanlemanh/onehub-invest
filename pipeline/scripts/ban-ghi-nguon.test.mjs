// ban-ghi-nguon.test.mjs — DA3 bang-noi-ma-du-an AC-1 (hàm thuần): quy ước rỗng giả, tỉnh cũ qua area_aliases, S10 không vị trí.
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chuyenS07, chuyenS08, chuyenS10, dungVung, trongGia } from "../lib/ban-ghi-nguon.mjs";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "../lib");
const TAM = mkdtempSync(join(tmpdir(), "da3-bgn-"));
after(() => rmSync(TAM, { recursive: true, force: true }));

// Ma trận rỗng giả 10 ô (Hỏi-1): 6 về null, 4 giữ làm đối chứng dương.
const MA_TRAN = [
  ["", null], ["Đang cập nhật", null], ["--", null], ["-", null], ["0", null], ["N/A", null],
  ["Khác", "Khác"], ["Liên hệ", "Liên hệ"], ["Vinhomes", "Vinhomes"], ["0 m2", "0 m2"],
];

function kiemMaTran(fn) {
  assert.equal(MA_TRAN.length, 10);
  for (const [vao, ra] of MA_TRAN) assert.equal(fn(vao), ra, `rỗng giả «${vao}» phải ra ${ra === null ? "null" : `«${ra}»`}`);
}

test("BN-AC-1 rong-gia-ma-tran-10-o", () => kiemMaTran(trongGia));

test("BN-AC-1 chieu-do: bo «N/A» khoi RONG_GIA thi o ay do, goi ten gia tri", async () => {
  const goc = readFileSync(join(LIB, "ban-ghi-nguon.mjs"), "utf8");
  const tu = '["", "Đang cập nhật", "--", "-", "0", "N/A"]';
  assert.ok(goc.includes(tu), "đột biến không áp được");
  const ban = goc.replace(tu, '["", "Đang cập nhật", "--", "-", "0"]')
    .replace(/from "\.\/([^"]+)"/g, (_m, t) => `from "${pathToFileURL(join(LIB, t)).href}"`);
  const f = join(TAM, "ban-ghi-nguon-dot.mjs");
  writeFileSync(f, ban);
  const m = await import(pathToFileURL(f).href);
  assert.throws(() => kiemMaTran(m.trongGia), /rỗng giả «N\/A»/);
});

const ctx = (coAlias = true) => dungVung({
  markets: [{ id: "vn-hcmc", name: "Thành phố Hồ Chí Minh", admin_code: "79" }, { id: "vn-hanoi", name: "Thành phố Hà Nội", admin_code: "01" }],
  subs: [{ id: "vn-hcmc-thu-dau-mot", name: "Phường Thủ Dầu Một", parent_id: "vn-hcmc", admin_code: "25747" }],
  tinhCu: coAlias ? [{ o: "74", n: "79" }, { o: "79", n: "79" }] : [{ o: "79", n: "79" }],
  aa: [],
});

test("BN-AC-1 tinh-cu-qua-area-aliases", () => {
  const r = { ma: "1", ten: "Dự án A", dia_chi: "Phường Thủ Dầu Một, Tỉnh Bình Dương", tinh_diem: null, xa_diem: null };
  const b = chuyenS07(r, ctx(true));
  assert.equal(b.tinh, "vn-hcmc");
  assert.equal(b.tinh_tu, "chu");
  assert.equal(b.ly_do_trong, null);
  const thieu = chuyenS07(r, ctx(false));
  assert.equal(thieu.tinh, null, "thiếu alias của mã cũ thì tỉnh null, không ra tỉnh khác");
  assert.equal(thieu.ly_do_trong, "tinh-cu-khong-anh-xa");
});

test("BN-AC-1 diem-truoc-chu-sau", () => {
  const r = { ma: "2", ten: "B", dia_chi: "Hà Nội", tinh_diem: "vn-hcmc", xa_diem: null, lat: 10.8, lng: 106.7 };
  const b = chuyenS07(r, ctx());
  assert.equal(b.tinh, "vn-hcmc");
  assert.equal(b.tinh_tu, "diem");
  assert.deepEqual(b.diem, { lat: 10.8, lng: 106.7 });
});

test("BN-AC-1 s10-khong-vi-tri", () => {
  const b = chuyenS10({ ma: "X", ten: "A", cha_ten: "Đang cập nhật" });
  assert.equal(b.tinh, null);
  assert.equal(b.ly_do_trong, "khong-vi-tri");
  assert.equal(b.ma_cha, null, "tên cha rỗng giả về null");
});

test("BN-AC-1 s08-ten-goc-va-cdt-khac-giu", () => {
  const b = chuyenS08({ ma: "9", ten: "TMDV SMART CITY_TT", dia_chi: "Hà Nội", cdt: "KHÁC", loai: "Căn hộ", tinh_diem: null, xa_diem: null }, ctx());
  assert.equal(b.ten_goc, "SMART CITY");
  assert.equal(b.cdt, "KHÁC", "«Khác» là giá trị thật, giữ");
  assert.equal(b.tinh, "vn-hanoi");
});
