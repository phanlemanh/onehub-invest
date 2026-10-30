// bait-gap-sellers.test.mjs — vòng canonical-khong-tin-gia (PL2) AC-7: registry sellers bỏ người bán
// không còn tin nào. BEGIN…ROLLBACK trên Postgres local :5433 — không để lại dòng nào.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

import { sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { refreshBaitGap } from "../refresh-bait-gap.mjs";
import { localReadSql, selectList } from "../sync-cloud.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // Cùng khoá với write-offers.test.mjs / agent tests: bộ đó nạp lại hàm 039 trong giao dịch —
    // chạy song song với một lượt đối soát là deadlock.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const H_ORPHAN = "t_pl2_orphan_hash_000000000000000";
const H_LIVE = "t_pl2_live_hash_00000000000000000";

async function seller(c, hash, nAds) {
  await c.query(
    `INSERT INTO sellers (phone_hash, sources, n_ads, first_seen, last_seen)
     VALUES ($1, '{S03}', $2, now(), now())`,
    [hash, nAds],
  );
}

async function offer(c, id, hash) {
  await c.query(
    `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids,
       price_tier, seller_phone_hash, property_type)
     VALUES ($1, 'TST', 'sale', 'medium', now(), now(), '{}', 'P1', $2, 'unknown')`,
    [id, hash],
  );
}

const exists = async (c, hash) => (await c.query(`SELECT n_ads FROM sellers WHERE phone_hash = $1`, [hash])).rows[0];

test("AC-7 sellers mồ côi", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seller(c, H_ORPHAN, 3);
    await seller(c, H_LIVE, 999);
    await offer(c, "t_pl2_live_offer", H_LIVE);
    const maxId = Number((await c.query(`SELECT coalesce(max(id), 0) AS m FROM ops_audit`)).rows[0].m);

    const res = await refreshBaitGap(c);

    assert.equal(await exists(c, H_ORPHAN), undefined, "AC-7 người bán mồ côi còn");
    const live = await exists(c, H_LIVE);
    assert.ok(live, "AC-7 xoá nhầm người bán còn tin");
    assert.equal(live.n_ads, 1, "AC-7 cột tổng hợp của người bán còn tin không làm mới");
    const audit = (await c.query(
      `SELECT detail FROM ops_audit WHERE id > $1 AND action = 'bait-gap:sellers-orphan'`, [maxId],
    )).rows;
    assert.equal(audit.length, 1, "AC-7 thiếu dòng audit bait-gap:sellers-orphan");
    assert.ok(audit[0].detail.deleted >= 1);
    const n = Number((await c.query(`SELECT count(*) AS n FROM sellers`)).rows[0].n);
    assert.equal(audit[0].detail.remaining, n, "AC-7 remaining lệch số dòng sellers");
    assert.equal(res.sellersRemaining, n);
  });
});

test("AC-7 cặp hai chiều: người bán có tin thì không bị xoá", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seller(c, H_ORPHAN, 3);
    await offer(c, "t_pl2_orphan_offer", H_ORPHAN);
    await refreshBaitGap(c);
    assert.ok(await exists(c, H_ORPHAN), "AC-7 xoá nhầm người bán còn tin");
  });
});

// ---- SD1 sellers-them-dong-lai: SĐT mới trên tin có dòng sellers (lệnh thêm dòng mất ở 907f4bd4) ----
// Chiều đỏ: bản đột biến của refresh-bait-gap.mjs chép CẠNH tệp thật (import ./lib/ vẫn đúng), mỗi bản một tên (ESM
// cache), xoá ngay sau khi nạp.

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const GOC = readFileSync(join(PIPE, "refresh-bait-gap.mjs"), "utf8");
let soBan = 0;

/** Nạp một bản đột biến của refresh-bait-gap.mjs; `doi` phải thật sự đổi mã (không đổi → ném, chiều đỏ không rỗng). */
async function banDotBien(doi) {
  const ma = doi(GOC);
  if (ma === GOC) throw new Error("đột biến không đổi mã — thước đỏ rỗng");
  const f = join(PIPE, `.tam-sellers-${process.pid}-${++soBan}.mjs`);
  writeFileSync(f, ma);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}
// Về đúng hành vi trước vòng: chỉ UPDATE dòng đã có.
const boThemDong = (s) =>
  s.replace(/INSERT INTO sellers AS x[\s\S]*?FROM s\n\s*ON CONFLICT \(phone_hash\) DO UPDATE\n\s*SET/, "UPDATE sellers x SET")
    .replace(/flags = EXCLUDED\.flags\n\s*RETURNING \(xmax = 0\) AS moi/, "flags = EXCLUDED.flags FROM s WHERE x.phone_hash = s.h RETURNING false AS moi")
    .replace(/EXCLUDED\.n_ads/, "s.n_ads").replace(/EXCLUDED\.sources/, "s.srcs").replace(/EXCLUDED\.first_seen/, "s.fs")
    .replace(/EXCLUDED\.last_seen/, "s.ls").replace(/COALESCE\(x\.name, EXCLUDED\.name\)/, "COALESCE(x.name, s.best_name)")
    .replace(/flags = EXCLUDED\.flags FROM s/, "flags = jsonb_build_object('n_ads', s.n_ads) FROM s");
const congDon = (s) => s.replace("SET n_ads = EXCLUDED.n_ads,", "SET n_ads = x.n_ads + EXCLUDED.n_ads,");
const ghiDeTen = (s) => s.replace("name = COALESCE(x.name, EXCLUDED.name),", "name = EXCLUDED.name,");

const HA = `t_sd1_a_${process.pid}`;
const HB = `t_sd1_b_${process.pid}`;
const HC = `t_sd1_c_${process.pid}`;

async function tin(c, id, hash, source, at, ten = null) {
  await c.query(
    `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids,
       price_tier, seller_phone_hash, seller_name, property_type)
     VALUES ($1, $2, 'sale', 'medium', $3, $3, '{}', 'P1', $4, $5, 'unknown')`,
    [`t_sd1_${process.pid}_${id}`, source, at, hash, ten],
  );
}
/** Lát viết trước: A có dòng cũ (n_ads 999, tên cũ), B một tin S03, C hai tin S03 + S05. */
async function latSd1(c) {
  await c.query(
    `INSERT INTO sellers (phone_hash, name, sources, n_ads, first_seen, last_seen) VALUES ($1, 'Tên cũ A', '{S05}', 999, now(), now())`,
    [HA],
  );
  await tin(c, "a1", HA, "S03", "2026-10-01T00:00:00Z", "Tên tin A");
  await tin(c, "b1", HB, "S03", "2026-10-02T00:00:00Z", "Tên tin B");
  await tin(c, "c1", HC, "S03", "2026-10-03T00:00:00Z");
  await tin(c, "c2", HC, "S05", "2026-10-05T00:00:00Z");
}
const dongCua = async (c, h) =>
  (await c.query(
    `SELECT phone_hash, name, sources, n_ads, first_seen::text fs, last_seen::text ls, flags FROM sellers WHERE phone_hash = $1`,
    [h],
  )).rows;
const chup = async (c) => [await dongCua(c, HA), await dongCua(c, HB), await dongCua(c, HC)];

async function kiemAc1(c, mod) {
  await latSd1(c);
  await mod.refreshBaitGap(c);
  for (const h of [HA, HB, HC]) assert.equal((await dongCua(c, h)).length, 1, `SD-AC-1 SĐT trên tin thiếu dòng sellers: ${h}`);
  const [b] = await dongCua(c, HB);
  assert.deepEqual([b.n_ads, b.sources], [1, ["S03"]], "SD-AC-1 cột tổng hợp của B");
  const [cc] = await dongCua(c, HC);
  assert.deepEqual([cc.n_ads, [...cc.sources].sort(), cc.flags.multi_channel], [2, ["S03", "S05"], true], "SD-AC-1 cột tổng hợp của C");
  const mm = (await c.query(`SELECT min(first_seen)::text a, max(last_seen)::text b FROM sale_offers WHERE seller_phone_hash = $1`, [HC])).rows[0];
  assert.deepEqual([cc.fs, cc.ls], [mm.a, mm.b], "SD-AC-1 first/last_seen của C lệch tin");
  const [a] = await dongCua(c, HA);
  assert.equal(a.n_ads, 1, "SD-AC-1 dòng cũ của A không làm mới");
}

test("SD-AC-1 mọi SĐT trên tin có dòng sellers", { timeout: 120_000 }, async () => {
  const that = await import("../refresh-bait-gap.mjs");
  await withTx((c) => kiemAc1(c, that));
  const sai = await banDotBien(boThemDong);
  await withTx((c) => assert.rejects(kiemAc1(c, sai), /SD-AC-1 SĐT trên tin thiếu dòng sellers/));
});

async function kiemAc2(c, mod) {
  await latSd1(c);
  await mod.refreshBaitGap(c);
  const l1 = await chup(c);
  const r2 = await mod.refreshBaitGap(c);
  assert.deepEqual(await chup(c), l1, "SD-AC-2 lượt hai đổi cột tổng hợp");
  assert.equal(r2.sellersInserted, 0, "SD-AC-2 lượt hai thêm dòng");
}

test("SD-AC-2 lượt hai không đổi", { timeout: 120_000 }, async () => {
  await withTx((c) => kiemAc2(c, { refreshBaitGap }));
  const sai = await banDotBien(congDon);
  await withTx((c) => assert.rejects(kiemAc2(c, sai), /SD-AC-2 lượt hai đổi cột tổng hợp/));
});

async function kiemAc3(c, mod) {
  await latSd1(c);
  await mod.refreshBaitGap(c);
  assert.equal((await dongCua(c, HA))[0].name, "Tên cũ A", "SD-AC-3 tên cũ bị ghi đè");
  assert.equal((await dongCua(c, HB))[0].name, "Tên tin B", "SD-AC-3 dòng mới không nhận tên từ tin");
}

test("SD-AC-3 tên: giữ tên cũ, dòng mới lấy tên từ tin", { timeout: 120_000 }, async () => {
  await withTx((c) => kiemAc3(c, { refreshBaitGap }));
  const sai = await banDotBien(ghiDeTen);
  await withTx((c) => assert.rejects(kiemAc3(c, sai), /SD-AC-3 tên cũ bị ghi đè/));
});

const CAU_THIEU_CU = `SELECT s.phone_hash || ':' || src AS k FROM sellers s CROSS JOIN LATERAL unnest(s.sources) AS src
  WHERE NOT EXISTS (SELECT 1 FROM registry_aliases a WHERE a.retired_at IS NULL AND a.kind = 'sdt_bam'
                      AND a.source = src AND a.value = s.phone_hash)
  ORDER BY 1`; // câu đối chiếu trước vòng (origin/main 4704315b), chỉ đọc sellers — chiều đỏ của SD-AC-7

test("SD-AC-7 đối chiếu danh bạ theo SĐT trên tin", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    const hz = `t_sd1_z_${process.pid}`;
    await tin(c, "z6", hz, "S06", "2026-10-06T00:00:00Z");
    assert.ok((await sellersThieuNguoi(c)).includes(`${hz}:S06`), "SD-AC-7 SĐT trên tin không vào phép đối chiếu");
    const cu = (await c.query(CAU_THIEU_CU)).rows.map((r) => r.k);
    assert.ok(!cu.includes(`${hz}:S06`), "SD-AC-7 chiều đỏ: câu cũ đọc sellers mà vẫn thấy hz");
    // Đối chứng dương: có người sống mang bí danh sdt_bam đúng nguồn → không còn thiếu.
    const pty = "pty_01HZZZZZZZZZZZZZZZZZZZZSD1"; // khoá ULID hợp lệ (khuôn danh-ba-nguoi.itest), chỉ sống trong ROLLBACK
    await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, 'S06')`, [pty]);
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt_bam', $2, 'S06')`, [pty, hz]);
    assert.ok(!(await sellersThieuNguoi(c)).includes(`${hz}:S06`), "SD-AC-7 có người mà vẫn báo thiếu");
  });
});

async function kiemAc8(c, mod) {
  await latSd1(c);
  await mod.refreshBaitGap(c);
  const cols = (await c.query(
    `SELECT column_name AS c FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sellers' ORDER BY ordinal_position`,
  )).rows.map((r) => r.c);
  const tai = (await c.query(localReadSql("sellers", selectList("sellers", cols).sql))).rows.map((r) => JSON.parse(r.j));
  for (const h of [HA, HB, HC]) {
    assert.equal(tai.filter((x) => x.phone_hash === h).length, 1, `SD-AC-8 payload cloud thiếu SĐT: ${h}`);
  }
  assert.ok(tai.every((x) => !("name" in x)), "SD-AC-8 payload cloud mang cột name");
}

test("SD-AC-8 payload cloud: đủ SĐT trên tin, không cột name", { timeout: 120_000 }, async () => {
  await withTx((c) => kiemAc8(c, { refreshBaitGap }));
  const sai = await banDotBien(boThemDong);
  await withTx((c) => assert.rejects(kiemAc8(c, sai), /SD-AC-8 payload cloud thiếu SĐT/));
});

// ---- Probe DB máy thu: dữ liệu thật, ROLLBACK ----
const LY_DO_CI = "cần DB máy thu có tin thật mang SĐT — CI chỉ có lược đồ";
const hieuTap = async (c) => (await c.query(
  `SELECT (SELECT count(*)::int FROM (SELECT seller_phone_hash FROM sale_offers WHERE seller_phone_hash IS NOT NULL
                                        EXCEPT SELECT phone_hash FROM sellers) t) thieu,
          (SELECT count(*)::int FROM (SELECT phone_hash FROM sellers
                                        EXCEPT SELECT seller_phone_hash FROM sale_offers) t) thua,
          (SELECT count(*)::int FROM sellers) n`,
)).rows[0];

test("SD-AC-5 probe DB máy thu: sellers bằng tập SĐT trên tin, lượt hai không đổi", { timeout: 180_000 }, async (t) => {
  if (process.env.CI) return t.skip(LY_DO_CI);
  await withTx(async (c) => {
    const truoc = await hieuTap(c);
    await refreshBaitGap(c);
    const l1 = await hieuTap(c);
    assert.deepEqual([l1.thieu, l1.thua], [0, 0], `SD-AC-5 sellers thiếu SĐT: ${JSON.stringify(l1)}`);
    if (truoc.thieu > 0) assert.ok(l1.n > truoc.n, `SD-AC-5 số dòng không tăng: ${truoc.n} → ${l1.n}`);
    const r2 = await refreshBaitGap(c);
    assert.equal((await hieuTap(c)).n, l1.n, "SD-AC-5 lượt hai đổi số dòng");
    assert.equal(r2.sellersInserted, 0, "SD-AC-5 lượt hai thêm dòng");
  });
  const sai = await banDotBien(boThemDong);
  await withTx(async (c) => {
    await tin(c, "p1", `t_sd1_p_${process.pid}`, "S03", "2026-10-07T00:00:00Z");
    await sai.refreshBaitGap(c);
    await assert.rejects(async () => {
      const l = await hieuTap(c);
      assert.deepEqual([l.thieu, l.thua], [0, 0], `SD-AC-5 sellers thiếu SĐT: ${JSON.stringify(l)}`);
    }, /SD-AC-5 sellers thiếu SĐT/);
  });
});
