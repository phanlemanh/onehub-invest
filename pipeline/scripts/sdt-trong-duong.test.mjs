// sdt-trong-ten-duong — ca thuần «SDT-AC-1»: 17 hàng của bảng Ma trận AC-1 trong contract, cùng thứ tự. Số trong tệp là số bịa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { docDacTrungS06 } from "../lib/dac-trung-s06.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = "payload.street_name";
const MA_TRAN = [
  ["0912345678", null],
  ["Nguyễn Xiển 0912345678", null],
  ["0912345678 Nguyễn Xiển", null],
  ["0912 345 678", null],
  ["091 234 56 78", null],
  ["0912.345.678", null],
  ["0912-345-678", null],
  ["+84912345678", null],
  ["912345678", null],
  ["a/c Nam 0912.345.678", null],
  ["12345678 Lê Lợi", "12345678 Lê Lợi"],
  ["Số 277 Đường Bến Bình Đông, Phường 14", "Số 277 Đường Bến Bình Đông, Phường 14"],
  ["Đường 3/2", "Đường 3/2"],
  ["12/5A Lê Lợi", "12/5A Lê Lợi"],
  ["Tỉnh lộ 10", "Tỉnh lộ 10"],
  ["Km 12 Quốc lộ 1A", "Km 12 Quốc lộ 1A"],
  ["123-125-127 Lê Lợi", null],
];
const duongCua = (doc, vao) => doc({ payload: { street_name: vao } }).filter((d) => d.field === "street_raw");
function kiemHang(doc, i) {
  const [vao, mong] = MA_TRAN[i];
  const ra = duongCua(doc, vao);
  assert.deepEqual(ra.map((d) => [d.value, d.rule_id]), mong === null ? [] : [[mong, R]], `SDT-AC-1 hàng ${i + 1}`);
}
const kiemCa = (doc) => { for (let i = 0; i < MA_TRAN.length; i++) kiemHang(doc, i); };

test("SDT-AC-1 ma trận 17 hàng", () => {
  let n = 0;
  for (let i = 0; i < MA_TRAN.length; i++) { kiemHang(docDacTrungS06, i); n++; }
  assert.equal(n, 17);
});

/** Bản sao đột biến của một tệp lib, viết cạnh tệp thật rồi xoá. */
async function banSao(tuongDoi, cu, moi) {
  const tep = join(PIPE, tuongDoi);
  const goc = readFileSync(tep, "utf8");
  assert.ok(goc.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const sao = tep.replace(/\.mjs$/, `.dotbien-${process.pid}-${Date.now()}.mjs`);
  writeFileSync(sao, goc.replace(cu, moi));
  try {
    return await import(pathToFileURL(sao).href);
  } finally {
    unlinkSync(sao);
  }
}

test("SDT-AC-1 đỏ: bỏ luật số thì đỏ ở hàng 1", async () => {
  const m = await banSao("lib/dac-trung-s06.mjs", "if (chuaDaySo(t)) return null;", "");
  assert.throws(() => kiemCa(m.docDacTrungS06), /SDT-AC-1 hàng 1\b/);
});

/** Đột biến mẫu đi qua bản sao của cả hai tệp: bộ đọc nạp bản sao mẫu. */
async function docVoiMau(cu, moi) {
  const tep = join(PIPE, "lib/sdt-trong-chuoi.mjs");
  const goc = readFileSync(tep, "utf8");
  assert.ok(goc.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const tenSao = `sdt-trong-chuoi.dotbien-${process.pid}-${Date.now()}.mjs`;
  const sao = join(PIPE, "lib", tenSao);
  writeFileSync(sao, goc.replace(cu, moi));
  try {
    return (await banSao("lib/dac-trung-s06.mjs", "./sdt-trong-chuoi.mjs", `./${tenSao}`)).docDacTrungS06;
  } finally {
    unlinkSync(sao);
  }
}

test("SDT-AC-1 đỏ: bỏ ngăn trong mẫu thì đỏ ở hàng 4", async () => {
  const doc = await docVoiMau("[ .-]?", "");
  assert.throws(() => kiemCa(doc), /SDT-AC-1 hàng 4\b/);
});

test("SDT-AC-1 đỏ: hạ ngưỡng xuống 8 chữ số thì đỏ ở hàng 11", async () => {
  const doc = await docVoiMau("{8,}", "{7,}");
  assert.throws(() => kiemCa(doc), /SDT-AC-1 hàng 11\b/);
});
