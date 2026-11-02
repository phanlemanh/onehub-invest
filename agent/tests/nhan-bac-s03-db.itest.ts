// nhan-bac-s03-db.itest.ts — hồ sơ _acceptance/nhan-bac-model-lon-s03 (KC1) phần cần DB máy thu: migration 065
// (`silver_labels`) và lệnh nhãn bạc chỉ ghi bảng ấy. Mọi ca trong BEGIN … ROLLBACK trên DB local, chỉ in số.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: node --import tsx --test tests/nhan-bac-s03-db.itest.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { FILL } from "../../pipeline/sync-cloud.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG_065 = join(import.meta.dirname, "../../db/migrations/065_silver_labels.sql");

// chup: REPEATABLE READ — lệnh đêm ghi properties song song, READ COMMITTED thấy dòng của phiên khác giữa hai lần băm.
export async function withTx<T>(fn: (c: pg.Client) => Promise<T>, chup = false): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query(chup ? "BEGIN ISOLATION LEVEL REPEATABLE READ" : "BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

export const napMig065 = async (c: pg.Client) => c.query(await readFile(MIG_065, "utf8"));

const COT = ["label_id", "source_code", "post_id", "text_hash", "model", "prompt_version", "listing_intent", "kind",
  "probability", "probabilities", "quote", "quote_ok", "json_ok", "error_kind", "latency_ms", "cost_usd", "run_id", "labeled_at"];

/** Bảng nhãn bạc không được trong danh sách đẩy cloud. */
function kiemKhongLenCloud(fill: unknown[]) {
  const ten = fill.map((x) => (typeof x === "string" ? x : (x as { table?: string; name?: string }).table ?? (x as { name?: string }).name));
  assert.ok(ten.includes("areas"), "NB-AC-1 đối chứng dương: không đọc được tên bảng từ FILL (areas vắng)");
  if (ten.includes("silver_labels")) assert.fail("NB-AC-1 nhãn bạc lên cloud: silver_labels nằm trong FILL của sync-cloud");
}

test("NB-AC-1 migration 065 áp hai lần: bảng silver_labels đủ cột, khoá duy nhất, CHECK theo sổ, không lên cloud", async () => {
  await withTx(async (c) => {
    await napMig065(c);
    await napMig065(c);
    const cot = (await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'silver_labels'`)).rows.map((r) => r.column_name);
    for (const x of COT) assert.ok(cot.includes(x), `NB-AC-1 thiếu cột ${x}`);
    const chen = (intent: string, kind: string | null, post = "nb_ac1_p1") => c.query(
      `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, run_id)
       VALUES ('S03', $1, 'h1', 'test:gia', 'v1', $2, $3, true, 'r1') ON CONFLICT DO NOTHING`, [post, intent, kind]);
    assert.equal((await chen("offer", "sale")).rowCount, 1, "NB-AC-1 đối chứng dương: dòng hợp lệ không chèn được");
    assert.equal((await chen("offer", "sale")).rowCount, 0, "NB-AC-1 khoá duy nhất không chặn dòng trùng");
    assert.equal((await chen("inquiry", null, "nb_ac1_p2")).rowCount, 1, "NB-AC-1 Yêu cầu kind rỗng không chèn được");
    await c.query("SAVEPOINT s");
    await assert.rejects(chen("wanted", null, "nb_ac1_p3"), (e: { code?: string }) => e.code === "23514", "NB-AC-1 giá trị ý định lạ lọt CHECK");
    await c.query("ROLLBACK TO SAVEPOINT s");
    const rel = (await c.query(`SELECT column_name, lookup_name FROM ref_field_lookup WHERE table_name = 'silver_labels' ORDER BY 1`)).rows;
    assert.deepEqual(rel, [{ column_name: "kind", lookup_name: "kind" }, { column_name: "listing_intent", lookup_name: "listing_intent" }]);
  });
  kiemKhongLenCloud(FILL);
});

test("chiều đỏ NB-AC-1: danh sách đẩy cloud có silver_labels → đỏ ghim «NB-AC-1 nhãn bạc lên cloud»", () => {
  assert.throws(() => kiemKhongLenCloud([...FILL, "silver_labels"]), /NB-AC-1 nhãn bạc lên cloud/);
});

// ---------- NB-AC-2, NB-AC-3: lệnh chỉ ghi silver_labels, chạy lại an toàn ----------
import { chayLo, SQL_GHI, thamSoGhi, TEN_MODEL, type Nhan } from "../src/agents/nhan-bac-s03.js";
import { chonBai, type Co } from "../scripts/nhan-bac-run.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { textHash } from "../../pipeline/lib/eval-labels.mjs";

const SNAP = "hanoi__zalo-agent__2099-04-04T000000";
const hoiGia = async (): Promise<Nhan> => ({ model: TEN_MODEL.qwen, listing_intent: "offer", kind: "sale", probability: 0.9, probabilities: null,
  quote: null, quote_ok: null, json_ok: true, error_kind: null, latency_ms: 1, cost_usd: null });
const ghiVao = (c: pg.Client) => async (d: Parameters<typeof thamSoGhi>[0]) => (await c.query(SQL_GHI, thamSoGhi(d))).rowCount ?? 0;
const CO: Co = { model: "qwen", limit: 1_000_000, since: null, thu: false, tranUsd: 5, gold: null };

async function moiBai(c: pg.Client): Promise<{ post_id: string; text: string }[]> {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  const bai = Array.from({ length: 5 }, (_, i) => ({ post_id: `t_nb_ac2_${process.pid}_${i}`, text: `Căn mồi NB ${i} 2PN ${61 + i}m2 giá ${3 + i} tỷ` }));
  for (const b of bai) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi NB', 'nb-ac2', $3, '2026-10-31T08:00:00Z')`, [b.post_id, SNAP, b.text]);
  }
  return bai;
}
const laBai = (b: { post_id: string; text: string }) => ({ ...b, text_hash: textHash(b.text) });

test("NB-AC-2 lượt một ghi 5 dòng; lượt hai thêm 0; bài đổi chữ thêm đúng 1; --thu ghi 0; chọn bài bỏ bài đã có nhãn", async () => {
  await withTx(async (c) => {
    await napMig065(c);
    const bai = (await moiBai(c)).map(laBai);
    const dem = async () => (await c.query(`SELECT count(*)::int AS n FROM silver_labels WHERE post_id LIKE 't_nb_ac2_%'`)).rows[0].n;
    const mot = await chayLo({ backend: "qwen", bai, runId: "nb-ac2-1", tranUsd: 5, hoi: hoiGia, ghi: ghiVao(c) });
    assert.equal(mot.daGhi, 5, "NB-AC-2 lượt một không ghi đủ 5");
    const hai = await chayLo({ backend: "qwen", bai, runId: "nb-ac2-2", tranUsd: 5, hoi: hoiGia, ghi: ghiVao(c) });
    assert.equal(hai.daGhi, 0, "NB-AC-2 chạy lại nhân dòng");
    const conLai = new Set((await chonBai(c, CO, null)).map((b) => b.post_id));
    assert.ok(bai.every((b) => !conLai.has(b.post_id)), "NB-AC-2 chọn lại bài đã có nhãn cùng chữ");
    await c.query(`UPDATE stg_zalo_posts SET text = text || ' đã sửa giá' WHERE post_id = $1`, [bai[0].post_id]);
    const doi = (await chonBai(c, CO, null)).filter((b) => b.post_id.startsWith("t_nb_ac2_"));
    assert.deepEqual(doi.map((b) => b.post_id), [bai[0].post_id], "NB-AC-2 bài đổi chữ không được chọn lại");
    const ba = await chayLo({ backend: "qwen", bai: doi, runId: "nb-ac2-3", tranUsd: 5, hoi: hoiGia, ghi: ghiVao(c) });
    assert.equal(ba.daGhi, 1);
    const thu = await chayLo({ backend: "qwen", bai: bai.slice(1).map((b) => ({ ...b, text_hash: "khac" })), runId: "nb-ac2-4", tranUsd: 5, hoi: hoiGia, ghi: null });
    assert.equal(thu.daGhi, 0, "NB-AC-2 --thu ghi dòng");
    assert.equal(await dem(), 6);
  });
});

test("chiều đỏ NB-AC-2: bản đột biến bỏ ON CONFLICT → lượt hai đỏ ghim «NB-AC-2 chạy lại nhân dòng»", async () => {
  await withTx(async (c) => {
    await napMig065(c);
    const bai = (await moiBai(c)).map(laBai);
    await chayLo({ backend: "qwen", bai, runId: "d1", tranUsd: 5, hoi: hoiGia, ghi: ghiVao(c) });
    const sqlDotBien = SQL_GHI.replace(/ON CONFLICT[\s\S]*$/, "");
    await c.query("SAVEPOINT s");
    await assert.rejects(
      chayLo({ backend: "qwen", bai, runId: "d2", tranUsd: 5, hoi: hoiGia, ghi: async (d) => (await c.query(sqlDotBien, thamSoGhi(d))).rowCount ?? 0 })
        .catch((e) => { throw new Error(`NB-AC-2 chạy lại nhân dòng: ${e.code}`); }),
      /NB-AC-2 chạy lại nhân dòng/);
    await c.query("ROLLBACK TO SAVEPOINT s");
  });
});

const BANG_GIU = ["sale_offer_records", "sale_offers", "properties", "listing_records", "stg_zalo_posts", "field_assertions"];
async function chup(c: pg.Client) {
  const out: Record<string, string> = {};
  for (const t of BANG_GIU) out[t] = (await c.query(`SELECT count(*)::text || ':' || coalesce(md5(string_agg(x::text, '|' ORDER BY x::text)), '') AS h FROM ${t} x`)).rows[0].h;
  return out;
}
function kiemGiu(truoc: Record<string, string>, sau: Record<string, string>) {
  const lech = BANG_GIU.filter((t) => truoc[t] !== sau[t]);
  if (lech.length) assert.fail(`NB-AC-3 ghi ngoài bảng nhãn bạc: ${lech.join(", ")}`);
}
test("NB-AC-3 lô 50 bài thật: sáu bảng tin/căn/bài không đổi (đếm + băm), silver_labels thêm 50", async () => {
  await withTx(async (c) => {
    await napMig065(c);
    const bai = await chonBai(c, { ...CO, limit: 50 }, null);
    assert.equal(bai.length, 50, "NB-AC-3 lô thật không đủ 50 bài");
    const truoc = await chup(c);
    const kq = await chayLo({ backend: "qwen", bai, runId: "nb-ac3", tranUsd: 5, hoi: hoiGia, ghi: ghiVao(c) });
    kiemGiu(truoc, await chup(c));
    assert.equal(kq.daGhi, 50);
    console.log(`NB-AC-3 sáu bảng giữ nguyên · silver_labels +${kq.daGhi}`);
  }, true);
});
test("chiều đỏ NB-AC-3: bản đột biến ghi thêm một dòng stg → bộ so đỏ ghim «NB-AC-3 ghi ngoài bảng nhãn bạc»", async () => {
  await withTx(async (c) => {
    await napMig065(c);
    const truoc = await chup(c);
    await moiBai(c);
    assert.throws(() => kiemGiu(truoc, {}), /NB-AC-3 ghi ngoài bảng nhãn bạc/);
    kiemGiu(truoc, truoc);
    const sau = await chup(c);
    assert.throws(() => kiemGiu(truoc, sau), /NB-AC-3 ghi ngoài bảng nhãn bạc: stg_zalo_posts/);
  }, true);
});
