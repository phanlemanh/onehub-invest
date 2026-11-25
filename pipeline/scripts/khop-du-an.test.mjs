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

const nut = (id, ten, tinh, xa = [], o = {}) => ({ id, ten, tinh, xa: new Set(xa), khoa: khoaNut(ten, o.biDanh ?? []), diem: o.diem ?? null, mst: o.mst ?? null });
const bg = (ten, tinh, xa = null, o = {}) => ({ ma: o.ma ?? "m1", ten_chuan: ten ? chuanKhop(ten) : null, tinh, xa, diem: o.diem ?? null, mst: o.mst ?? null, ly_do_trong: o.lyDo ?? null });

const N = [
  nut(1, "Sunrise City", "vn-hcmc", ["x-tan-hung"]),
  nut(2, "Masteri West Heights", "vn-hanoi", ["x-tay-mo"], { mst: "0101", diem: { lat: 21.0, lng: 105.75 } }),
  nut(3, "Happy One Central", "vn-hcmc"), nut(4, "Happy One Central", "vn-hcmc"),
  nut(5, "Saigon Pearl", "vn-hcmc", ["x-thanh-my-tay"]),
  nut(6, "The Manor", "vn-hanoi"),
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
  ["nut-ung-vien-nguon-khac", bg("Saigon Pearl", "vn-hcmc"), undefined, { nga: "noi", can_cu: "T", node_id: 5 }],
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
