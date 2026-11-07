// danh-ba-vat-the.test.mjs — hồ sơ danh-ba-toa-truc-can: lõi thuần (kế hoạch đúc, ứng viên toà, phường) và E11
// (DBV-AC-11a — FILL thật của sync-cloud không chứa vật thể). Không DB; dữ liệu tổng hợp tiền tố Q.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FILL } from "../sync-cloud.mjs";
import {
  chuanHoaTenToa, keHoachDung, kiemFill, moiKhoa, phuongCuaToa, ungVienTuTin, upiToa,
} from "./danh-ba-vat-the.mjs";

let dem = 0;
const khoaGia = (t) => `${t}_${String(++dem).padStart(26, "0")}`;
const dong = (p, ma, khu = 1, iso = "VN-HN", subdivision = null) => ({ project_id: p, product_code: ma, khu_id: khu, iso, subdivision });

test("khoá vật thể đúng khuôn ULID Crockford, UPI neo toà", () => {
  for (const t of ["bld", "stk", "unt"]) assert.match(moiKhoa(t), new RegExp(`^${t}_[0-9A-HJKMNP-TV-Z]{26}$`));
  assert.throws(() => moiKhoa("pty"), /tiền tố vật thể lạ/);
  assert.equal(upiToa("VN-SG", "bld_X"), "urn:onehub:upi:1:VN:VN-SG:bld_X");
});

test("chuẩn hoá tên toà: chữ thường, khoảng, gạch, dấu", () => {
  for (const s of ["pr 6", "Pr6", "PR-6", "pr_6", " PR6 "]) assert.equal(chuanHoaTenToa(s), "PR6");
  assert.equal(chuanHoaTenToa("Q2.17"), "Q2.17");
  assert.equal(chuanHoaTenToa("Tòa Đ1"), "TOAD1");
});

test("kế hoạch đúc: lưới 3 trục × 10 tầng chỉ 7 mã → 7 căn; lần hai trên bí danh lần một → 0 khoá mới", () => {
  const ma = ["Q12-01-01", "Q12-02-01", "Q12-03-02", "Q12-04-02", "Q12-05-03", "Q12-09-03", "Q12-10-03"];
  const biDanh = new Map();
  const k1 = keHoachDung({ dongS08: ma.map((m) => dong("q1", m)), biDanh, taoKhoa: khoaGia });
  assert.equal(k1.toa.length, 1);
  assert.equal(k1.truc.length, 3);
  assert.equal(k1.can.length, 7, "DBV-AC-5 đúc căn không bằng chứng");
  assert.equal(k1.biDanhMoi.length, 1 + 3 + 7);
  const k2 = keHoachDung({ dongS08: ma.map((m) => dong("q1", m)), biDanh, taoKhoa: khoaGia });
  assert.equal(k2.biDanhMoi.length, 0, "DBV-AC-4 dựng lại đổi khoá");
  assert.deepEqual(k2.can.map((c) => c.key).sort(), k1.can.map((c) => c.key).sort());
  assert.ok(k2.toa.every((t) => !t.moi));
});

test("kế hoạch đúc: hai dự án cùng khu cùng mã → hai khoá; mã trùng ở hai lần chụp đếm một lần; mã lạ vào sổ lý do", () => {
  const k = keHoachDung({
    dongS08: [dong("q1", "Q12-01-01"), dong("q2", "Q12-01-01"), dong("q1", "Q12-01-01"), dong("q1", "Q12A-QQQQ-02"), dong("q1", "")],
    biDanh: new Map(), taoKhoa: khoaGia,
  });
  assert.equal(k.toa.length, 2, "DBV-AC-3 hai dự án chung khoá");
  assert.equal(k.can.length, 2);
  assert.deepEqual(k.soLyDo.sort((a, b) => a.ly_do.localeCompare(b.ly_do)),
    [{ project_id: "q1", ly_do: "khong-khop-khuon", so: 1 }, { project_id: "q1", ly_do: "ma-rong", so: 1 }]);
  assert.deepEqual(k.tiLe[1], { n: 4, tach: 2 });
});

test("kế hoạch đúc: toà thuộc phân khu khớp tên → cha vùng là phân khu; không khớp → khu", () => {
  const pk = new Map([[1, [{ id: 9, ten: ["q phan khu", "qpk"] }]]]);
  const k = keHoachDung({ dongS08: [dong("q1", "Q12-01-01", 1, "VN-HN", "QPK"), dong("q1", "Q13-01-01", 1, "VN-HN", "Q Khác")],
    biDanh: new Map(), phanKhuTheoKhu: pk, taoKhoa: khoaGia });
  const theoMa = Object.fromEntries(k.toa.map((t) => [t.ma_toa, t.region_node_id]));
  assert.deepEqual(theoMa, { Q12: 9, Q13: 1 });
});

test("DBV-AC-8 ứng viên từ tin: năm ca ma trận", () => {
  const toaTheoKhu = new Map([[1, new Map([["QA6", ["bld_a"]], ["QB1", ["bld_b1", "bld_b2"]]])]]);
  const pb = (subject, value, khu, nguoi, nhom) => ({ subject_key: subject, value, khu_id: khu, nguoi, nhom });
  const kq = ungVienTuTin({
    toaTheoKhu,
    phatBieu: [
      pb("S03:1", "Qa6", 1, "n1", "g1"), // (a) khớp đúng một
      pb("S03:2", "QB1", 1, "n1", "g1"), // (b) khớp hai
      pb("S03:3", "QZ9", 1, "n1", "g1"), // (c) không khớp, hai người
      pb("S03:4", "QZ9", 1, "n2", "g1"),
      pb("S03:5", "QY9", 1, "n1", "g1"), // (d) không khớp, ba người, ba nhóm → vẫn chỉ ứng viên
      pb("S03:6", "QY9", 1, "n2", "g2"),
      pb("S03:7", "QY9", 1, "n3", "g3"),
      pb("S03:8", "QA6", null, "n1", "g1"), // (e) không có khu
    ],
  });
  assert.deepEqual(kq.biDanhTen, [{ object_key: "bld_a", value: "QA6", source: "S03" }]);
  const uv = Object.fromEntries(kq.ungVien.map((u) => [u.ten, u]));
  assert.equal(uv.QB1.khop, 2);
  assert.deepEqual([uv.QZ9.so_nguoi_dang, uv.QZ9.so_nhom], [2, 1]);
  assert.deepEqual([uv.QY9.so_nguoi_dang, uv.QY9.so_nhom], [3, 3]);
  assert.equal(kq.ungVien.length, 3);
});

test("DBV-AC-12 phường của toà: năm ca ma trận", () => {
  const cap = new Map([["p1", "submarket"], ["p2", "submarket"], ["m1", "market"]]);
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["p1"] }, khu: { id: 1, area_ids: ["p1"] }, cap }), { area_id: "p1", nut_vung: 1 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["p1", "p2"] }, khu: { id: 1, area_ids: ["p1", "p2"] }, cap }),
    { ly_do: "khu-nhieu-phuong", nut_vung: 1 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 9, area_ids: ["p2"] }, khu: { id: 1, area_ids: ["p1", "p2"] }, cap }), { area_id: "p2", nut_vung: 9 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 9, area_ids: [] }, khu: { id: 1, area_ids: ["m1"] }, cap }), { ly_do: "khong-co-phuong", nut_vung: 1 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["m1", "p1"] }, khu: { id: 1, area_ids: ["m1", "p1"] }, cap }), { area_id: "p1", nut_vung: 1 });
});

test("DBV-AC-11a FILL thật của sync-cloud không chứa vật thể; đối chứng dương bắt được", () => {
  assert.deepEqual(kiemFill(FILL), []);
  assert.deepEqual(kiemFill([...FILL, "units"]), ["DBV-AC-11 vật thể lên cloud: units"]);
  assert.deepEqual(kiemFill([...FILL, "registry_aliases"]), ["DBV-AC-11 vật thể lên cloud: registry_aliases ma_nguon"]);
  const loc = (bang, rows) => rows.filter((r) => !(r.kind === "ma_nguon") && !/^bld_/.test(r.subject_key ?? ""));
  assert.deepEqual(kiemFill([...FILL, "registry_aliases", "field_assertions"], { chonDong: loc }), []);
  assert.deepEqual(kiemFill([...FILL, "registry_aliases"], { chonDong: () => [] }),
    ["DBV-AC-11 bộ chọn dòng bỏ cả dòng không phải vật thể: registry_aliases"]);
});
