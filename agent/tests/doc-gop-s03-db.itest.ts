// doc-gop-s03-db.itest.ts — PL30 `chon-model-theo-o`: lệnh chay/cham trên DB (BEGIN…ROLLBACK), Gateway giả.
// Chạy qua `db/db-thu.sh oneinvest_suite_dgs --chay` (executor dgs_db) — DB của riêng lượt, không đụng DB chung.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import pg from "pg";
import { chayLuot } from "../src/enrich/doc-gop-s03/chay.js";
import type { TaoModel } from "../src/enrich/doc-gop-s03/doc.js";
import { FIELDS, type Field } from "../src/enrich/doc-gop-s03/o.js";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const HAI = "anthropic/claude-haiku-5.5";

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

function json17(de: Partial<Record<Field, unknown>> = {}): string {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS) o[f] = { v: null, cc: null, trich: "" };
  for (const [f, v] of Object.entries(de)) o[f] = v;
  return JSON.stringify(o);
}
type Ghi = { gateway: string; prompt: string };
/** Gateway giả theo post: `tra(prompt)` chọn câu trả lời (hay lỗi) từ chữ bài trong prompt. */
function gatewayGia(tra: (prompt: string) => string | Error, ghi: Ghi[]): TaoModel {
  return (gateway) => new MockLanguageModelV4({
    modelId: gateway,
    doGenerate: async (o: { prompt: unknown }) => {
      const prompt = JSON.stringify(o.prompt);
      ghi.push({ gateway, prompt });
      const t = tra(prompt);
      if (t instanceof Error) throw t;
      return {
        content: [{ type: "text", text: t }], finishReason: { unified: "stop", raw: "stop" },
        usage: { inputTokens: { total: 5000, noCache: 5000, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 900, text: 900, reasoning: undefined } },
        warnings: [], providerMetadata: { gateway: { cost: "0.002" } },
      };
    },
  } as never) as never;
}

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000000000300010d0a2db40000000049454e44ae426082", "hex");
const SNAP = "hanoi__zalo-agent__2026-11-07T000000000";

/** Lát tạm + bài + thẻ nhóm + nhãn vàng + nguồn giả. Trả tên lát và post id. */
async function dungLat(c: pg.Client, bai: { text: string; anh?: number }[]) {
  const pid = process.pid;
  const lat = `dgs-thu-${pid}`;
  const goc = mkdtempSync(join(tmpdir(), "dgs-snap-"));
  mkdirSync(join(goc, "hanoi", SNAP, "media"), { recursive: true });
  process.env.SNAPSHOTS_DIR = goc;
  const conv = `conv-dgs-${pid}`;
  const { rows: [cu] } = await c.query(
    `INSERT INTO collection_units (source_code, group_key, name, unit_type, note) VALUES ('S03', $1, 'Nhóm thử DGS', 'nhom', '[OCP] thẻ nhóm thử')
     RETURNING unit_code`, [conv]);
  await c.query(`INSERT INTO source_registry (code, real_name, label_vi, source_ids) VALUES ('S09', 'TEN_THAT_Z', 'thử', ARRAY['MIEN_THAT_W', 'SID_V'])
     ON CONFLICT (code) DO UPDATE SET real_name = EXCLUDED.real_name, source_ids = EXCLUDED.source_ids`);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}'::jsonb) ON CONFLICT DO NOTHING`, [SNAP]);
  const ids: string[] = [];
  for (const [i, b] of bai.entries()) {
    const post = `dgs-${pid}-${i}`;
    ids.push(post);
    const files = Array.from({ length: b.anh ?? 0 }, (_, k) => {
      const ten = `media/dgs${pid}${i}${k}.png`;
      const byte = Buffer.concat([PNG, Buffer.from([i, k])]);
      writeFileSync(join(goc, "hanoi", SNAP, ten), byte);
      return { file: ten, url: `https://cdn.example/${i}/${k}.png`, sha256: createHash("sha256").update(byte).digest("hex"), snapshotId: SNAP };
    });
    const media = [...files.map((f) => ({ url: f.url })), ...(b.anh ? [{ url: `https://cdn.example/${i}/chi-url.jpg` }] : [])];
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, text, captured_at, sender_name, sender_id, conversation_id, media, agent_id, media_files)
       VALUES ($1, $2, 'Nhóm thử DGS', now(), $3, now(), 'NGUOI_DANG_X', 'SENDER_ID_T', $4, $5, 'TK_THU_U', $6)`,
      [post, SNAP, b.text, conv, JSON.stringify(media), JSON.stringify(files)]);
    const { rows: [it] } = await c.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, seed, stratum) VALUES ($1, 'S03', $2, $3, 'test', 'dgs', $4) RETURNING item_id`,
      [lat, post, `h-${post}`, cu.unit_code]);
    await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1, 'dgs', 'listing_intent', 'VANG_Y', 'chu_bai')`, [it.item_id]);
  }
  return { lat, ids };
}

const dem = async (c: pg.Client, bang: string) => Number((await c.query(`SELECT count(*) n FROM ${bang}`)).rows[0].n);

test("DGS-AC-4 tin nhắn có chữ nguyên văn, ảnh tệp, nhóm; không người đăng, tài khoản thu, nhãn vàng, tên nguồn", async () => {
  await withTx(async (c) => {
    const { lat } = await dungLat(c, [{ text: "Bán căn TEN_THAT_Z 2PN giá 3,4 tỷ", anh: 2 }]);
    const ghi: Ghi[] = [];
    let anhThieu = -1;
    await chayLuot({ client: c, co: { lat, tranUsd: 1, thu: true }, taoModel: gatewayGia(() => json17(), ghi), recordCall: async () => {}, log: () => {} });
    const { docTheTheoLat } = await import("../src/enrich/doc-gop-s03/the.js");
    anhThieu = (await docTheTheoLat(c, lat))[0].anh_thieu;
    assert.equal(ghi.length, 1);
    const p = ghi[0].prompt;
    assert.match(p, /Bán căn TEN_THAT_Z 2PN giá 3,4 tỷ/);
    assert.match(p, /Nhóm thử DGS/);
    assert.match(p, /\[OCP\] thẻ nhóm thử/);
    assert.equal((p.match(/"type":"file"/g) ?? []).length, 2, "đúng hai phần ảnh");
    for (const cam of ["NGUOI_DANG_X", "SENDER_ID_T"]) assert.ok(!p.includes(cam), `LO NGUOI DANG ${cam}`);
    assert.ok(!p.includes("TK_THU_U"), "LO TAI KHOAN THU");
    assert.ok(!p.includes("VANG_Y"), "lộ nhãn vàng");
    for (const cam of ["MIEN_THAT_W", "SID_V"]) assert.ok(!p.includes(cam), `LO SOURCE_REGISTRY ${cam}`);
    assert.ok(!p.includes(SNAP) && !p.includes("media/dgs"), "lộ đường tệp ảnh");
    assert.equal(anhThieu, 1);
  });
});

test("DGS-AC-5 chay ghi đúng một nhãn bạc + một ai_calls; bảng khác không đổi", async () => {
  await withTx(async (c) => {
    const { lat, ids } = await dungLat(c, [{ text: "Cho thuê căn 2PN PR2 giá 14tr" }]);
    const truoc = { so: await dem(c, "sale_offers"), ep: await dem(c, "enrichment_proposals"), rq: await dem(c, "review_queue"), el: await dem(c, "eval_labels"), ai: await dem(c, "ai_calls") };
    await chayLuot({ client: c, co: { lat, tranUsd: 1, runId: "dgs-run" }, log: () => {},
      taoModel: gatewayGia(() => json17({ listing_intent: { v: "offer", cc: "chu_bai", trich: "Cho thuê" }, kind: { v: "rent_lt", cc: "chu_bai", trich: "Cho thuê" } }), []) });
    const { rows } = await c.query(`SELECT model, prompt_version, listing_intent, kind, probabilities p, json_ok FROM silver_labels WHERE post_id = $1`, [ids[0]]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].model, `gateway:${HAI}`);
    assert.equal(rows[0].prompt_version, "dg3-s03-v3");
    assert.equal(rows[0].listing_intent, "offer");
    assert.equal(rows[0].kind, "rent_lt");
    assert.deepEqual(Object.keys(rows[0].p.o).sort(), [...FIELDS].sort());
    for (const f of FIELDS) assert.ok("v" in rows[0].p.o[f] && "cc" in rows[0].p.o[f] && "trich" in rows[0].p.o[f]);
    assert.match(rows[0].p.cau_hinh_sha, /^[0-9a-f]{64}$/);
    assert.ok(Array.isArray(rows[0].p.o_duoc_giao) && rows[0].p.o_duoc_giao.length === 16);
    assert.equal(await dem(c, "ai_calls"), truoc.ai + 1);
    const { rows: [ac] } = await c.query(`SELECT viec FROM ai_calls ORDER BY id DESC LIMIT 1`);
    assert.equal(ac.viec, "doc-gop-s03");
    assert.deepEqual({ so: await dem(c, "sale_offers"), ep: await dem(c, "enrichment_proposals"), rq: await dem(c, "review_queue"), el: await dem(c, "eval_labels") },
      { so: truoc.so, ep: truoc.ep, rq: truoc.rq, el: truoc.el });
  });
});

test("DGS-AC-7 JSON hỏng ghi lại kèm tiền, lỗi mạng không ghi; lượt hai chỉ gọi lại hai bài đó", async () => {
  await withTx(async (c) => {
    const { lat, ids } = await dungLat(c, [{ text: "bai A hong" }, { text: "bai B mang" }, { text: "bai C tot" }]);
    const tra1 = (p: string) => (p.includes("bai A") ? "khong phai json" : p.includes("bai B") ? new TypeError("mang") : json17());
    const ai0 = await dem(c, "ai_calls");
    await chayLuot({ client: c, co: { lat, tranUsd: 1 }, taoModel: gatewayGia(tra1, []), log: () => {} });
    const nhan = async () => (await c.query(`SELECT post_id, json_ok, error_kind, cost_usd::float8 cost FROM silver_labels WHERE post_id = ANY ($1) ORDER BY post_id`, [ids])).rows;
    let r = await nhan();
    assert.deepEqual(r.map((x) => [x.post_id, x.json_ok, x.error_kind]), [[ids[0], false, "json-hong"], [ids[2], true, null]]);
    assert.ok(r[0].cost > 0);
    const { rows: loi } = await c.query(`SELECT ok, loi FROM ai_calls ORDER BY id DESC LIMIT 3`);
    assert.equal(await dem(c, "ai_calls"), ai0 + 3);
    assert.ok(loi.some((x) => !x.ok && x.loi === "TypeError"));
    const ghi2: Ghi[] = [];
    await chayLuot({ client: c, co: { lat, tranUsd: 1 }, taoModel: gatewayGia(() => json17(), ghi2), log: () => {} });
    assert.equal(ghi2.length, 2, "chỉ gọi lại bài JSON hỏng và bài lỗi mạng");
    r = await nhan();
    assert.deepEqual(r.map((x) => x.json_ok), [true, true, true]);
    assert.ok(r[0].cost > 0.002, "chi phí cộng dồn qua hai lượt");
  });
});

// ---------- lệnh cham (AC-9) ----------
import { chamLuot } from "../src/enrich/doc-gop-s03/cham-lenh.js";

test("DGS-AC-9 chấm trên lát vàng tạm khớp bảng tính tay, không ghi DB, tóm tắt chỉ có số", async () => {
  await withTx(async (c) => {
    const { lat, ids } = await dungLat(c, [{ text: "bai mot DGS" }, { text: "bai hai DGS" }, { text: "bai ba DGS" }]);
    // Vàng viết trước: ý định rao cả ba; giá 3,4 tỷ · 1 tỷ · 2 tỷ; diện tích 62 cả ba; WC 2 (ô người duyệt — không chấm).
    const vang: [number, Field, string][] = [];
    const items = (await c.query(`SELECT item_id::int, ref_id FROM eval_label_items WHERE lat = $1 ORDER BY item_id`, [lat])).rows;
    await c.query(`DELETE FROM eval_labels WHERE item_id = ANY ($1)`, [items.map((r) => r.item_id)]);
    const gia = ["3400000000", "1000000000", "2000000000"];
    items.forEach((r, i) => { vang.push([r.item_id, "listing_intent", "offer"], [r.item_id, "price_min_vnd", gia[i]], [r.item_id, "area_m2", "62"], [r.item_id, "bathrooms", "2"]); });
    for (const [id, f, v] of vang) await c.query(`INSERT INTO eval_labels (item_id, labeler_id, field, value, basis) VALUES ($1, 'dgs', $2, $3, 'chu_bai')`, [id, f, v]);
    // Máy trả: giá đúng ở bài một, hai; sai ở bài ba; diện tích «62.0» (chuỗi) cả ba.
    const tra = (p: string) => json17({
      listing_intent: { v: "offer", cc: "chu_bai", trich: "bai" },
      price_min_vnd: { v: p.includes("bai mot") ? 3400000000 : p.includes("bai hai") ? 1000000000 : 999, cc: "chu_bai", trich: "bai" },
      area_m2: { v: "62.0", cc: "chu_bai", trich: "bai" },
    });
    const truoc = [await dem(c, "silver_labels"), await dem(c, "ai_calls"), await dem(c, "eval_labels")];
    const { tomTat } = await chamLuot({ client: c, lat, tranUsd: 1, taoModel: gatewayGia(tra, []), log: () => {} });
    assert.deepEqual([tomTat.o.listing_intent?.dung, tomTat.o.listing_intent?.n], [3, 3]);
    assert.deepEqual([tomTat.o.price_min_vnd?.dung, tomTat.o.price_min_vnd?.n], [2, 3], "BANG CHAM LECH BANG TINH TAY");
    assert.deepEqual([tomTat.o.area_m2?.dung, tomTat.o.area_m2?.n], [3, 3], "BANG CHAM LECH BANG TINH TAY");
    assert.equal(tomTat.o.bathrooms, undefined, "ô người duyệt không chấm");
    assert.deepEqual([tomTat.dung, tomTat.mau_so], [8, 9]);
    assert.equal(tomTat.json_hong, 0);
    assert.ok(Math.abs(tomTat.usd_the - 0.002) < 1e-9);
    assert.deepEqual([await dem(c, "silver_labels"), await dem(c, "ai_calls"), await dem(c, "eval_labels")], truoc, "lệnh chấm không ghi DB");
    const s = JSON.stringify(tomTat);
    for (const cam of ["bai mot", "bai hai", "bai ba", "NGUOI_DANG_X", "Nhóm thử DGS", ...ids]) assert.ok(!s.includes(cam), `tóm tắt lộ ${cam}`);
  });
});

test("DGS-AC-9 lệnh chấm chỉ lấy thẻ đã gắn nhãn", async () => {
  await withTx(async (c) => {
    const { lat } = await dungLat(c, [{ text: "bai co nhan" }, { text: "bai chua nhan" }]);
    const items = (await c.query(`SELECT item_id::int FROM eval_label_items WHERE lat = $1 ORDER BY item_id`, [lat])).rows;
    await c.query(`DELETE FROM eval_labels WHERE item_id = $1`, [items[1].item_id]);
    const ghi: Ghi[] = [];
    const { tomTat } = await chamLuot({ client: c, lat, tranUsd: 1, taoModel: gatewayGia(() => json17(), ghi), log: () => {} });
    assert.equal(tomTat.so_the, 1, "CHAM GOI THE CHUA CO NHAN");
    assert.equal(ghi.length, 1, "CHAM GOI THE CHUA CO NHAN");
  });
});
