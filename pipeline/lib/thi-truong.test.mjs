import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { SAP_NHAP, THANH_PHO, khoaThanhPho, thiTruongCua } from "./thi-truong.mjs";

/**
 * s06-vung-moi-len-canonical AC-3 — MỘT chỗ ánh xạ thành phố ↔ thị trường. Ma trận viết trước; khoá module ⊂ id bộ thu
 * (collector/src/config/cities.ts, tệp thật); reassign-areas và transform-chotot không viết cứng thành phố nào và lấy
 * tập thành phố từ module (ca quan hệ trên bản chép).
 */
const ROOT = join(import.meta.dirname, "../..");
const DICH = ["pipeline/reassign-areas.mjs", "pipeline/transform-chotot.mjs"];

const MA_TRAN = [
  ["hanoi", "vn-hanoi"], ["hcmc", "vn-hcmc"], ["danang", "vn-da-nang"], ["haiphong", "vn-hai-phong"],
  ["vn-hanoi", "vn-hanoi"], ["vn-hcmc", "vn-hcmc"],
  ["vn-binh-duong", "vn-hcmc"], ["vn-ba-ria-vung-tau", "vn-hcmc"], ["vn-hai-duong", "vn-hai-phong"], ["vn-quang-nam", "vn-da-nang"],
  ["", null], [null, null], ["vn-xyz", null],
];

test("AC-3 ma trận viết trước: 13 ca = 4 khoá bộ thu + 2 mã thị trường + 4 tỉnh sáp nhập + 3 mã lạ", () => {
  assert.equal(MA_TRAN.length, 13);
  for (const [vao, ra] of MA_TRAN) assert.equal(thiTruongCua(vao), ra, `thiTruongCua(${JSON.stringify(vao)})`);
  assert.equal(Object.keys(SAP_NHAP).length, 4, "đủ 4 tỉnh sáp nhập đã khai trong ma trận");
});

test("AC-3 mã thị trường cấp tỉnh có trong areas đi qua nguyên vẹn khi người gọi truyền tập đang có", () => {
  assert.equal(thiTruongCua("vn-can-tho", new Set(["vn-can-tho"])), "vn-can-tho");
  assert.equal(thiTruongCua("vn-can-tho"), null, "không truyền tập thì mã ngoài module là lạ");
});

test("AC-3 khoá module ⊂ id thành phố của bộ thu (cities.ts — cũng là tiền tố snapshot S04)", () => {
  const cities = readFileSync(join(ROOT, "collector/src/config/cities.ts"), "utf8");
  const ids = new Set([...cities.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const k of khoaThanhPho()) assert.ok(ids.has(k), `khoá ${k} không có trong collector/src/config/cities.ts`);
});

/** Quét một tệp (bỏ chú thích): mọi chuỗi /vn-[a-z-]+/ hay khoá bộ thu viết cứng. */
export function quetCung(text) {
  const ma = text.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  const khoa = khoaThanhPho().join("|");
  return [...ma.matchAll(new RegExp(`["'\`](vn-[a-z-]+|${khoa})["'\`-]`, "g"))].map((m) => m[1]);
}

test("AC-3 reassign-areas và transform-chotot không viết cứng thành phố nào", () => {
  for (const t of DICH) assert.deepEqual(quetCung(readFileSync(join(ROOT, t), "utf8")), [], `${t} còn chuỗi thành phố cứng`);
});

test("AC-3 đối chứng: chèn 'vn-da-nang' cứng vào bản chép transform → quét bắt, ghim tên tệp", () => {
  const goc = readFileSync(join(ROOT, "pipeline/transform-chotot.mjs"), "utf8");
  const hong = goc.replace("const markets = await docThiTruongCoPhuong(client);", 'const markets = ["vn-hanoi", "vn-da-nang"];');
  assert.notEqual(hong, goc, "bản chép phải thật sự đổi");
  assert.deepEqual(quetCung(hong), ["vn-hanoi", "vn-da-nang"], "pipeline/transform-chotot.mjs (bản chép) bị bắt");
});

test("AC-3 quan hệ: thêm khoá giả vào bản chép module → reassign-areas (bản chép) nhận khoá đó, không sửa tệp của nó", async () => {
  const T = mkdtempSync(join(tmpdir(), "svm-tt-"));
  try {
    mkdirSync(join(T, "pipeline/lib"), { recursive: true });
    for (const f of ["reassign-areas.mjs", "lib/osm.mjs"]) cpSync(join(ROOT, "pipeline", f), join(T, "pipeline", f));
    symlinkSync(join(ROOT, "pipeline/node_modules"), join(T, "pipeline/node_modules"));
    const mod = readFileSync(join(ROOT, "pipeline/lib/thi-truong.mjs"), "utf8")
      .replace("export const THANH_PHO = {", 'export const THANH_PHO = {\n  thugia: { id: "vn-thu-gia", ten: "Thử Giả", tuChen: false },');
    writeFileSync(join(T, "pipeline/lib/thi-truong.mjs"), mod);
    const { MARKETS } = await import(pathToFileURL(join(T, "pipeline/reassign-areas.mjs")).href);
    assert.equal(MARKETS.thugia?.id, "vn-thu-gia", "reassign-areas lấy khoá mới từ module");
    assert.deepEqual(Object.keys(MARKETS).filter((k) => k !== "thugia"), Object.keys(THANH_PHO));
  } finally { rmSync(T, { recursive: true, force: true }); }
});

test("AC-3 transform-chotot lấy tập thị trường từ DB và city_code qua thiTruongCua", () => {
  const t = readFileSync(join(ROOT, "pipeline/transform-chotot.mjs"), "utf8");
  assert.match(t, /docThiTruongCoPhuong\(client\)/);
  assert.match(t, /thiTruongCua\(ad\.city_code/);
});
