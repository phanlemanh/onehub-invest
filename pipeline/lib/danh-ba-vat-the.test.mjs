// danh-ba-vat-the.test.mjs — hồ sơ danh-ba-toa-truc-can: lõi thuần (kế hoạch đúc, ứng viên toà, phường) và E11
// (DBV-AC-11a — FILL thật của sync-cloud không chứa vật thể). Không DB; dữ liệu tổng hợp tiền tố Q.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FILL } from "../sync-cloud.mjs";
import {
  THONG_DIEP, chuanHoaTenToa, keHoachDung, kiemDich, kiemFill, moiKhoa, nhanSo, phuongCuaToa, soDem, thamSoTuUrl,
  ungVienTuTin, upiToa,
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
  assert.deepEqual(kq.biDanhTen, [{ object_key: "bld_a", value: "Qa6", source: "S03" }]);
  const uv = Object.fromEntries(kq.ungVien.map((u) => [u.ten, u]));
  assert.equal(uv.QB1.khop, 2);
  assert.deepEqual([uv.QZ9.so_nguoi_dang, uv.QZ9.so_nhom], [2, 1]);
  assert.deepEqual([uv.QY9.so_nguoi_dang, uv.QY9.so_nhom], [3, 3]);
  assert.equal(kq.ungVien.length, 3);
});

test("DBV-AC-12 phường của toà: sáu ca ma trận", () => {
  const cap = new Map([["p1", "submarket"], ["p2", "submarket"], ["m1", "market"]]);
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["p1"] }, khu: { id: 1, area_ids: ["p1"] }, cap }), { area_id: "p1", nut_vung: 1 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["p1", "p2"] }, khu: { id: 1, area_ids: ["p1", "p2"] }, cap }),
    { ly_do: "khu-nhieu-phuong", nut_vung: 1 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 9, area_ids: ["p2"] }, khu: { id: 1, area_ids: ["p1", "p2"] }, cap }), { area_id: "p2", nut_vung: 9 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 9, area_ids: [] }, khu: { id: 1, area_ids: ["m1"] }, cap }), { ly_do: "khong-co-phuong", nut_vung: 1 });
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["m1", "p1"] }, khu: { id: 1, area_ids: ["m1", "p1"] }, cap }), { area_id: "p1", nut_vung: 1 });
  // (f) một mã vùng không có trong areas (mã cũ) → không đoán dù chỉ còn một phường biết được.
  assert.deepEqual(phuongCuaToa({ nutVung: { id: 1, area_ids: ["p1", "p-cu"] }, khu: { id: 1, area_ids: ["p1", "p-cu"] }, cap }),
    { ly_do: "vung-khong-ro", nut_vung: 1 }, "DBV-AC-12 đoán phường khi có mã vùng lạ");
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

// ---------------- DB1b dung-danh-ba-may-thu: đích ghi (DBM-AC-1, DBM-AC-2), so bản chép (DBM-AC-8) ----------------

/** Đặt PGHOST trong lúc gọi fn rồi trả lại như cũ. */
function voiPgHost(gt, fn) {
  const cu = process.env.PGHOST;
  if (gt === undefined) delete process.env.PGHOST; else process.env.PGHOST = gt;
  try { return fn(); } finally { if (cu === undefined) delete process.env.PGHOST; else process.env.PGHOST = cu; }
}

// Ma trận viết trước (AC-1): 3 tên × 3 máy × 2 cờ = 18 ô; kỳ vọng ghi được hay không.
const TEN_AC1 = [["oneinvest_dbv_x", "thu"], ["oneinvest", "that"], ["postgres", "that"]];
const MAY_AC1 = ["localhost", "127.0.0.1", "[::1]"];
const MA_TRAN_AC1 = TEN_AC1.flatMap(([ten, loai]) => MAY_AC1.flatMap((may) => [false, true].map((co) => ({
  url: `postgres://${may}:5433/${ten}`, co, ghi: loai === "thu" || co, loai,
}))));

/** Soát AC-1 bằng một cặp (thamSoTuUrl, kiemDich); trả thông điệp lỗi ghim. */
function soatAC1(kiem, thamSo = thamSoTuUrl) {
  const loi = [];
  for (const o of MA_TRAN_AC1) {
    const kq = voiPgHost(undefined, () => kiem(thamSo(o.url), { dbThat: o.co }));
    if (kq.ok !== o.ghi) loi.push(`DBM-AC-1 ${o.ghi ? "chặn nhầm" : "ghi DB máy thu không cờ"}: ${o.url} cờ=${o.co}`);
    else if (kq.ok && kq.loai !== o.loai) loi.push(`DBM-AC-1 sai loại đích: ${o.url}`);
    else if (!kq.ok && !kq.ly_do.includes("--db-that")) loi.push(`DBM-AC-1 thông điệp thiếu --db-that: ${o.url}`);
  }
  return loi;
}

test("DBM-AC-1 bảng đích: 18 ô, DB thử ghi không cờ, mọi đích khác chỉ ghi với --db-that", () => {
  assert.equal(MA_TRAN_AC1.length, 18);
  assert.deepEqual(soatAC1(kiemDich), []);
  // Chiều đỏ: bản sai coi mọi tên trên máy này là DB thử.
  const sai = (t, o) => (t ? { ok: true, loai: "thu" } : kiemDich(t, o));
  assert.ok(soatAC1(sai).some((l) => l.startsWith("DBM-AC-1 ghi DB máy thu không cờ")), "DBM-AC-1 thước không bắt được bản sai");
});

const MK = "matkhau" + "-bi-mat"; // mật khẩu mẫu, nối chuỗi để bộ quét khoá không bắt nhầm
const NGOAI = "db.abcd.supabase.co";
// Ma trận viết trước (AC-2): 6 đích ngoài máy + 2 URL hỏng, × 2 cờ = 16 ô; thêm 2 đối chứng dương.
const DICH_AC2 = [
  { url: `postgres://u:${MK}@${NGOAI}:5432/postgres`, ly: THONG_DIEP.ngoai },
  { url: `postgres://u:${MK}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`, ly: THONG_DIEP.ngoai },
  { url: "postgres://10.0.0.5:5432/oneinvest", ly: THONG_DIEP.ngoai },
  { url: "postgres://may-khac.local:5432/oneinvest", ly: THONG_DIEP.ngoai },
  { url: `postgres://localhost/oneinvest_x?host=${NGOAI}`, ly: THONG_DIEP.ngoai },
  { url: "postgres:///oneinvest_x", pghost: NGOAI, ly: THONG_DIEP.ngoai },
  { url: "postgres://localhost:5433", ly: THONG_DIEP.hong },
  { url: "khong-phai-url", ly: THONG_DIEP.hong },
];
const DUONG_AC2 = [
  { url: "postgres:///oneinvest_x", pghost: "localhost" },
  { url: "postgres://%2Ftmp/oneinvest_x" },
];

function soatAC2(kiem, thamSo = thamSoTuUrl) {
  const loi = [];
  let so = 0;
  for (const d of DICH_AC2) for (const co of [false, true]) {
    so++;
    const kq = voiPgHost(d.pghost, () => kiem(thamSo(d.url), { dbThat: co }));
    if (kq.ok) loi.push(co ? `DBM-AC-2 cờ mở đích ngoài máy: ${d.url}` : `DBM-AC-2 kiểm khác máy pg nối: ${d.url}`);
    else if (kq.ly_do !== d.ly) loi.push(`DBM-AC-2 thông điệp sai: ${d.url}`);
    else if (kq.ly_do.includes(MK) || kq.ly_do.includes(d.url)) loi.push(`DBM-AC-2 lộ URL hay mật khẩu: ${d.url}`);
  }
  for (const d of DUONG_AC2) {
    so++;
    const kq = voiPgHost(d.pghost, () => kiem(thamSo(d.url), { dbThat: false }));
    if (!(kq.ok && kq.loai === "thu")) loi.push(`DBM-AC-2 chặn nhầm máy này: ${d.url}`);
  }
  return { loi, so };
}

test("DBM-AC-2 ngoài máy: 16 ô bị từ chối theo máy chủ pg thật, 2 đối chứng dương ghi được, không lộ mật khẩu", () => {
  const { loi, so } = soatAC2(kiemDich);
  assert.equal(so, 18);
  assert.deepEqual(loi, []);
  // Chiều đỏ 1: đọc máy chủ bằng new URL().hostname thay vì connectionParameters → ô ?host= và PGHOST lọt.
  const thamSoUrl = (u) => {
    try { const x = new URL(u); const db = x.pathname.slice(1); return db ? { host: x.hostname || "localhost", database: db } : null; } catch { return null; }
  };
  assert.ok(soatAC2(kiemDich, thamSoUrl).loi.some((l) => l.startsWith("DBM-AC-2 kiểm khác máy pg nối")),
    "DBM-AC-2 thước không bắt được bản đọc URL thô");
  // Chiều đỏ 2: --db-that mở máy chủ ngoài.
  const moCo = (t, o) => (o.dbThat && t ? { ok: true, loai: "that" } : kiemDich(t, o));
  assert.ok(soatAC2(moCo).loi.some((l) => l.startsWith("DBM-AC-2 cờ mở đích ngoài máy")), "DBM-AC-2 thước không bắt được cờ mở");
});

test("DBM-AC-8 soDem, nhanSo: hai chiều", () => {
  const a = new Map([["q-khu-mot", { toa: 2, truc: 3, can: 7 }], ["q-khu-hai", { toa: 2, truc: 2, can: 3 }]]);
  assert.deepEqual(soDem(a, new Map(a)), []);
  const b = new Map(a); b.set("q-khu-mot", { toa: 2, truc: 3, can: 8 });
  assert.deepEqual(soDem(a, b), [{ khu: "q-khu-mot", cap: "can", may: 7, ban: 8 }], "DBM-AC-8 lệch");
  assert.equal(nhanSo(a), "so");
  assert.equal(nhanSo(new Map()), "chua-so");
  assert.equal(nhanSo(new Map([["x", { toa: 0, truc: 0, can: 0 }]])), "chua-so");
});

// ---- DV1 nut-du-an-tro-xa-moi (E1, E2, E5, E8): tệp xã của nút, suy mã theo mã, bẫy cùng tên, tài liệu. Không DB. ----
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { kiemMucXa, kiemTepXa, slugNutTuSeed, traXaCuTheoTen, xaMoiCuaNut } from "./danh-ba-vat-the.mjs";
import { docDanhBa, idXa, slugTrungTrongTinh, thiTruongCuaTinh } from "./dvhc.mjs";

const GOC_DV1 = join(import.meta.dirname, "../..");
const GOC_VONG_DV1 = "56ca87d1e7777aee6c6b586ac63e1624506fb754";
const TEP_XA_THAT = JSON.parse(readFileSync(join(GOC_DV1, "pipeline/data/xa-nut-du-an.json"), "utf8"));
const SLUG_SEED = slugNutTuSeed(readFileSync(join(GOC_DV1, "db/migrations/026_asset_nodes.sql"), "utf8"));
const banSao = () => structuredClone(TEP_XA_THAT);

test("DV1-AC-1 tệp xã thật đủ 20 nút của seed, mỗi mục đúng khuôn; năm phá đỏ đúng thông điệp", () => {
  assert.equal(SLUG_SEED.length, 20, "DV1-AC-1 seed 026 phải có 20 nút dự án");
  const nut = TEP_XA_THAT.nut;
  for (const s of SLUG_SEED) assert.ok(s in nut, `DV1-AC-1 thiếu nút ${s}`);
  assert.deepEqual(Object.keys(nut).filter((s) => !SLUG_SEED.includes(s)), [], "DV1-AC-1 slug lạ");
  for (const [s, m] of Object.entries(nut)) assert.deepEqual(kiemMucXa(s, m), [], `DV1-AC-1 ${s}: khuôn`);
  assert.deepEqual(kiemTepXa(TEP_XA_THAT, SLUG_SEED), [], "DV1-AC-1 tệp thật lành");
  const pha = (sua) => { const t = banSao(); sua(t.nut); return kiemTepXa(t, SLUG_SEED); };
  assert.ok(pha((n) => delete n["ecopark"]).includes("thiếu nút ecopark"), "DV1-AC-1 thiếu nút ecopark");
  assert.ok(pha((n) => { n["khu-la"] = n["ecopark"]; }).includes("slug lạ khu-la"), "DV1-AC-1 slug lạ khu-la");
  assert.ok(pha((n) => { delete n["ecopark"].xa_cu[0].nguon.url; }).includes("ecopark: thieu-nguon"), "DV1-AC-1 ecopark: thieu-nguon");
  assert.ok(pha((n) => { delete n["vinhomes-grand-park"].nguon_chon; }).includes("vinhomes-grand-park: thieu-nguon"),
    "DV1-AC-1 vinhomes-grand-park: thieu-nguon");
  assert.ok(pha((n) => { delete n["saluto"].ly_do; }).includes("saluto: thieu-ly-do"), "DV1-AC-1 saluto: thieu-ly-do");
});

// Bảng tổng hợp: Q1 nguyên → A; Q2 tách → {A, B}; Q3 nguyên → B; P1, P2 cùng tên «An Phú» khác mã (bẫy).
const NGUON = { ten: "Nguồn thử", url: "https://vi-du.invalid/x" };
const xc = (old_code) => ({ old_code, ten: "x", huyen: "h", nguon: NGUON });
const BANG = {
  biDanh: new Map([["11111", { targets: ["90001"], split: false }], ["22222", { targets: ["90001", "90002"], split: true }],
    ["33333", { targets: ["90002"], split: false }], ["27091", { targets: ["90010"], split: false }],
    ["25975", { targets: ["90020"], split: false }], ["44444", { targets: ["90009"], split: false }]]),
  maXa: new Map([["90001", { id: "q-xa-a", region_type: "submarket" }], ["90002", { id: "q-xa-b", region_type: "submarket" }],
    ["90010", { id: "q-an-phu-thu-duc", region_type: "submarket" }], ["90020", { id: "q-an-phu-thuan-an", region_type: "submarket" }]]),
  thiTruong: new Set(["q-tinh"]),
};

test("DV1-AC-2 suy mã: bốn đường đúng, sáu lỗi mỗi lỗi một mã có đối chứng lành, bẫy cùng tên ra hai mã", () => {
  const o = (muc, mong, tin) => assert.deepEqual(xaMoiCuaNut(muc, BANG), mong, tin);
  o({ cap: "xa", xa_cu: [xc("11111")] }, { area_ids: ["q-xa-a"] }, "DV1-AC-2 xã cũ nguyên");
  o({ cap: "xa", xa_cu: [xc("22222")], chon: ["90002"], nguon_chon: NGUON }, { area_ids: ["q-xa-b"] }, "DV1-AC-2 tách có chon");
  o({ cap: "xa", xa_cu: [xc("11111"), xc("33333"), xc("11111")] }, { area_ids: ["q-xa-a", "q-xa-b"] }, "DV1-AC-2 nhiều xã cũ, khử trùng");
  o({ cap: "tinh", tinh: "q-tinh", ly_do: "chưa chốt" }, { area_ids: ["q-tinh"] }, "DV1-AC-2 cấp tỉnh");
  o({ cap: "xa", xa_cu: [xc("11111")], chon: ["90001"], nguon_chon: NGUON }, { area_ids: ["q-xa-a"] }, "DV1-AC-2 chon khi không tách");
  // Sáu lỗi: mỗi ô phá đúng một chỗ của một mục lành.
  o({ cap: "xa", xa_cu: [{ ...xc("11111"), nguon: { ten: "x" } }] }, { loi: "thieu-nguon" }, "DV1-AC-2 thieu-nguon");
  o({ cap: "xa", xa_cu: [xc("55555")] }, { loi: "xa-cu-khong-co" }, "DV1-AC-2 xa-cu-khong-co");
  o({ cap: "xa", xa_cu: [xc("22222")] }, { loi: "can-chon-xa" }, "DV1-AC-2 can-chon-xa");
  o({ cap: "xa", xa_cu: [xc("22222")], chon: ["90010"], nguon_chon: NGUON }, { loi: "chon-ngoai-dich" }, "DV1-AC-2 chon-ngoai-dich");
  o({ cap: "xa", xa_cu: [xc("44444")] }, { loi: "ma-khong-co" }, "DV1-AC-2 ma-khong-co");
  o({ cap: "tinh", tinh: "q-tinh-khac", ly_do: "chưa chốt" }, { loi: "tinh-khong-co" }, "DV1-AC-2 tinh-khong-co");
  // Bẫy cùng tên: hai xã cũ «An Phú» khác mã → hai khu vực khác nhau.
  const a = xaMoiCuaNut({ cap: "xa", xa_cu: [xc("27091")] }, BANG);
  const b = xaMoiCuaNut({ cap: "xa", xa_cu: [xc("25975")] }, BANG);
  assert.deepEqual([a.area_ids, b.area_ids], [["q-an-phu-thu-duc"], ["q-an-phu-thuan-an"]], "DV1-AC-2 bẫy cùng tên");
});

/** Bảng thật từ dữ liệu PX1 (cùng nguồn bộ nạp), id khu vực theo idXa của bộ nạp. */
function bangThat() {
  const D = docDanhBa();
  const biDanh = new Map(D.xaCu.map((r) => [r.ma, { targets: r.vao, split: r.vao.length > 1 }]));
  const maXa = new Map();
  for (const t of D.tinh) {
    const cua = D.xa.filter((x) => x.maTinh === t.ma);
    const trung = slugTrungTrongTinh(cua);
    for (const x of cua) maXa.set(x.ma, { id: idXa(x, thiTruongCuaTinh(t.ma), trung, new Set()), region_type: "submarket" });
  }
  return { D, bang: { biDanh, maXa, thiTruong: new Set(D.tinh.map((t) => thiTruongCuaTinh(t.ma))) } };
}

test("DV1-AC-5 Grand Park về Long Bình từ hai xã cũ có nguồn; ba bẫy cùng tên không lọt; suy theo tên thì lệch", () => {
  const { D, bang } = bangThat();
  const gp = TEP_XA_THAT.nut["vinhomes-grand-park"];
  assert.deepEqual(gp.xa_cu.map((x) => x.old_code).sort(), ["26830", "26833"], "DV1-AC-5 Grand Park hai xã cũ");
  for (const x of gp.xa_cu) assert.match(x.nguon.url, /^https?:\/\//, `DV1-AC-5 Grand Park nguồn ${x.old_code}`);
  assert.match(gp.nguon_chon?.url ?? "", /^https?:\/\//, "DV1-AC-5 Grand Park nguồn chọn khi tách");
  const moi = (s) => xaMoiCuaNut(TEP_XA_THAT.nut[s], bang).area_ids ?? [];
  assert.deepEqual(moi("vinhomes-grand-park"), ["vn-hcmc-long-binh"], "DV1-AC-5 Grand Park");
  for (const s of ["estella-heights", "the-global-city"]) assert.ok(!moi(s).includes("vn-hcmc-an-phu"), `DV1-AC-5 ${s} trỏ An Phú Thuận An`);
  assert.ok(!moi("vinhomes-central-park").includes("vn-hcmc-binh-thanh"), "DV1-AC-5 Central Park trỏ Bình Thạnh mới");
  assert.ok(!moi("phu-my-hung").includes("vn-hcmc-tan-phu"), "DV1-AC-5 Phú Mỹ Hưng trỏ Tân Phú");
  // Đối chứng: tra theo TÊN xã cũ trong tỉnh mới (79) thì Estella ra mã khác bản theo mã.
  const theoTen = traXaCuTheoTen(D.xaCu, "79", "An Phú").map((m) => bang.maXa.get(m)?.id).sort();
  assert.notDeepEqual(theoTen, moi("estella-heights"), "DV1-AC-5 suy theo tên lệch");
});

test("DV1-AC-8 tài liệu ghi --sua-xa; bản ở gốc vòng chưa ghi", () => {
  const kiem = (claude, roadmap) => {
    const dong = claude.split("\n").find((l) => l.startsWith("| danh-ba-vat-the.mjs |")) ?? "";
    return dong.includes("--sua-xa") && dong.includes("xa-nut-du-an.json") && roadmap.split("\n").some((l) => l.includes("DV1") && l.includes("--sua-xa"));
  };
  const doc = (p) => readFileSync(join(GOC_DV1, p), "utf8");
  assert.ok(kiem(doc("pipeline/CLAUDE.md"), doc("docs/ROADMAP.md")), "DV1-AC-8 tài liệu chưa ghi --sua-xa");
  const cu = (p) => execFileSync("git", ["show", `${GOC_VONG_DV1}:${p}`], { cwd: GOC_DV1, encoding: "utf8", maxBuffer: 64 << 20 });
  assert.equal(kiem(cu("pipeline/CLAUDE.md"), cu("docs/ROADMAP.md")), false, "DV1-AC-8 tài liệu chưa ghi --sua-xa (đối chứng gốc vòng)");
});
