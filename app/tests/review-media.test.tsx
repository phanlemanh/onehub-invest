// review-media.test.tsx — ảnh tin cho thẻ hàng duyệt /ops/review (buildOfferImages,
// loadReviewMedia với truy vấn giả). Hồ sơ nghiệm thu: _acceptance/review-media-backend (AC-5…AC-7).
import { test } from "node:test";
import assert from "node:assert/strict";

import type { User } from "../src/lib/auth";
import {
  MAX_IMAGES_PER_OFFER,
  buildOfferImages,
  loadReviewMedia,
  stripEvidenceImages,
  type PostMediaRow,
} from "../src/lib/ops/review-media";

const SNAP = "hcmc__zalo-agent__2026-10-23T000000";
const local = (file: string, snapshot = SNAP) =>
  `/api/zalo-media?snapshot=${encodeURIComponent(snapshot)}&file=${encodeURIComponent(file)}`;
const ZDN = (n: number) => `https://f1-zpg-r.zdn.vn/${n}/anh-${n}.jpg`;
const FB = (n: number) => `https://scontent.xx.fbcdn.net/v/t39/${n}.jpg?oe=6720`;
const CHOTOT = "https://cdn.chotot.com/abc/preset:view/plain/x.jpg";
const user = (role: User["role"]): User => ({ id: "1", email: `${role}@x.vn`, plan: "pro", role });
const ADMIN = user("admin");

const post = (offer_id: string, media_files: unknown, media: unknown = null, snapshot_id = SNAP): PostMediaRow => ({
  offer_id,
  snapshot_id,
  media,
  media_files,
});

test("AC-5 local trước, entry lỗi rơi về URL gốc expiring, không trùng, giữ thứ tự post", () => {
  const p1 = post(
    "o1",
    [
      { url: ZDN(1), file: "media/1.jpg", sha256: "a", bytes: 10, snapshotId: SNAP },
      { url: ZDN(2), file: null, error: "timeout", snapshotId: SNAP },
    ],
    [{ url: ZDN(1) }, { url: ZDN(2) }], // trùng với media_files
  );
  const p2 = post("o1", [{ url: ZDN(3), file: "media/3.jpg", snapshotId: "hanoi__zalo-agent__2026-10-22T070651" }], [
    { url: FB(4) },
  ]);
  const imgs = buildOfferImages([p1, p2], CHOTOT);
  assert.deepEqual(imgs, [
    { src: local("media/1.jpg"), origin: "local", expiring: false },
    { src: local("media/3.jpg", "hanoi__zalo-agent__2026-10-22T070651"), origin: "local", expiring: false },
    { src: ZDN(2), origin: "remote", expiring: true },
    { src: FB(4), origin: "remote", expiring: true },
    { src: CHOTOT, origin: "remote", expiring: false },
  ]);
});

test("AC-5 snapshotId thiếu trong entry thì dùng snapshot_id của post; tham số hỏng hoặc entry lỗi không thành ảnh local", () => {
  const imgs = buildOfferImages([
    post("o1", [
      { url: ZDN(1), file: "media/1.jpg" },
      { url: ZDN(2), file: "../manifest.json", snapshotId: SNAP },
      { url: ZDN(3), file: "media/3.jpg", snapshotId: "../evil" },
      // Có file nhưng mang error (vd sha lệch) → không tin file, rơi về URL gốc.
      { url: ZDN(4), file: "media/4.jpg", error: "sha256 mismatch", snapshotId: SNAP },
    ]),
  ]);
  assert.deepEqual(
    imgs.map((i) => [i.origin, i.src]),
    [
      ["local", local("media/1.jpg")],
      ["remote", ZDN(2)],
      ["remote", ZDN(3)],
      ["remote", ZDN(4)],
    ],
  );
});

test("AC-5 should-NOT-fire: URL không phải http(s) và giá trị rác bị bỏ", () => {
  const imgs = buildOfferImages(
    [
      post("o1", "khong-phai-mang", [
        { url: "javascript:alert(1)" },
        { url: "data:image/png;base64,AAAA" },
        { url: "/api/zalo-media?path=/etc/passwd" },
        { url: 42 },
        null,
        "chuoi",
        { path: "/tmp/openclaw/x.jpg", url: null },
      ]),
      post("o1", null, "null"),
    ],
    "file:///etc/passwd",
  );
  assert.deepEqual(imgs, []);
});

test("AC-5 tối đa 12 ảnh mỗi tin rao — 11 giữ đủ, 13 cắt còn 12", () => {
  assert.equal(MAX_IMAGES_PER_OFFER, 12);
  const many = (n: number) => [post("o1", null, Array.from({ length: n }, (_, i) => ({ url: FB(i) })))];
  assert.equal(buildOfferImages(many(11)).length, 11);
  const cut = buildOfferImages(many(13));
  assert.equal(cut.length, 12);
  assert.equal(cut[11].src, FB(11));
});

type Call = { text: string; values: unknown[] };
function fakeQuery(rows: PostMediaRow[]) {
  const calls: Call[] = [];
  const query = async (text: string, values: unknown[]) => {
    calls.push({ text, values });
    return { rows };
  };
  return { calls, query };
}

const ITEMS = [
  {
    id: 7,
    item_type: "entity_match",
    evidence: {
      offer_a: { offer_id: "offer_a1", source: "S05" },
      offer_b: { offer_id: "offer_b1", source: "S06", image_url: CHOTOT },
    },
  },
  { id: 9, item_type: "agent_output", evidence: { offer_id: "offer_a1", fields: [] } },
  { id: 11, item_type: "source_decision", evidence: { offer_id: "offer_a1" } },
  { id: 12, item_type: "agent_output", evidence: { fields: [] } },
  { id: 13, item_type: "entity_match", evidence: null },
];

test("AC-6 khoá theo id thẻ: entity_match có offer_a/offer_b, agent_output có offer, một truy vấn", async () => {
  const { calls, query } = fakeQuery([post("offer_a1", null, [{ url: FB(1) }])]);
  const out = await loadReviewMedia(ITEMS, ADMIN, query);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].values, [["offer_a1", "offer_b1"]]);
  assert.match(calls[0].text, /stg_zalo_posts/);
  assert.deepEqual(Object.keys(out).map(Number).sort((a, b) => a - b), [7, 9]);
  assert.deepEqual(out[7], {
    offer_a: [{ src: FB(1), origin: "remote", expiring: true }],
    offer_b: [{ src: CHOTOT, origin: "remote", expiring: false }],
  });
  assert.deepEqual(out[9], { offer: [{ src: FB(1), origin: "remote", expiring: true }] });
});

test("AC-6 tin rao không có post nào vẫn có mục rỗng để UI hiện «không có ảnh»", async () => {
  const { query } = fakeQuery([]);
  const out = await loadReviewMedia([ITEMS[1]], ADMIN, query);
  assert.deepEqual(out, { 9: { offer: [] } });
});

test("AC-7 should-NOT-fire: không phải admin → {} và không truy vấn DB", async () => {
  for (const u of [null, user("user"), user("ops")]) {
    const { calls, query } = fakeQuery([post("offer_a1", null, [{ url: FB(1) }])]);
    assert.deepEqual(await loadReviewMedia(ITEMS, u, query), {});
    assert.equal(calls.length, 0, u?.role ?? "khách");
  }
});

test("AC-7 DB thiếu bảng stg_zalo_posts (cloud) → {}; lỗi DB khác vẫn ném", async () => {
  const failWith = (code: string) => async () => {
    throw Object.assign(new Error(`lỗi ${code}`), { code });
  };
  assert.deepEqual(await loadReviewMedia(ITEMS, ADMIN, failWith("42P01")), {});
  await assert.rejects(loadReviewMedia(ITEMS, ADMIN, failWith("57P01")), /57P01/);
});

test("AC-7 không thẻ nào cần ảnh → {} và không truy vấn", async () => {
  const { calls, query } = fakeQuery([]);
  assert.deepEqual(await loadReviewMedia([ITEMS[2], ITEMS[3]], ADMIN, query), {});
  assert.equal(calls.length, 0);
});

test("AC-7 (review-card-photos) stripEvidenceImages bỏ image_url hai bên, giữ mọi field khác, không đụng bản gốc", () => {
  const ev = {
    stage_b_score: 0.8,
    offer_a: { offer_id: "a", text: "nhà" },
    offer_b: { offer_id: "b", subject: "nhà", image_url: CHOTOT },
  };
  const out = stripEvidenceImages(ev);
  assert.deepEqual(out, { stage_b_score: 0.8, offer_a: { offer_id: "a", text: "nhà" }, offer_b: { offer_id: "b", subject: "nhà" } });
  assert.equal(ev.offer_b.image_url, CHOTOT, "bản gốc giữ nguyên (loader còn cần)");
  assert.doesNotMatch(JSON.stringify(stripEvidenceImages({ offer_a: { image_url: FB(1) }, offer_b: { image_url: FB(2) } })), /fbcdn/);
  assert.deepEqual(stripEvidenceImages({ offer_id: "x", fields: [] }), { offer_id: "x", fields: [] });
  assert.deepEqual(stripEvidenceImages(null), {});
});
