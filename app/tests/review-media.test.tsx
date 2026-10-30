// review-media.test.tsx — ảnh tin cho thẻ hàng duyệt /ops/review (buildOfferImages,
// stripEvidenceImages). Hồ sơ nghiệm thu: _acceptance/review-media-backend (AC-5, AC-7 review-card-photos).
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_IMAGES_PER_OFFER,
  buildOfferImages,
  stripEvidenceImages,
  type PostMediaRow,
} from "../src/lib/ops/review-media";

const SNAP = "hcmc__zalo-agent__2026-10-23T000000";
const local = (file: string, snapshot = SNAP) =>
  `/api/zalo-media?snapshot=${encodeURIComponent(snapshot)}&file=${encodeURIComponent(file)}`;
const ZDN = (n: number) => `https://f1-zpg-r.zdn.vn/${n}/anh-${n}.jpg`;
const FB = (n: number) => `https://scontent.xx.fbcdn.net/v/t39/${n}.jpg?oe=6720`;
const CHOTOT = "https://cdn.chotot.com/abc/preset:view/plain/x.jpg";

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

// Ca AC-6/AC-7 của loadReviewMedia (đọc bài qua stg_zalo_posts) đã thay bởi NH1 media-canonical-reso AC-5
// (tests/media-canonical.test.tsx «NH-AC-5 …»): loader nay đọc bảng media (053).

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
