// gia-ty-chan-dong.test.mjs — hồ sơ _acceptance/s03-gia-ty-chan-dong: bước gạt SĐT (gatSo) không nuốt đuôi nhóm nghìn của
// số tiền («3.000.000.000»), mà vẫn gạt mọi SĐT; PHONE_RE và extractPhones giữ nguyên. SĐT trong ca là dãy giả 0901234567,
// 0912345678. Mỗi ma trận có ca đỏ: bản sao đột biến transform-zalo.mjs chép cạnh tệp thật, nạp rồi xoá ngay.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import * as tz from "../transform-zalo.mjs";

const TZ = join(import.meta.dirname, "../transform-zalo.mjs");
let nMut = 0;

async function banSaoDotBien(thay) {
  let src = readFileSync(TZ, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(import.meta.dirname, `../.gt-mut-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

const BO_DIEU_KIEN = [['(laDuoiNhomNghin(t, m, i) ? m : " ")', '" "']];
const CHI_KY_TU_TRUOC = [["return nhom.test(m);", "return true;"]];
// SD2 (boc-sdt-du-va-chon-ro, giám sát duyệt P1-78): bộ bóc SĐT dùng SDT_RE riêng, PHONE_RE chỉ còn cho gatSo — đột biến
// đặt điều kiện dấu chấm/phẩy vào biểu thức của bộ bóc.
const VAO_PHONE_RE = [["new RegExp(`(?<!\\\\d)(?:\\\\+84|84|0)", "new RegExp(`(?<!\\\\d)(?<!\\\\d[.,])(?:\\\\+84|84|0)"]];

// ---- AC-1: giá tỷ chẵn viết bằng đồng ----
const TY_CHAN = [
  ["Bán nhà giá 3.000.000.000 đ, 50m2", 3e9],
  ["Bán 15.000.000.000", 15e9],
  ["Bán căn 2.000.000.000đ", 2e9],
  ["Bán căn giá 10.000.000.000 VNĐ", 10e9],
  ["Bán đất 1.000.000.000", 1e9],
];
const DA_DUNG = [
  ["Bán căn 4.200.000.000", 4.2e9],
  ["Bán căn 1.500.000.000 VNĐ", 1.5e9],
  ["Cho thuê 2PN Giá thuê: 7.000.000", 7e6],
];

test("GT-AC-1: 8 dòng giá đồng ra đúng số đồng", () => {
  assert.equal(TY_CHAN.length + DA_DUNG.length, 8);
  for (const [chu, dapAn] of [...TY_CHAN, ...DA_DUNG]) assert.equal(tz.parsePost(chu).priceVnd, dapAn, `GT-AC-1 «${chu}»`);
});

test("GT-AC-1 đột biến: bỏ điều kiện bỏ-qua → «3.000.000.000» ra null", async () => {
  const m = await banSaoDotBien(BO_DIEU_KIEN);
  assert.equal(m.parsePost(TY_CHAN[0][0]).priceVnd, null, "GT-AC-1 đột biến «3.000.000.000» vẫn đọc được — thước không đo điều kiện bỏ-qua");
});

// ---- AC-2: mọi SĐT vẫn bị gạt khỏi bước đọc số ----
const SDT = [
  ["Cho thuê 2PN 9tr, liên hệ.0901234567 T.Lan", ["0901234567"]],
  ["Cho thuê 2PN 9tr, liên hệ.0901.234.567 T.Lan", ["0901234567"]],
  ["Cho thuê 2PN 9tr, liên hệ.0901 234 567 T.Lan", ["0901234567"]],
  ["Cho thuê 2PN 9tr, LH,0901234567 T.Lan", ["0901234567"]],
  ["Cho thuê 2PN 9tr, LH 0901234567,0912345678 T.Lan", ["0901234567", "0912345678"]],
  ["Cho thuê 2PN 9tr, LH 0901234567.0912 345 678 T.Lan", ["0901234567", "0912345678"]],
  ["Cho thuê 50m2,0901234567 T.Lan 9tr", ["0901234567"]],
];

test("GT-AC-2: 7 dòng SĐT trước «T.Lan» đều ra giá 9 triệu", () => {
  assert.equal(SDT.length, 7);
  for (const [chu] of SDT) assert.equal(tz.parsePost(chu).priceVnd, 9e6, `GT-AC-2 «${chu}»`);
});

test("GT-AC-2 đột biến: chỉ xét ký tự đứng trước → SĐT nối SĐT lọt vào bước đọc số", async () => {
  const m = await banSaoDotBien(CHI_KY_TU_TRUOC);
  assert.notEqual(m.parsePost(SDT[4][0]).priceVnd, 9e6, "GT-AC-2 đột biến «0901234567,0912345678» vẫn đúng — thước không đo dạng nhóm 3 chữ số");
});

// ---- AC-3: danh sách SĐT không đổi ----
test("GT-AC-3: extractPhones — giá tỷ chẵn ra rỗng, SĐT ra đúng", () => {
  for (const [chu] of TY_CHAN) assert.deepEqual(tz.extractPhones(chu), [], `GT-AC-3 giá «${chu}»`);
  for (const [chu, dapAn] of SDT) assert.deepEqual(tz.extractPhones(chu), dapAn, `GT-AC-3 SĐT «${chu}»`);
});

test("GT-AC-3 đột biến: điều kiện vào PHONE_RE dùng chung → SĐT nối SĐT chỉ còn một số", async () => {
  const m = await banSaoDotBien(VAO_PHONE_RE);
  assert.deepEqual(m.extractPhones(SDT[4][0]), ["0901234567"], "GT-AC-3 đột biến vẫn trích đủ hai số — thước không đo danh sách SĐT");
});

// ---- AC-4: giá đồng mới đi qua chốt khoảng ----
const PHI_LY = [
  ["Bán biệt thự 150.000.000.000", "ban-tren-100-ty"],
  ["Cho thuê nhà 1.000.000.000/tháng", "thue-tu-1-ty"],
];

test("GT-AC-4: giá đồng phi lý bị chốt khoảng loại đúng lý do", () => {
  for (const [chu, lyDo] of PHI_LY) assert.equal(tz.lyDoGiaPhiLy(tz.parsePost(chu)), lyDo, `GT-AC-4 «${chu}»`);
});

test("GT-AC-4 đối chứng: bỏ điều kiện bỏ-qua → giá bị nuốt nên lọt chốt", async () => {
  const m = await banSaoDotBien(BO_DIEU_KIEN);
  for (const [chu] of PHI_LY) assert.equal(m.lyDoGiaPhiLy(m.parsePost(chu)), null, `GT-AC-4 đối chứng «${chu}» vẫn bị loại`);
});
