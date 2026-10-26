// nap-lai.test.mjs — PL14 nạp lại không xoá, phần không cần DB (NL-AC-n ↔ _acceptance/nap-lai-khong-xoa/evals.yaml).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { anchorPost, assignOfferIds, isNewScheme, mintOfferId } from "../lib/offer-key.mjs";
import { codeTree, scanDeleteRecords } from "../lib/scan-delete.mjs";

const P = (post_id, posted_at) => ({ post_id, posted_at });
// Lượt 1: hai nhóm repost. Lượt 2 đổi một biến; nhóm dựng lại theo khoá nội dung (giá/DT/PN/parser) như transform.
const luot1 = (src) => {
  const groups = [{ posts: [P("p1", "2026-10-20"), P("p2", "2026-10-21")] }, { posts: [P("q1", "2026-10-22")] }];
  const ra = assignOfferIds(src, groups, []);
  return ra.map((r, i) => ({ ...r, post_ids: groups[i].posts.map((p) => p.post_id) }));
};

// Ma trận hàm thuần viết trước: mỗi dòng = một HÌNH nhóm repost mà transform có thể dựng lại ở lượt sau (khi giá/DT/PN/
// parser đổi khoá nội dung); kỳ vọng offer_id của tin p1/p2 giữ nguyên. Ma trận qua transform thật (đổi giá/DT/PN/parser
// thật trong stg) ở nap-lai-db.itest.mjs «NL-AC-4 S0x qua transform thật».
const MA_TRAN = [
  ["nhóm dựng lại nguyên vẹn (cùng post)", [{ posts: [P("p1", "2026-10-20"), P("p2", "2026-10-21")] }]],
  ["nhóm tách: p2 sang nhóm khác", [{ posts: [P("p1", "2026-10-20")] }, { posts: [P("p2", "2026-10-21")] }]],
  ["nhóm dựng lại, thứ tự post đảo", [{ posts: [P("p2", "2026-10-21"), P("p1", "2026-10-20")] }]],
  ["nhóm dựng lại khi tin cũ còn nhóm khác (q1) vắng", [{ posts: [P("p1", "2026-10-20"), P("p2", "2026-10-21")] }]],
  ["thêm repost muộn hơn", [{ posts: [P("p1", "2026-10-20"), P("p2", "2026-10-21"), P("p3", "2026-10-25")] }]],
  ["thu bù post SỚM hơn neo", [{ posts: [P("p0", "2026-10-01"), P("p1", "2026-10-20"), P("p2", "2026-10-21")] }]],
];

for (const src of ["S03", "S05"]) {
  for (const [ten, groups2] of MA_TRAN) {
    test(`NL-AC-4 ${src} ${ten}: offer_id của tin p1 không đổi`, () => {
      const cu = luot1(src);
      const idCu = cu[0].offer_id;
      const moi = assignOfferIds(src, groups2, cu);
      assert.equal(moi[0].offer_id, idCu, `${ten}: offer_id đổi`);
      assert.equal(moi[0].originating_system_key, cu[0].originating_system_key);
    });
  }
}

test("NL-AC-4 khoá mới = 'offer_' + sha256('S03|'+post neo)[:16], neo = post sớm nhất", () => {
  const r = assignOfferIds("S03", [{ posts: [P("b", "2026-10-02"), P("a", "2026-10-01")] }], []);
  const tay = "offer_" + createHash("sha256").update("S03|a").digest("hex").slice(0, 16);
  assert.equal(r[0].offer_id, tay);
  assert.equal(r[0].originating_system_key, "a");
  assert.equal(anchorPost([P("x", null), P("y", "2026-01-01")]), "y");
  assert.equal(mintOfferId("S05", "a"), "offer_" + createHash("sha256").update("S05|a").digest("hex").slice(0, 16));
});

test("NL-AC-4 đối chứng: nhóm mới hoàn toàn (không post chung) → khoá khác; tin khoá cũ (băm nội dung) không được thừa kế", () => {
  const cu = luot1("S03");
  const moi = assignOfferIds("S03", [{ posts: [P("z1", "2026-10-23")] }], cu);
  assert.notEqual(moi[0].offer_id, cu[0].offer_id);
  const cuNoiDung = [{ offer_id: "offer_0123456789abcdef", originating_system_key: "p1", post_ids: ["p1", "p2"] }];
  assert.equal(isNewScheme("S03", cuNoiDung[0].offer_id, "p1"), false);
  const r = assignOfferIds("S03", [{ posts: [P("p1", "2026-10-20"), P("p2", "2026-10-21")] }], cuNoiDung);
  assert.equal(r[0].offer_id, mintOfferId("S03", "p1"), "khoá cũ băm nội dung phải được đổi sang khoá mới");
});

test("NL-AC-4 nhóm tách mà neo trùng khoá gốc tin cũ → không cấp trùng id", () => {
  const cu = [{ offer_id: mintOfferId("S03", "p1"), originating_system_key: "p1", post_ids: ["p1", "p2", "p3"] }];
  // p2,p3 chung nhiều hơn → nhận id cũ; nhóm còn lại neo p1 = khoá gốc tin cũ → phải lấy id khác
  const r = assignOfferIds("S03", [{ posts: [P("p1", "2026-10-20")] }, { posts: [P("p2", "2026-10-21"), P("p3", "2026-10-22")] }], cu);
  assert.equal(r[1].offer_id, cu[0].offer_id);
  assert.notEqual(r[0].offer_id, r[1].offer_id);
  assert.equal(r[0].originating_system_key, "p1#2");
  assert.ok(isNewScheme("S03", r[0].offer_id, r[0].originating_system_key), "khoá cấp thêm vẫn giữ bất biến khoá mới");
});

test("NL-AC-4 hoà số post chung: tin còn sống thắng tin đã nghỉ; kết quả không phụ thuộc thứ tự existing", () => {
  const song = { offer_id: mintOfferId("S03", "a"), originating_system_key: "a", post_ids: ["a", "b"] };
  const nghi = { offer_id: mintOfferId("S03", "c"), originating_system_key: "c", post_ids: ["c", "b"], retired_at: "2026-10-20" };
  const g = [{ posts: [P("b", "2026-10-21")] }];
  assert.equal(assignOfferIds("S03", g, [nghi, song])[0].offer_id, song.offer_id);
  assert.equal(assignOfferIds("S03", g, [song, nghi])[0].offer_id, song.offer_id);
});


const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("NL-AC-8 cây pipeline/ không còn DELETE FROM / TRUNCATE nhắm bảng tin hay listing", () => {
  const files = codeTree(ROOT, "pipeline");
  assert.ok(files.length > 50, "bộ quét đọc quá ít tệp — đường dẫn hỏng");
  assert.ok(files.some((f) => f.path === "pipeline/reassign-areas.mjs"));
  assert.deepEqual(scanDeleteRecords(files), []);
});

test("NL-AC-8 đối chứng: cây giả cấy một câu DELETE → đỏ nêu đường:dòng; chú thích và dấu bỏ qua không tính", () => {
  const goc = mkdtempSync(join(tmpdir(), "nap-lai-"));
  mkdirSync(join(goc, "pipeline", "lib"), { recursive: true });
  writeFileSync(join(goc, "pipeline", "a.mjs"), "const x = 1;\nawait c.query(`DELETE FROM listings WHERE x`);\n");
  writeFileSync(join(goc, "pipeline", "lib", "b.sql"), "-- DELETE FROM sale_offers\nTRUNCATE areas, listing_records CASCADE;\n");
  writeFileSync(join(goc, "pipeline", "c.mjs"), "// DELETE FROM listings\nawait c.query('DELETE FROM listings_x');\nDELETE FROM sale_offers; // quet-xoa:bo-qua\n");
  writeFileSync(join(goc, "pipeline", "d.test.mjs"), "DELETE FROM listings;\n");
  assert.deepEqual(scanDeleteRecords(codeTree(goc, "pipeline")).sort(), ["pipeline/a.mjs:2", "pipeline/lib/b.sql:2"]);
  assert.deepEqual(scanDeleteRecords([{ path: "x.mjs", text: 'DELETE FROM "public"."sale_offer_records" WHERE 1' }]), ["x.mjs:1"]);
});
