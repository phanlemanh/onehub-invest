// kev-phat-bieu.test.mjs — PL5 KP-AC-3: hàm thuần đổi một dòng cột Kev của bảng nạp thành phát biểu theo bài
// (_acceptance/meta-kev-thanh-phat-bieu/evals.yaml E3). Ma trận viết trước; ca đỏ trên bản sao đột biến cạnh tệp thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { kevThanhPhatBieu } from "../lib/kev-phat-bieu.mjs";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "kev-phat-bieu.mjs");
const AT = "2026-10-30T01:02:03.000Z";
const MODEL = "kev-4b@v5";
const dong = (post_id, d) => ({
  post_id, kev_p: null, kev_intent: null, kev_intent_p: null, kev_kind: null, kev_kind_p: null, kev_model: MODEL, kev_at: AT, ...d,
});
const pb = (post_id, field, value, p, kev_p) => ({
  subject_key: `S03:${post_id}`, field, value, evidence_tier: "inferred", method: "kev", method_version: MODEL,
  evidence: { p, kev_p, model: MODEL }, observed_at: AT,
});

// [tên dòng, vào, ra (danh sách phát biểu), số ngoài bộ]
const MA_TRAN = [
  ["tin rao bán", dong("p1", { kev_p: 0.97, kev_intent: "offer", kev_intent_p: 0.91, kev_kind: "sale", kev_kind_p: 0.88 }),
    [pb("p1", "listing_intent", "offer", 0.91, 0.97), pb("p1", "kind", "sale", 0.88, 0.97)], 0],
  ["Yêu cầu thuê", dong("p2", { kev_p: 0.8, kev_intent: "inquiry", kev_intent_p: 0.62, kev_kind: "rent", kev_kind_p: 0.7 }),
    [pb("p2", "listing_intent", "inquiry", 0.62, 0.8), pb("p2", "kind", "rent_lt", 0.7, 0.8)], 0],
  ["không phải tin", dong("p3", { kev_p: 0.1, kev_intent: "not_listing", kev_intent_p: 0.95 }),
    [pb("p3", "listing_intent", "not_listing", 0.95, 0.1)], 0],
  ["chỉ ý định", dong("p4", { kev_p: 0.9, kev_intent: "offer", kev_intent_p: 0.77 }),
    [pb("p4", "listing_intent", "offer", 0.77, 0.9)], 0],
  ["v3 chỉ kev_p", dong("p5", { kev_p: 0.8 }), [], 0],
  ["gate down", dong("p6", { kev_model: null, kev_at: null }), [], 0],
  ["ngoài bộ", dong("p7", { kev_p: 0.5, kev_intent: "mua", kev_intent_p: 0.5, kev_kind: "rent_lt", kev_kind_p: 0.5 }), [], 2],
];

function chayMaTran(ham) {
  let soAssert = 0;
  for (const [ten, vao, ra, ngoaiBo] of MA_TRAN) {
    const kq = ham(vao);
    assert.deepEqual(kq.rows, ra, `dòng «${ten}»`);
    assert.equal(kq.ngoaiBo, ngoaiBo, `dòng «${ten}»: đếm ngoài bộ`);
    soAssert++;
  }
  return soAssert;
}

test("KP-AC-3 ma trận 7 dòng: dòng cột Kev → đúng danh sách phát biểu (rent → rent_lt, lớp inferred, phương pháp kev)", () => {
  assert.equal(MA_TRAN.length, 7);
  assert.equal(chayMaTran(kevThanhPhatBieu), MA_TRAN.length);
});

/** Chép lib cạnh tệp thật với một chỗ đổi, import động, trả lỗi assert của ma trận (hoặc null). Xoá bản sao sau. */
let soBan = 0; // mỗi bản sao một tên — import() giữ module theo URL
async function dotBien(tu, thanh) {
  const goc = readFileSync(LIB, "utf8");
  assert.ok(goc.includes(tu), `bản sao đột biến: không thấy «${tu}» trong lib`);
  const sao = LIB.replace(/\.mjs$/, `.dot-bien-${process.pid}-${++soBan}.mjs`);
  writeFileSync(sao, goc.replace(tu, thanh));
  try {
    const { kevThanhPhatBieu: ham } = await import(pathToFileURL(sao).href);
    try { chayMaTran(ham); return null; } catch (e) { return e.message; }
  } finally {
    rmSync(sao, { force: true });
  }
}

test("KP-AC-3 đối chứng: bỏ đổi rent → rent_lt thì dòng «Yêu cầu thuê» trượt", async () => {
  const loi = await dotBien('rent: KIND.rent_lt', 'rent: "rent"');
  assert.match(loi ?? "ma trận vẫn xanh", /Yêu cầu thuê/);
});

test("KP-AC-3 đối chứng: bỏ kiểm ngoài bộ thì dòng «ngoài bộ» trượt", async () => {
  const loi = await dotBien("const hopLe = (bo, v) => bo.includes(v);", "const hopLe = (bo, v) => v != null;");
  assert.match(loi ?? "ma trận vẫn xanh", /ngoài bộ/);
});
