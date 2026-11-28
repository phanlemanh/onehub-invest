// khop-du-an.test.mjs — DA3 bang-noi-ma-du-an AC-2, AC-6 (hàm thuần): ma trận ngả căn cứ viết trước, nối có sẵn thắng, chiều đỏ.
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { bamKetCuc, khoaNut, xepNga } from "../lib/khop-du-an.mjs";
import { chuanKhop } from "../lib/noi-du-an-s06-lop.mjs";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "../lib");
const TAM = mkdtempSync(join(tmpdir(), "da3-khop-"));
after(() => rmSync(TAM, { recursive: true, force: true }));

const nut = (id, ten, tinh, xa = [], o = {}) => ({ id, ten, tinh, xa: new Set(xa), khoa: khoaNut(ten, o.biDanh ?? []), diem: o.diem ?? null, mst: o.mst ?? null,
  tier: o.tier ?? "xac_minh", nguonDuc: o.nguonDuc ?? null });
const bg = (ten, tinh, xa = null, o = {}) => ({ ma: o.ma ?? "m1", ten_chuan: ten ? chuanKhop(ten) : null, tinh, xa, diem: o.diem ?? null, mst: o.mst ?? null, ly_do_trong: o.lyDo ?? null });

const N = [
  nut(1, "Sunrise City", "vn-hcmc", ["x-tan-hung"]),
  nut(2, "Masteri West Heights", "vn-hanoi", ["x-tay-mo"], { mst: "0101", diem: { lat: 21.0, lng: 105.75 } }),
  nut(3, "Happy One Central", "vn-hcmc"), nut(4, "Happy One Central", "vn-hcmc"),
  nut(5, "Saigon Pearl", "vn-hcmc", ["x-thanh-my-tay"]),
  nut(6, "The Manor", "vn-hanoi"),
  // Nút ứng viên do S06 đúc (mot_loi_khai, nguonDuc S06): ô «nút ứng viên nguồn khác» chạy trên nút này, không trên nút xác minh 5.
  nut(8, "Masteri Centre Point", "vn-hcmc", ["x-an-loi-dong"], { tier: "mot_loi_khai", nguonDuc: "S06" }),
];

// Ma trận viết trước: [tên ô, bản ghi, nối sẵn, kết cục mong].
const MA_TRAN = [
  ["da-noi", bg("Sunrise City", "vn-hcmc", "x-tan-hung", { ma: "s1" }), new Map([["s1", 1]]), { nga: "giu", node_id: 1 }],
  ["ten-rong", bg(null, "vn-hcmc"), undefined, { nga: "chua_noi", ly_do: "khong-ten" }],
  ["khong-tinh", bg("Sunrise City", null), undefined, { nga: "chua_noi", ly_do: "khong-tinh" }],
  ["s10-khong-vi-tri", bg("A", null, null, { lyDo: "khong-vi-tri" }), undefined, { nga: "chua_noi", ly_do: "khong-vi-tri" }],
  ["K1", bg("Masteri West Heights", "vn-hanoi", null, { mst: "0101" }), undefined, { nga: "noi", can_cu: "K1", node_id: 2 }],
  ["K2", bg("Masteri West Heights", "vn-hanoi", null, { diem: { lat: 21.001, lng: 105.751 } }), undefined, { nga: "noi", can_cu: "K2", node_id: 2 }],
  ["diem-gan-ten-khac", bg("Lumi Hà Nội", "vn-hanoi", "x-tay-mo", { diem: { lat: 21.001, lng: 105.751 } }), undefined, { nga: "chua_noi", ly_do: "khong-khop" }],
  ["K3", bg("Sunrise City", "vn-hcmc", "x-tan-hung"), undefined, { nga: "noi", can_cu: "K3", node_id: 1 }],
  ["T", bg("Saigon Pearl", "vn-hcmc", "x-khac"), undefined, { nga: "noi", can_cu: "T", node_id: 5 }],
  ["hai-nut", bg("Happy One Central", "vn-hcmc"), undefined, { nga: "chua_noi", ly_do: "nhieu-nut" }],
  ["khac-tinh (cung-tinh)", bg("The Manor", "vn-hcmc"), undefined, { nga: "chua_noi", ly_do: "khong-khop" }],
  ["nut-ung-vien-nguon-khac", bg("Masteri Centre Point", "vn-hcmc", "x-khac"), undefined, { nga: "noi", can_cu: "T", node_id: 8 }],
];

const goc = (kq) => ({ nga: kq.nga, ...(kq.can_cu ? { can_cu: kq.can_cu } : {}), ...(kq.node_id ? { node_id: kq.node_id } : {}), ...(kq.ly_do ? { ly_do: kq.ly_do } : {}) });

function kiemMaTran(fn) {
  assert.equal(MA_TRAN.length, 12);
  for (const [ten, b, san, mong] of MA_TRAN) assert.deepEqual(goc(fn(b, N, san)), mong, `ô ${ten}`);
}

test("BN-AC-2 ma-tran-12-o", () => kiemMaTran(xepNga));

test("BN-AC-2 nut-chi-co-tinh-ra-T-khong-ra-K3", () => {
  const kq = xepNga(bg("The Manor", "vn-hanoi", "x-ba-dinh"), N);
  assert.deepEqual(goc(kq), { nga: "noi", can_cu: "T", node_id: 6 });
});

test("BN-AC-2 bi-danh-ngan-khong-tinh-trung", () => {
  const n = [nut(9, "Chung cư Hoàng Anh Gia Lai Lake View", "vn-da-nang", [], { biDanh: ["abc"] })];
  assert.deepEqual(goc(xepNga(bg("abc", "vn-da-nang"), n)), { nga: "chua_noi", ly_do: "khong-khop" });
  const dai = [nut(9, "HAGL Lake View", "vn-da-nang", [], { biDanh: ["hoang anh lake view"] })];
  assert.deepEqual(goc(xepNga(bg("Hoang Anh Lake View", "vn-da-nang"), dai)), { nga: "noi", can_cu: "T", node_id: 9 });
});

test("BN-AC-6 noi-san-thang-khac-noi-san-chi-ghi", () => {
  const kq = xepNga(bg("Saigon Pearl", "vn-hcmc", "x-thanh-my-tay", { ma: "p" }), N, new Map([["p", 1]]));
  assert.equal(kq.nga, "giu");
  assert.equal(kq.node_id, 1, "nối có sẵn thắng");
  assert.equal(kq.khac_noi_san, 5, "bóng ra nút khác thì ghi khác nối sẵn");
  assert.deepEqual(goc(kq.bong), { nga: "noi", can_cu: "K3", node_id: 5 });
});

test("BN-AC-3 bam-doi-khi-ket-cuc-doi", () => {
  const ds = MA_TRAN.map(([, b, san], i) => ({ ma: `m${i}`, kq: xepNga(b, N, san) }));
  const h = bamKetCuc(ds);
  assert.equal(h, bamKetCuc([...ds].reverse()), "băm không phụ thuộc thứ tự");
  const doi = ds.map((d, i) => (i === 7 ? { ...d, kq: { ...d.kq, node_id: 99 } } : d));
  assert.notEqual(bamKetCuc(doi), h);
});

// Ô biên K2 (Hỏi-1, Mạnh duyệt 28/11; ngưỡng 300 m của thiết kế §3.2). Nút ứng viên do S08 đúc có điểm (21.0, 105.75).
// 1° vĩ độ ≈ 111.195 m: 150 m ≈ 0,001349°, 301 m ≈ 0,002707°, 350 m ≈ 0,003148°. Quá ngưỡng thì không ra K2 mà rơi xuống ngả
// kế theo thứ tự K2 → K3 → T: cùng xã → K3, khác xã → T (tên trùng đúng một nút cùng tỉnh).
const NUT_S08 = [nut(7, "Celesta Gold", "vn-hcmc", ["x-nha-be"], { diem: { lat: 21.0, lng: 105.75 }, tier: "mot_loi_khai", nguonDuc: "S08" })];
const BIEN_K2 = [
  ["150m", bg("Celesta Gold", "vn-hcmc", "x-khac", { diem: { lat: 21.001349, lng: 105.75 } }), { nga: "noi", can_cu: "K2", node_id: 7 }],
  ["301m-khac-xa", bg("Celesta Gold", "vn-hcmc", "x-khac", { diem: { lat: 21.002707, lng: 105.75 } }), { nga: "noi", can_cu: "T", node_id: 7 }],
  ["350m-khac-xa", bg("Celesta Gold", "vn-hcmc", "x-khac", { diem: { lat: 21.003148, lng: 105.75 } }), { nga: "noi", can_cu: "T", node_id: 7 }],
  ["301m-cung-xa", bg("Celesta Gold", "vn-hcmc", "x-nha-be", { diem: { lat: 21.002707, lng: 105.75 } }), { nga: "noi", can_cu: "K3", node_id: 7 }],
];
const kiemO = (fn, ten) => { const [, b, mong] = BIEN_K2.find(([t]) => t === ten); assert.deepEqual(goc(fn(b, NUT_S08)), mong, `ô K2 biên ${ten} (nguong 300)`); };
const kiemBienK2 = (fn) => { for (const [ten] of BIEN_K2) kiemO(fn, ten); };

test("BN-AC-2 k2-bien-300m: 150 m ra K2; 301 m, 350 m khong ra K2", () => kiemBienK2(xepNga));

test("BN-AC-2 chieu-do: nang nguong K2 len 400 m thi o 350 m do", async () => {
  const src = readFileSync(join(LIB, "khop-du-an.mjs"), "utf8");
  const tu = "const K2_M = 300;";
  assert.ok(src.includes(tu), "đột biến ngưỡng không áp được");
  const ban = src.replace(tu, "const K2_M = 400;").replace(/from "\.\/([^"]+)"/g, (_m, t) => `from "${pathToFileURL(join(LIB, t)).href}"`);
  const f = join(TAM, "khop-dot-k2.mjs");
  writeFileSync(f, ban);
  const m = await import(pathToFileURL(f).href);
  // Chứng riêng ô 350 m (không dừng ở ô 301 m đỏ trước): với ngưỡng 400 m, ô 350 m phải đỏ, ô 150 m vẫn xanh.
  assert.throws(() => kiemO(m.xepNga, "350m-khac-xa"), /ô K2 biên 350m-khac-xa \(nguong 300\)/);
  assert.doesNotThrow(() => kiemO(m.xepNga, "150m"), "đối chứng: ô 150 m vẫn ra K2 với ngưỡng 400 m");
});

test("BN-AC-2 chieu-do: bo dieu kien cung tinh thi o khac-tinh do", async () => {
  const src = readFileSync(join(LIB, "khop-du-an.mjs"), "utf8");
  const tu = "n.tinh === b.tinh && n.khoa.has(b.ten_chuan)";
  assert.ok(src.includes(tu), "đột biến không áp được");
  const ban = src.replace(tu, "n.khoa.has(b.ten_chuan)").replace(/from "\.\/([^"]+)"/g, (_m, t) => `from "${pathToFileURL(join(LIB, t)).href}"`);
  const f = join(TAM, "khop-dot.mjs");
  writeFileSync(f, ban);
  const m = await import(pathToFileURL(f).href);
  assert.throws(() => kiemMaTran(m.xepNga), /ô khac-tinh \(cung-tinh\)/);
});

test("BN-AC-2 chieu-do: bo khop loc bo nut ung vien thi o nut-ung-vien-nguon-khac va o K2 nut S08 do", async () => {
  const src = readFileSync(join(LIB, "khop-du-an.mjs"), "utf8");
  const tu = "n.tinh === b.tinh && n.khoa.has(b.ten_chuan)";
  assert.ok(src.includes(tu), "đột biến không áp được");
  const ban = src.replace(tu, `${tu} && n.tier !== "mot_loi_khai"`).replace(/from "\.\/([^"]+)"/g, (_m, t) => `from "${pathToFileURL(join(LIB, t)).href}"`);
  const f = join(TAM, "khop-dot-hang.mjs");
  writeFileSync(f, ban);
  const m = await import(pathToFileURL(f).href);
  assert.throws(() => kiemMaTran(m.xepNga), /ô nut-ung-vien-nguon-khac/);
  assert.throws(() => kiemO(m.xepNga, "150m"), /ô K2 biên 150m \(nguong 300\)/);
});
