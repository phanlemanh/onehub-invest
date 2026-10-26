// tin-rao-doi-phuong-noi-post-ids AC-1 (ma trận mười ca, hàm thuần) · AC-2 (bài mồi S03 + S05 qua transform thật, DB local
// trong BEGIN…ROLLBACK). Chạy: node --test scripts/lib/doi-phuong.test.mjs
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { lech as lechCu } from "../kiem-tin-rao-gan-khu-vuc.mjs";
import { runTransformFb } from "../../pipeline/transform-fb.mjs";
import { runTransformZalo } from "../../pipeline/transform-zalo.mjs";
import { MOI, chenMoi, chupTin, danhDauLac, lechTheoBai } from "./doi-phuong.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const tin = (offer_id, area_id, post_ids = [], source = "S05") => ({ offer_id, source, area_id, hop_le: area_id !== null, post_ids });
const map = (...ts) => new Map(ts.map((t) => [t.offer_id, t]));
const gon = (r) => ({
  lech: r.lech.map((l) => `${l.loai}:${l.offer_id}:${l.post_id ?? "-"}`),
  khongCon: r.khongCon.map((k) => `${k.offer_id}:${k.post_id ?? "-"}`),
});

// [tên ca, chụp trước, chụp sau, kết quả viết trước]
const MA_TRAN = [
  ["a cùng mã cùng phường", map(tin("o1", "X", ["p1"])), map(tin("o1", "X", ["p1"])), { lech: [], khongCon: [] }],
  ["b cùng mã, phường NULL", map(tin("o1", "X", ["p1"])), map(tin("o1", null, ["p1"])), { lech: ["mat-phuong:o1:p1"], khongCon: [] }],
  ["c cùng mã, đổi phường", map(tin("o1", "X", ["p1"])), map(tin("o1", "Y", ["p1"])), { lech: ["doi-phuong:o1:p1"], khongCon: [] }],
  ["d mã đổi, cùng phường", map(tin("o1", "X", ["p1"])), map(tin("o2", "X", ["p1"])), { lech: [], khongCon: [] }],
  ["e mã đổi, phường NULL", map(tin("o1", "X", ["p1"])), map(tin("o2", null, ["p1"])), { lech: ["mat-phuong:o1:p1"], khongCon: [] }],
  ["f mã đổi, đổi phường", map(tin("o1", "X", ["p1"])), map(tin("o2", "Y", ["p1"])), { lech: ["doi-phuong:o1:p1"], khongCon: [] }],
  ["g bài không còn", map(tin("o1", "X", ["p1"])), map(tin("o9", "X", ["p9"])), { lech: [], khongCon: ["o1:p1"] }],
  ["h hai bài, mã cũ giữ một, bài kia sang tin mới NULL", map(tin("o1", "X", ["p1", "p2"])), map(tin("o1", "X", ["p2"]), tin("o2", null, ["p1"])), { lech: ["mat-phuong:o1:p1"], khongCon: [] }],
  ["i hai bài sang hai tin, một giữ một đổi", map(tin("o1", "X", ["p1", "p2"])), map(tin("o2", "X", ["p1"]), tin("o3", "Y", ["p2"])), { lech: ["doi-phuong:o1:p2"], khongCon: [] }],
  ["j S06 không bài, cùng mã, phường NULL", map(tin("s1", "X", [], "S06")), map(tin("s1", null, [], "S06")), { lech: ["mat-phuong:s1:-"], khongCon: [] }],
];

test("DP-AC-1 ma trận mười ca lechTheoBai", () => {
  let n = 0;
  for (const [ten, truoc, sau, mong] of MA_TRAN) {
    assert.deepEqual(gon(lechTheoBai(truoc, sau)), mong, `ca ${ten}`);
    n++;
  }
  assert.equal(n, 10, "ma trận viết trước phải đủ mười ca");
});

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)"); // cùng khoá với test transform khác
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const quaHaiLuot = async (c) => {
  const bai = await chenMoi(c);
  await runTransformZalo(c);
  await runTransformFb(c);
  const c1 = await chupTin(c);
  await danhDauLac(c);
  await runTransformZalo(c);
  await runTransformFb(c);
  const c2 = await chupTin(c);
  return { bai, c1, c2 };
};

test("DP-AC-2 bài mồi S03 và S05 mất phường qua hai lượt transform → lechTheoBai bắt", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const { bai, c1, c2 } = await quaHaiLuot(c);
    for (const p of bai) {
      const t = [...c1.values()].find((o) => (o.post_ids ?? []).includes(p));
      assert.equal(t?.area_id, MOI.area, `bài mồi ${p} không gắn phường mồi ở lượt đầu — mồi hỏng`);
    }
    const { lech } = lechTheoBai(c1, c2);
    assert.deepEqual(lech.map((l) => l.post_id).sort(), [...bai].sort(), "lechTheoBai không trả đúng hai bài mồi");
    assert.ok(lech.every((l) => l.loai === "mat-phuong"), `bài mồi phải mất phường: ${JSON.stringify(lech)}`);
  });
});

test("DP-AC-2 thước cũ nối theo offer_id không thấy", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const { c1, c2 } = await quaHaiLuot(c);
    assert.deepEqual(lechCu(c1, c2), [], "thước cũ lẽ ra mù với tin đổi mã — đối chứng sai");
  });
});
