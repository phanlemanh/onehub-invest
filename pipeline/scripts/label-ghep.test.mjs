// label-ghep.test.mjs — hồ sơ ghep-anh-tren-the-gan-nhan AC-1. Ma trận sáu loại bài và ca cụm lệch số tin chữ gần: `ghep` phải bằng
// kết quả gọi trực tiếp ganBaiAnh. Hàm thuần, không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ganBaiAnh, laChiAnh } from "../lib/gop-anh.mjs";
import { ghepChoMau } from "../lib/ghep-mau.mjs";

const LIB = join(import.meta.dirname, "../lib");
const t = (giay) => new Date(Date.UTC(2026, 10, 5, 3, 0, giay)).toISOString();
const bai = (post_id, text, giay, sender_id = "n1", conversation_id = "g1") => ({ post_id, text, posted_at: t(giay), sender_id, conversation_id });
const U = "https://cdn.example.test/a.jpg";

const POSTS = [
  // một tin chữ
  bai("T1", "Cho thuê 2PN", 0), bai("A1", U, 5), bai("A2", U, 6),
  // nhiều tin chữ: T2 gần A3, T3 trong cửa sổ của A4, cụm lệch số tin chữ gần
  bai("T2", "Bán 1PN", 1000, "n2"), bai("A3", U, 1001, "n2"), bai("A4", U, 1040, "n2"), bai("T3", "Bán 3PN", 1100, "n2"),
  // không tin chữ
  bai("A5", U, 2000, "n3"),
  // có chữ, có cụm: dòng mẫu là chính tin chữ
  bai("T4", "Bán studio", 3000, "n4"), bai("A6", U, 3010, "n4"),
  // có chữ, không cụm
  bai("T5", "Cho thuê studio", 4000, "n5"),
  // thiếu người gửi
  bai("A7", U, 5000, null),
];
const ITEMS = [["1", "A1"], ["2", "A2"], ["3", "A3"], ["4", "A5"], ["5", "T4"], ["6", "T5"], ["7", "A7"], ["8", "A4"], ["9", "khong-co"]].map(([item_id, ref_id]) => ({ item_id, ref_id }));
const G = ghepChoMau(ITEMS, POSTS);
const ganThat = ganBaiAnh(POSTS.filter((p) => !laChiAnh(p.text)), POSTS.filter((p) => laChiAnh(p.text)));

const MA_TRAN = [
  ["mot tin chu", "1", { chu_ref: "T1", anh_refs: ["A1", "A2"], so_chu_gan: 1, trung_voi: null }],
  ["dong trung cum tro ve dai dien", "2", { chu_ref: "T1", anh_refs: ["A1", "A2"], so_chu_gan: 1, trung_voi: "A1" }],
  ["nhieu tin chu lay so lon nhat tren cum", "3", { chu_ref: "T2", anh_refs: ["A3", "A4"], so_chu_gan: 2, trung_voi: null }],
  ["khong tin chu", "4", { chu_ref: null, anh_refs: ["A5"], so_chu_gan: 0, trung_voi: null }],
  ["co chu co cum", "5", { chu_ref: "T4", anh_refs: ["A6"], so_chu_gan: 1, trung_voi: null }],
  ["co chu khong cum la null", "6", null],
  ["thieu nguoi gui", "7", { chu_ref: null, anh_refs: ["A7"], so_chu_gan: 0, trung_voi: null }],
  ["cum lech: dong sau cung cum co cung co", "8", { chu_ref: "T2", anh_refs: ["A3", "A4"], so_chu_gan: 2, trung_voi: "A3" }],
  ["bai khong con trong stg la null", "9", null],
];
for (const [ten, item, ky] of MA_TRAN) {
  test(`GHEP-AC-1 ${ten}`, () => assert.deepEqual(G.get(item), ky));
}

test("GHEP-AC-1 ma tran du moi dong mau", () => assert.equal(MA_TRAN.length, ITEMS.length));

test("GHEP-AC-1 moi dong khop ganBaiAnh goi truc tiep", () => {
  for (const it of ITEMS) {
    const p = POSTS.find((x) => x.post_id === it.ref_id);
    const g = G.get(it.item_id);
    if (!p) continue;
    if (laChiAnh(p.text)) assert.equal(g.chu_ref, ganThat.get(p.post_id) ?? null, it.ref_id);
    for (const a of g?.chu_ref ? g.anh_refs : []) assert.equal(ganThat.get(a), g.chu_ref, a);
  }
});

test("GHEP-AC-1 cach 119 giay do khi doi cua so sang 60: doi chung ban sao dot bien", async () => {
  const moc = [bai("TX", "Bán", 0, "m"), bai("AX", U, 119, "m")];
  const it = [{ item_id: "1", ref_id: "AX" }];
  assert.equal(ghepChoMau(it, moc).get("1").chu_ref, "TX");
  const d = mkdtempSync(join(tmpdir(), "ghep-"));
  try {
    writeFileSync(join(d, "gop-anh.mjs"), readFileSync(join(LIB, "gop-anh.mjs"), "utf8").replace("CUA_SO_GIAY = 120", "CUA_SO_GIAY = 60"));
    copyFileSync(join(LIB, "ghep-mau.mjs"), join(d, "ghep-mau.mjs"));
    const m = await import(join(d, "ghep-mau.mjs"));
    assert.equal(m.ghepChoMau(it, moc).get("1").chu_ref, null, "đột biến cửa sổ phải đổi kết quả");
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

// Quét lớp: mã của vòng này không có cửa sổ thời gian riêng.
const tepQuet = (goc) => {
  const out = [];
  const di = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== "node_modules") di(p); } else if (/\.(ts|tsx|mjs)$/.test(f)) out.push(p); } };
  di(goc);
  return out;
};
test("GHEP-AC-1 khong co luat thu hai", () => {
  const goc = join(import.meta.dirname, "../..");
  const CUA_APP = /ganBaiAnh|cuaSoGiay|CUA_SO_GIAY|posted_at\s*[<>-]/;
  const CUA_MAU = /\b120\b/;
  assert.match("const c = 120", CUA_MAU, "đối chứng: hằng cửa sổ bị bắt");
  assert.match("ganBaiAnh(a, b)", CUA_APP, "đối chứng: gọi luật ở app bị bắt");
  const boChuThich = (f) => readFileSync(f, "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  for (const f of ["pipeline/lib/ghep-mau.mjs", "pipeline/label-ghep.mjs"]) assert.doesNotMatch(boChuThich(join(goc, f)), CUA_MAU, `${f} có hằng cửa sổ riêng`);
  const tepApp = [...tepQuet(join(goc, "app/src/components/ops/labels")), join(goc, "app/src/lib/labels-anh.ts"), join(goc, "app/src/lib/labels-cum.ts")];
  assert.ok(tepApp.length > 5);
  for (const f of tepApp) assert.doesNotMatch(boChuThich(f), CUA_APP, `${f} có luật ghép riêng`);
});
