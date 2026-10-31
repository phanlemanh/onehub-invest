// gia-ty-sau-khoang-trang.test.mjs — hồ sơ _acceptance/s03-gia-ty-sau-khoang-trang: bước gạt SĐT (gatSo) không nuốt giá viết
// bằng đồng khi ngay sau là khoảng trắng/xuống dòng + 1–2 chữ số («3.000.000.000\n50m2»), mà vẫn gạt mọi SĐT; danh sách SĐT
// so trực tiếp với bản nền ghim NEN. SĐT trong ca là dãy giả. Mỗi ma trận có ca đỏ: bản sao đột biến transform-zalo.mjs chép
// cạnh tệp thật, nạp rồi xoá ngay.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import * as tz from "../transform-zalo.mjs";

const NEN = "ec899d03";
const PIPE = join(import.meta.dirname, "..");
const TZ = join(PIPE, "transform-zalo.mjs");
let nMut = 0;

async function napBanSao(src) {
  const f = join(PIPE, `.gs-mut-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

async function banSaoDotBien(thay) {
  let src = readFileSync(TZ, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  return napBanSao(src);
}

const BO_NHANH_DUOI = [["if (coDuoiSoNgan(t, m, i, nhom)) return true;", ""]];
const BO_000 = [['than.endsWith("000") && ', ""]];
const BO_THAN = [[" && THAN_SO_TIEN.test(t.slice(0, i - 1))", ""]];
// SD2 (boc-sdt-du-va-chon-ro, giám sát duyệt P1-78): bộ bóc SĐT dùng SDT_RE riêng — lối (a) bỏ khoảng trắng khỏi tập ký
// tự tách của bộ bóc.
const LOI_A = [['const TACH_SDT = "[.\\\\- \\\\t•·]";', 'const TACH_SDT = "[.\\\\-•·]";']];

// ---- AC-1: giá + khoảng trắng/xuống dòng + 1–2 chữ số ----
const SAU_KHOANG_TRANG = [
  ["Bán nhà 3.000.000.000\n50m2", 3e9, { areaM2: 50 }],
  ["Bán 2.000.000.000 2PN", 2e9, { bedrooms: 2 }],
  ["Bán căn 1.050.000.000\n60m2", 1.05e9, { areaM2: 60 }],
  ["Bán nhà 3.000.000.000 50m2", 3e9, { areaM2: 50 }],
  ["Bán căn 15.000.000.000\n5 tầng", 15e9, {}],
];
const DA_DUNG = [
  ["Bán căn 3.000.000.000 đ, 50m2", 3e9],
  ["Bán căn 4.200.000.000", 4.2e9],
  ["Cho thuê 2PN Giá thuê: 7.000.000", 7e6],
];

test("GS-AC-1: 8 dòng giá đồng ra đúng số đồng, 4 trường đứng sau giá ra đúng", () => {
  assert.equal(SAU_KHOANG_TRANG.length + DA_DUNG.length, 8);
  for (const [chu, dapAn] of [...SAU_KHOANG_TRANG, ...DA_DUNG]) assert.equal(tz.parsePost(chu).priceVnd, dapAn, `GS-AC-1 «${chu}»`);
  let nTruong = 0;
  for (const [chu, , truong] of SAU_KHOANG_TRANG) {
    for (const [k, v] of Object.entries(truong)) {
      assert.equal(tz.parsePost(chu)[k], v, `GS-AC-1 «${chu}» ${k}`);
      nTruong++;
    }
  }
  assert.equal(nTruong, 4);
});

test("GS-AC-1 đột biến: bỏ nhánh đuôi → «3.000.000.000\\n50m2» ra null", async () => {
  const m = await banSaoDotBien(BO_NHANH_DUOI);
  assert.equal(m.parsePost(SAU_KHOANG_TRANG[0][0]).priceVnd, null, "GS-AC-1 đột biến «3.000.000.000\\n50m2» vẫn đọc được — thước không đo nhánh đuôi");
});

// ---- AC-2: mọi SĐT vẫn bị gạt khỏi bước đọc số ----
const SDT = [
  "Cho thuê 2PN 9tr, liên hệ.0901234567 T.Lan",
  "Cho thuê 2PN 9tr, liên hệ.0901.234.567 T.Lan",
  "Cho thuê 2PN 9tr, liên hệ.0901 234 567 T.Lan",
  "Cho thuê 2PN 9tr, LH,0901234567 T.Lan",
  "Cho thuê 2PN 9tr, LH 0901234567,0912345678 T.Lan",
  "Cho thuê 2PN 9tr, LH 0901234567.0912 345 678 T.Lan",
  "Cho thuê 50m2,0901234567 T.Lan 9tr",
  "Cho thuê 50m2.0912.345.678 9 T.Lan 9tr",
  "Cho thuê 9tr 50m2.098.765.000 1 T.Lan",
  "Cho thuê 9tr LH 2.098.765.432 1 T.Lan",
];

test("GS-AC-2: 10 dòng SĐT đều ra giá 9 triệu", () => {
  assert.equal(SDT.length, 10);
  for (const chu of SDT) assert.equal(tz.parsePost(chu).priceVnd, 9e6, `GS-AC-2 «${chu}»`);
});

test("GS-AC-2 đột biến: bỏ điều kiện nhóm cuối «000» → «2.098.765.432 1» lọt vào bước đọc số", async () => {
  const m = await banSaoDotBien(BO_000);
  assert.notEqual(m.parsePost(SDT[9]).priceVnd, 9e6, "GS-AC-2 đột biến «2.098.765.432 1» vẫn đúng — thước không đo điều kiện nhóm cuối «000»");
});

test("GS-AC-2 đột biến: bỏ điều kiện thân số tiền → «50m2.098.765.000 1» lọt vào bước đọc số", async () => {
  const m = await banSaoDotBien(BO_THAN);
  assert.notEqual(m.parsePost(SDT[8]).priceVnd, 9e6, "GS-AC-2 đột biến «50m2.098.765.000 1» vẫn đúng — thước không đo điều kiện thân số tiền");
});

// ---- AC-3: danh sách SĐT không đổi so với bản nền ----
const DONG_SDT = [...SAU_KHOANG_TRANG.map(([chu]) => chu), ...SDT];
const nen = await napBanSao(execFileSync("git", ["show", `${NEN}:pipeline/transform-zalo.mjs`], { cwd: PIPE, encoding: "utf8" }));

// SD2 (giám sát duyệt P1-78, P1-79): bản nền nhận «số» 11 chữ số ở hai dòng (giá trên hai dòng; số tách đuôi một chữ số);
// SD2 bỏ số 11 chữ số có chủ ý nên đúng hai dòng này chờ rỗng, 13 dòng còn lại vẫn so bản nền.
const SD2_RONG = ["Bán căn 1.050.000.000\n60m2", "Cho thuê 50m2.0912.345.678 9 T.Lan 9tr"];

test("GS-AC-3: extractPhones của cây bằng của bản nền ở 15 dòng", () => {
  assert.equal(DONG_SDT.length, 15);
  for (const r of SD2_RONG) assert.ok(DONG_SDT.includes(r), `GS-AC-3: dòng SD2 chờ rỗng «${r}» phải có trong 15 dòng`);
  for (const chu of DONG_SDT) assert.deepEqual(tz.extractPhones(chu), SD2_RONG.includes(chu) ? [] : nen.extractPhones(chu), `GS-AC-3 «${chu}»`);
});

test("GS-AC-3 đột biến: lối (a) — PHONE_RE thôi nhận khoảng trắng → «liên hệ.0901 234 567» lệch bản nền", async () => {
  const m = await banSaoDotBien(LOI_A);
  assert.notDeepEqual(m.extractPhones(SDT[2]), nen.extractPhones(SDT[2]), "GS-AC-3 đột biến «liên hệ.0901 234 567» vẫn khớp bản nền — thước không đo danh sách SĐT");
});

// ---- AC-4: giá mới đi qua chốt khoảng ----
const PHI_LY = [
  ["Bán biệt thự 150.000.000.000 2PN", "ban-tren-100-ty"],
  ["Cho thuê nhà 1.000.000.000 1 tháng", "thue-tu-1-ty"],
];

test("GS-AC-4: giá phi lý bị chốt khoảng loại đúng lý do", () => {
  for (const [chu, lyDo] of PHI_LY) assert.equal(tz.lyDoGiaPhiLy(tz.parsePost(chu)), lyDo, `GS-AC-4 «${chu}»`);
});

test("GS-AC-4 đối chứng: bỏ nhánh đuôi → giá bị nuốt nên lọt chốt", async () => {
  const m = await banSaoDotBien(BO_NHANH_DUOI);
  for (const [chu] of PHI_LY) assert.equal(m.lyDoGiaPhiLy(m.parsePost(chu)), null, `GS-AC-4 đối chứng «${chu}» vẫn bị loại`);
});
