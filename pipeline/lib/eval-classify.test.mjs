// eval-classify.test.mjs — hồ sơ _acceptance/eval-classify-wilson (PL9): E1 mốc Wilson, E2 nhóm + trạng thái, E3 so khớp,
// E4 cách đọc parser, E6 ô + phân khúc, E8 tập mẫu không chạm DB. Mỗi phép đo là một hàm kiểm nhận module; chạy trên bản
// thật (xanh) và bản chép hỏng (đỏ, thông điệp ghim đúng chữ của evals.yaml). Bản chép nằm cạnh bản thật (cùng thư mục,
// tên bắt đầu «.ban-») để đường nạp tương đối giữ nguyên, rồi xoá.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as that from "./eval-classify.mjs";
import { maToaCan, parsePost } from "../transform-zalo.mjs";

const LIB = path.dirname(fileURLToPath(import.meta.url));
const PIPE = path.dirname(LIB);
const MAU_KIEM = path.join(PIPE, "..", "_acceptance", "tap-nhan-mau-ocp1", "mau-kiem.jsonl");
const CLI = path.join(PIPE, "eval-classify.mjs");

/** Bản chép hỏng của `tep` (đường tuyệt đối) cạnh bản thật: thay `tim` bằng `thay` (phải khớp), nạp, xoá. */
async function banChep(tep, tim, thay, chay) {
  const goc = readFileSync(tep, "utf8");
  const moi = goc.replace(tim, thay);
  assert.notEqual(moi, goc, `bản chép không đổi được ${path.basename(tep)} — mẫu thay đã lệch mã`);
  const ban = path.join(path.dirname(tep), `.ban-${process.pid}-${Math.random().toString(36).slice(2)}-${path.basename(tep)}`);
  writeFileSync(ban, moi);
  try {
    return await chay(ban);
  } finally {
    rmSync(ban, { force: true });
  }
}
const banLib = (tim, thay, kiem) =>
  banChep(path.join(LIB, "eval-classify.mjs"), tim, thay, async (ban) => kiem(await import(pathToFileURL(ban).href)));

// ---- E1: mốc Wilson của bảng F3 (10 mốc viết trước, hai chiều) ----
const MOC_WILSON = [
  { k: 100, n: 100, nguong: 0.95, dat: true, lb: "0.9630" },
  { k: 99, n: 100, nguong: 0.95, dat: false, lb: "0.9455" },
  { k: 148, n: 150, nguong: 0.95, dat: true, lb: "0.9527" },
  { k: 147, n: 150, nguong: 0.95, dat: false, lb: "0.9429" },
  { k: 197, n: 200, nguong: 0.95, dat: true, lb: "0.9568" },
  { k: 196, n: 200, nguong: 0.95, dat: false, lb: "0.9497" },
  { k: 96, n: 100, nguong: 0.9, dat: true, lb: "0.9016" },
  { k: 95, n: 100, nguong: 0.9, dat: false, lb: "0.8882" },
  { k: 143, n: 150, nguong: 0.9, dat: true, lb: "0.9068" },
  { k: 142, n: 150, nguong: 0.9, dat: false, lb: "0.8983" },
];
function kiemWilson(mod) {
  // Chiều đạt/không đạt trước (lời hứa của F3), rồi mới tới giá trị 4 chữ số.
  let soAssert = 0;
  for (const m of MOC_WILSON) {
    if (mod.wilsonDuoi(m.k, m.n) >= m.nguong !== m.dat) throw new Error(`WILSON LECH MOC ${m.k}/${m.n}: đạt ≠ ${m.dat}`);
    soAssert++;
  }
  for (const m of MOC_WILSON) {
    const lb = mod.wilsonDuoi(m.k, m.n);
    if (lb.toFixed(4) !== m.lb) throw new Error(`WILSON LECH GIA TRI ${m.k}/${m.n}: ${lb}`);
    soAssert++;
  }
  assert.equal(soAssert, 2 * MOC_WILSON.length);
  if (mod.wilsonDuoi(0, 0) !== null) throw new Error("WILSON n = 0 PHAI LA null");
}
test("E1 cận dưới Wilson khớp 10 mốc của bảng F3; n = 0 → null", () => kiemWilson(that));
test("E1 đối chứng đỏ: z = 1,645 lệch mốc 99/100", () =>
  banLib("const Z95 = 1.96;", "const Z95 = 1.645;", (m) => assert.throws(() => kiemWilson(m), /WILSON LECH MOC 99\/100/)));

// ---- E2: nhóm + ngưỡng + trạng thái ----
const NHOM_VIET_TRUOC = {
  listing_intent: ["A", 0.95], kind: ["A", 0.95], property_type: ["A", 0.95], project: ["A", 0.95], building: ["A", 0.95],
  price_min_vnd: ["B", 0.9], price_max_vnd: ["B", 0.9], area_m2: ["B", 0.9], bedrooms: ["B", 0.9],
};
function kiemTrangThai(mod) {
  let soAssert = 0;
  for (const [f, [nhom, nguong]] of Object.entries(NHOM_VIET_TRUOC)) {
    const x = mod.xepTrangThai(f, 1, 1);
    if (x.nhom !== nhom || x.nguong !== nguong) throw new Error(`NHOM TRUONG LECH ${f}`);
    soAssert++;
  }
  assert.equal(soAssert, 9);
  const ca = [
    ["kind", 150, 148, "pass"], ["kind", 150, 147, "fail"], ["area_m2", 150, 143, "pass"], ["area_m2", 150, 142, "fail"],
  ];
  for (const [f, n, d, mong] of ca) {
    if (mod.xepTrangThai(f, n, d).trang_thai !== mong) throw new Error(`TRANG THAI THEO TI LE THO ${f} ${d}/${n}`);
  }
  const rong = mod.xepTrangThai("kind", 0, 0);
  assert.deepEqual([rong.trang_thai, rong.ly_do], ["skip", "chua-co-nhan-nguoi"]);
  const khongDoc = mod.xepTrangThai("project", 150, 150, false);
  assert.deepEqual([khongDoc.trang_thai, khongDoc.ly_do], ["skip", "chua-co-cach-doc"]);
}
test("E2 chín trường đúng nhóm/ngưỡng; trạng thái theo cận dưới; skip có lý do", () => kiemTrangThai(that));
test("E2 đối chứng đỏ: xếp theo tỉ lệ thô", () =>
  banLib("trang_thai: can_duoi >= nguong", "trang_thai: dung / n >= nguong",
    (m) => assert.throws(() => kiemTrangThai(m), /TRANG THAI THEO TI LE THO kind 147\/150/)));
test("E2 đối chứng đỏ: area_m2 vào nhóm A", () =>
  banLib('area_m2: "B"', 'area_m2: "A"', (m) => assert.throws(() => kiemTrangThai(m), /NHOM TRUONG LECH area_m2/)));

// ---- E3: so khớp từng trường ----
const KHONG = { value: null, not_stated: true };
const co = (v) => ({ value: v, not_stated: false });
const GIA_TRI_MAU = { listing_intent: "offer", kind: "sale", property_type: "apartment", project: "ocp1", building: "pr2",
  price_min_vnd: "3150000000", price_max_vnd: "3150000000", area_m2: "64", bedrooms: "2" };
const CA_SO_KHOP = [
  ...that.TRUONG.flatMap((f) => [
    [f, KHONG, null, true, "không nêu × không trả"],
    [f, KHONG, GIA_TRI_MAU[f], false, "không nêu × có trả"],
    [f, co(GIA_TRI_MAU[f]), null, false, "có giá trị × không trả"],
  ]),
  ["project", co("Ocean  Park 1"), "ocean park 1", true, "chữ chuẩn hoá"],
  ["building", co("PR2"), "pr2", true, "toà chữ thường"],
  ["kind", co("sale"), "rent_lt", false, "từ vựng khác"],
  ["price_min_vnd", co("3150000000"), "3150000000", true, "giá bằng"],
  ["price_min_vnd", co("3150000000"), "3150000001", false, "giá lệch một đồng"],
  ["area_m2", co("64"), "65.9", true, "diện tích lệch 2,97%"],
  ["area_m2", co("64"), "66", false, "diện tích lệch 3,125%"],
  ["bedrooms", co("2"), "3", false, "phòng ngủ khác"],
];
function kiemSoKhop(mod) {
  let soAssert = 0;
  for (const [f, vang, doc, mong, ten] of CA_SO_KHOP) {
    if (mod.soKhop(f, vang, doc) !== mong) {
      if (f === "area_m2") throw new Error(`DIEN TICH KHONG CHO LECH 3% (${ten})`);
      throw new Error(`SO KHOP LECH ${f}: ${ten}`);
    }
    soAssert++;
  }
  assert.equal(soAssert, CA_SO_KHOP.length);
}
test("E3 ma trận so khớp (27 + 8 ca)", () => kiemSoKhop(that));
test("E3 đối chứng đỏ: diện tích bằng nhau tuyệt đối", () =>
  banLib("return Math.abs(Number(doc) - g) <= 0.03 * g + 1e-9;", "return Number(doc) === g;",
    (m) => assert.throws(() => kiemSoKhop(m), /DIEN TICH KHONG CHO LECH 3%/)));

// ---- E4: cách đọc parser = parsePost/maToaCan thật, đổi về khuôn nhãn PL7 ----
const docTapKiem = () => that.docTapMau(readFileSync(MAU_KIEM, "utf8"));
const CHU_VIET_TRUOC = [
  { text: "Bán căn 2PN 64,5 m2 giá 3,15 tỷ", toa: null },
  { text: "Cho thuê căn hộ 12 triệu/tháng 1 phòng ngủ 45m2", toa: null },
  { text: "Bán gấp giá 3.150.000.000 đồng", toa: null },
  { text: "Căn PR2.03 bán 4 tỷ 2PN", toa: "pr2" },
  { text: "Có PR2 và S1 cho thuê 15tr", toa: null },
  { text: "Tìm căn hộ ở Ocean Park", toa: null },
];
function kiemParser(mod) {
  const doc = mod.CACH_DOC.parser;
  assert.deepEqual([...doc.truong].sort(), ["area_m2", "bedrooms", "building", "kind", "price_max_vnd", "price_min_vnd"]);
  const chu = [...docTapKiem().tin.map((t) => ({ text: t.text, toa: undefined })), ...CHU_VIET_TRUOC];
  let soAssert = 0;
  for (const { text, toa } of chu) {
    const ra = doc.doc(text);
    for (const k of ["listing_intent", "property_type", "project"]) assert.equal(k in ra, false, `parser không được trả ${k}`);
    const p = parsePost(text);
    const gia = p.priceVnd == null ? null : String(Math.round(p.priceVnd));
    if (ra.price_min_vnd !== gia) throw new Error(`GIA LECH PARSEPOST: ${text}`);
    if (ra.price_max_vnd !== gia) throw new Error(`GIA MOT DAU: ${text}`);
    assert.equal(ra.kind, p.kind ?? null, text);
    assert.equal(ra.area_m2, p.areaM2 == null ? null : String(p.areaM2), text);
    assert.equal(ra.bedrooms, p.bedrooms == null ? null : String(p.bedrooms), text);
    if (toa !== undefined && ra.building !== toa) {
      if (ra.building && /[.\-]|xx/.test(ra.building)) throw new Error(`TOA CON DUOI CAN: ${ra.building}`);
      throw new Error(`TOA LECH: ${text} → ${ra.building}`);
    }
    // Toà của tin mẫu: đúng một mã khác nhau (bỏ đuôi căn) của maToaCan thật thì trả, chữ thường.
    const ma = [...new Set(maToaCan(text).map((m) => m.replace(/(?:[.\-]\d{2,4}|x{2}\d{2})$/, "")))];
    if (toa === undefined && ra.building !== (ma.length === 1 ? ma[0].toLowerCase() : null)) {
      if (ra.building && /[.\-]|xx/.test(ra.building)) throw new Error(`TOA CON DUOI CAN: ${ra.building}`);
      throw new Error(`TOA LECH: ${text} → ${ra.building}`);
    }
    soAssert++;
  }
  assert.equal(soAssert, chu.length);
}
test("E4 cách đọc parser trả đúng giá trị parsePost/maToaCan thật trên 40 tin mẫu + 6 chữ viết trước", () => kiemParser(that));
test("E4 đối chứng đỏ: giữ đuôi căn", () =>
  banLib('m.replace(DUOI_CAN, "")', "m", (m) => assert.throws(() => kiemParser(m), /TOA CON DUOI CAN/)));
test("E4 đối chứng đỏ: giá chỉ một đầu", () =>
  banLib("price_max_vnd: gia,", "price_max_vnd: null,", (m) => assert.throws(() => kiemParser(m), /GIA MOT DAU/)));

// ---- E6: ô + phân khúc ----
const nhanDu = (pt) => Object.fromEntries(that.TRUONG.map((f) => [f, f === "property_type" ? pt : KHONG]));
const VANG_VIET_TRUOC = [
  { id: "a1", text: "a", nhan: nhanDu(co("apartment")) },
  { id: "a2", text: "b", nhan: nhanDu(co("apartment")) },
  { id: "h1", text: "c", nhan: nhanDu(co("house")) },
  { id: "k1", text: "d", nhan: nhanDu(KHONG) },
  { id: "bd", text: "e", nhan: Object.fromEntries(Object.entries(nhanDu(KHONG)).filter(([f]) => f !== "property_type")) },
];
function kiemO(mod) {
  const rong = mod.chamO({ tin: [] });
  const khoa = (o) => `${o.phan_khuc}|${o.cach_doc}|${o.truong}`;
  for (const f of mod.TRUONG) {
    const k = `tat-ca|parser|${f}`;
    if (!rong.some((o) => khoa(o) === k)) throw new Error(`THIEU O ${k}`);
  }
  assert.equal(rong.length, 9);
  assert.equal(rong.filter((o) => o.ly_do === "chua-co-nhan-nguoi").length, 6);
  assert.equal(rong.filter((o) => o.ly_do === "chua-co-cach-doc").length, 3);
  const o = mod.chamO({ tin: VANG_VIET_TRUOC });
  assert.deepEqual([...new Set(o.map((x) => x.phan_khuc))], ["tat-ca", "apartment", "house", "khong-neu"]);
  assert.equal(new Set(o.map(khoa)).size, o.length, "ô trùng khoá");
  for (const pk of ["tat-ca", "apartment", "house", "khong-neu"]) assert.equal(o.filter((x) => x.phan_khuc === pk).length, 9, pk);
  const n = (pk) => o.find((x) => x.phan_khuc === pk && x.truong === "kind").n;
  assert.deepEqual([n("tat-ca"), n("apartment"), n("house"), n("khong-neu")], [5, 2, 1, 1]);
  assert.equal(o.find((x) => x.phan_khuc === "tat-ca" && x.truong === "property_type").n, 4, "tin bất đồng loại hình không có vàng loại hình");
}
test("E6 ô đủ ở tat-ca khi rỗng; phân khúc theo loại hình, mỗi phân khúc 9 ô", () => kiemO(that));
test("E6 đối chứng đỏ: bỏ ô khi n = 0", () =>
  banLib("const n = coVang.length;", "const n = coVang.length;\n        if (n === 0) continue;",
    (m) => assert.throws(() => kiemO(m), /THIEU O tat-ca\|parser\|listing_intent/)));

// ---- E8: tập mẫu qua lệnh, không mở kết nối DB ----
const DB_DONG = "postgres://127.0.0.1:1/khong";
const chayCli = (cli, args) =>
  spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_DONG }, timeout: 60_000 });
// Cùng regex của tap-mau.test.mjs (PL8): đường nạp bộ sinh.
const NHAP_BO_SINH = /(?:from\s+["'][^"']*tap-mau(?:\.mjs)?["']|import\(\s*["'][^"']*tap-mau(?:\.mjs)?["']\s*\))/;
function kiemTapMau(cli) {
  const r = chayCli(cli, ["--tap-mau", MAU_KIEM]);
  if (r.status !== 0) throw new Error(`TAP MAU MO KET NOI DB: exit ${r.status} ${r.stderr.slice(0, 200)}`);
  assert.match(r.stdout, /tập mẫu/);
  // Phép đếm độc lập: parsePost thẳng trên chữ, so với nhãn kind của tệp — không qua chamO.
  const tin = readFileSync(MAU_KIEM, "utf8").split("\n").filter(Boolean).slice(1).map((l) => JSON.parse(l));
  const n = tin.length;
  const dung = tin.filter((t) => {
    const k = parsePost(t.text).kind ?? null;
    return t.nhan.kind.not_stated ? k == null : k === t.nhan.kind.value;
  }).length;
  const lb = that.wilsonDuoi(dung, n).toFixed(4).replace(".", ",");
  const dong = r.stdout.split("\n").find((l) => l.trim().startsWith("tat-ca|parser|kind "));
  assert.ok(dong, "thiếu dòng tat-ca|parser|kind");
  assert.match(dong, new RegExp(`n ${n}\\s+đúng ${dung}\\s.*cận dưới ${lb}`), `đếm độc lập n ${n} đúng ${dung} cận dưới ${lb}`);
  return { n, dung };
}
test("E8 --tap-mau với DB đóng: exit 0, số ô kind khớp phép đếm độc lập", () => {
  const { n, dung } = kiemTapMau(CLI);
  console.log(`# E8 tat-ca|parser|kind trên mau-kiem.jsonl: đúng ${dung}/${n}`);
});
test("E8 tệp không có dấu tập mẫu bị từ chối", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ecw-"));
  try {
    const dong = readFileSync(MAU_KIEM, "utf8").split("\n");
    const boDau = path.join(dir, "bo-dau.jsonl");
    writeFileSync(boDau, dong.slice(1).join("\n"));
    const r1 = chayCli(CLI, ["--tap-mau", boDau]);
    assert.notEqual(r1.status, 0);
    assert.match(r1.stderr, /khong phai tap nhan mau/);
    const sai = path.join(dir, "mau-false.jsonl");
    const dau = JSON.parse(dong[0]);
    writeFileSync(sai, [JSON.stringify({ ...dau, mau: false }), ...dong.slice(1)].join("\n"));
    const r2 = chayCli(CLI, ["--tap-mau", sai]);
    assert.notEqual(r2.status, 0);
    assert.match(r2.stderr, /khong phai tap nhan mau/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("E8 lệnh và lõi không nạp bộ sinh tap-mau", () => {
  for (const f of [CLI, path.join(LIB, "eval-classify.mjs")]) assert.doesNotMatch(readFileSync(f, "utf8"), NHAP_BO_SINH, f);
});
test("E8 đối chứng đỏ: lệnh mở kết nối DB trước khi rẽ nhánh --tap-mau", () =>
  banChep(CLI, '  if (co["tap-mau"]) {\n    const tap',
    '  { const { default: pg0 } = await import("pg"); const c0 = new pg0.Client({ connectionString: process.env.DATABASE_URL }); await c0.connect(); await c0.end(); }\n  if (co["tap-mau"]) {\n    const tap',
    (ban) => assert.throws(() => kiemTapMau(ban), /TAP MAU MO KET NOI DB/)));
