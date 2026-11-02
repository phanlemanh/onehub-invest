// seller-ref.itest.mjs — hồ sơ _acceptance/seller-ref-theo-nguoi-gui (HD4) E4, E5: lượt transform S03 + S05 thật ghi
// seller_ref theo người gửi bài neo; giá trị mới qua biểu thức che của sync-cloud. Chạy trong BEGIN…ROLLBACK trên DB thử
// (executor seller_ref_that) — không để lại dòng nào. Đối chứng: transform của commit nền ED0 trên cùng fixture.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { SELLER_REF_RE, selectList } from "../sync-cloud.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const PIPE = join(import.meta.dirname, "..");
const ED0 = "ed0ff2cd05fbb50b214d03fa6de426060a51d6da"; // main trước HD4
const DB_URL = process.env.DATABASE_URL ?? "";
const MIG_044 = readFileSync(join(PIPE, "../db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const SNAP = "hanoi__zalo-agent__2099-01-03T000000";
const HANG = "agent-hang-chung"; // author_hash chung của mọi bài fixture

async function withTx(fn) {
  assert.match(DB_URL, /\/oneinvest_[a-z0-9_]+$/, "cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)"); // cùng khoá với test-posts / write-offers (đối soát)
    if (!(await c.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok`)).rows[0].ok) await c.query(MIG_044);
    await napPhatBieu(c);
    await c.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
       ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

let seq = 0;
const tag = `sr${process.pid}`;
/** Gieo một bài; `agent` 'apify-facebook' là S05, còn lại S03. */
async function post(c, agent, sender, text, posted_at) {
  const id = `t_${tag}_${++seq}`;
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, author_hash, text, posted_at, sender_id, sender_name)
     VALUES ($1, $2, $3, 'Nhóm thử HD4', $4, $5, $6, $7, $7)`,
    [id, SNAP, agent, HANG, text, posted_at, sender]);
  return id;
}

// Người gửi: S03 toàn số; S05 một số, một đuôi chữ (dạng mã Facebook không phải số).
const A = `${process.pid}0001`, B = `${process.pid}0002`, X = `${process.pid}0005`, Y = `pfbid0Hd4${process.pid}xyz`;
// Giá lạ để nhóm fixture không chạm nhóm thật.
const DU = "Bán căn hộ 2PN 66.7m2 Nghĩa Đô, giá 3.17 tỷ";
const THIEU = "Cho thuê căn hộ 2PN full đồ, giá 17.3 triệu/tháng";
const FB1 = "Bán căn hộ 3PN 91.3m2 Cầu Giấy, giá 5.37 tỷ";
const FB2 = "Bán nhà 4 tầng 41.7m2 Đống Đa, giá 7.13 tỷ";

async function gieo(c) {
  const p = {};
  p.d1 = await post(c, "openclaw-hook", B, DU, "2026-10-25T04:00:00Z");
  p.d2 = await post(c, "openclaw-hook", A, DU, "2026-10-25T02:00:00Z"); // neo của tin DU (hai người) là A
  p.t1 = await post(c, "openclaw-hook", null, THIEU, "2026-10-25T01:00:00Z"); // không người gửi
  p.f1 = await post(c, "apify-facebook", Y, FB1, "2026-10-25T06:00:00Z");
  p.f2 = await post(c, "apify-facebook", X, FB1, "2026-10-25T05:00:00Z"); // neo của tin FB1 (hai người) là X
  p.g1 = await post(c, "apify-facebook", Y, FB2, "2026-10-25T07:00:00Z");
  return p;
}
const MONG = (p) => [[p.d1, "S03", A], [p.t1, "S03", null], [p.f1, "S05", X], [p.g1, "S05", Y]];

async function docRef(c, id) {
  const { rows } = await c.query(`SELECT offer_id, source, seller_ref FROM sale_offers WHERE $1 = ANY(post_ids)`, [id]);
  assert.equal(rows.length, 1, `bài ${id} không thành đúng một tin`);
  return rows[0];
}

/** Kiểm seller_ref của từng tin fixture; mọi tin cùng một giá trị (hằng) → thông điệp ghim. */
async function kiemRef(c, p) {
  const ra = [];
  for (const [id, source, mong] of MONG(p)) ra.push([await docRef(c, id), source, mong]);
  const khac = new Set(ra.map(([r]) => r.seller_ref));
  if (khac.size === 1) throw new Error(`TRANSFORM NEN VAN HANG: mọi tin mang ${[...khac][0]}`);
  for (const [r, source, mong] of ra) {
    assert.equal(r.source, source);
    assert.equal(r.seller_ref, mong, `tin ${r.offer_id} (${source}) seller_ref ${r.seller_ref}, mong ${mong}`);
  }
  return ra.map(([r]) => r.offer_id);
}

/** Nạp transform-zalo/transform-fb của commit nền cạnh tệp thật (import tương đối còn đúng), trả hai hàm chạy. */
async function transformNen() {
  const tep = [];
  try {
    const nap = async (ten) => {
      const f = join(PIPE, `${ten}.nen-sr-${process.pid}.mjs`);
      writeFileSync(f, execFileSync("git", ["show", `${ED0}:pipeline/${ten}.mjs`], { cwd: PIPE }));
      tep.push(f);
      return import(pathToFileURL(f).href);
    };
    return { zalo: (await nap("transform-zalo")).runTransformZalo, fb: (await nap("transform-fb")).runTransformFb };
  } finally {
    for (const f of tep) unlinkSync(f);
  }
}

test("SR AC-4/AC-5: transform S03 + S05 ghi người gửi bài neo; che sync-cloud giữ S03:<số>, S05 đuôi chữ → NULL", { timeout: 600_000 }, async () => {
  await withTx(async (c) => {
    const p = await gieo(c);
    await runTransformZalo(c);
    await runTransformFb(c);
    const ids = await kiemRef(c, p);

    // AC-5: biểu thức che mà sync-cloud dùng khi đẩy sale_offers (sync-cloud.mjs không sửa).
    const { sql } = selectList("sale_offers", ["offer_id", "source", "seller_ref"]);
    const { rows } = await c.query(`SELECT ${sql} FROM sale_offers WHERE offer_id = ANY($1)`, [ids]);
    const cloud = new Map(rows.map((r) => [r.offer_id, r.seller_ref]));
    const re = new RegExp(SELLER_REF_RE);
    const [dA, , fX, gY] = await Promise.all(MONG(p).map(([id]) => docRef(c, id)));
    assert.equal(cloud.get(dA.offer_id), `S03:${A}`);
    assert.match(cloud.get(dA.offer_id), re);
    assert.equal(cloud.get(fX.offer_id), `S05:${X}`);
    assert.equal(cloud.get(gY.offer_id), null, "S05 đuôi chữ phải lên cloud NULL");
    for (const v of cloud.values()) if (v !== null) assert.match(v, re, `giá trị lọt che: ${v}`);
    assert.doesNotMatch("ct:1", re, "đối chứng: giá trị thô không qua được leak gate");
  });
});

test("SR AC-4 đỏ: transform của commit nền trên cùng fixture → «TRANSFORM NEN VAN HANG»", { timeout: 600_000 }, async () => {
  const nen = await transformNen();
  await withTx(async (c) => {
    const p = await gieo(c);
    await nen.zalo(c);
    await nen.fb(c);
    await assert.rejects(() => kiemRef(c, p), /TRANSFORM NEN VAN HANG/);
  });
});
