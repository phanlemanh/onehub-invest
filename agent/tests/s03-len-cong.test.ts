// s03-len-cong.test.ts — hồ sơ _acceptance/s03-len-cong (SL1): enrich (AC-11) và chấm ghép (AC-12) với loại hình suy từ nhóm.
// Chỉ chạy trên DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …), trong BEGIN…ROLLBACK: DB thử mang đủ hàm thật, 069 nạp trong giao dịch.
// Glob tests/*.test.ts cũng gom tệp này: DATABASE_URL khác thì bỏ qua, không nạp hàm lên DB dùng chung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { apNguong } from "../src/agents/judge-entity.js";
import type { ContextResult } from "../src/agents/context-resolver.js";
import { chonTin, quyetTin } from "../src/enrich/doc-toan-bo.js";
import { runEnrich, type LlmFn } from "../src/enrich/run.js";
import { queryPair } from "../src/tools/native.js";
import { insertOffer, insertProposal } from "./helpers/db.js";

const DB_URL = process.env.DATABASE_URL ?? "";
const DB_THU = /\/oneinvest_[a-z0-9_]+$/.test(DB_URL);
const skip = DB_THU ? false : "cần DATABASE_URL trỏ DB thử";
const MIG_069 = readFileSync(join(import.meta.dirname, "../../db/migrations/069_loai_hinh_suy_luan.sql"), "utf8");
const SRC = join(import.meta.dirname, "../src");
const TAG = `t_sl1_${process.pid}`;
let seq = 0;

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query(MIG_069);
    await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test:agent', 'phat-bieu:cat-chuyen', '{}'::jsonb)`);
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t_sl1', 'test', 'S03', '{}') ON CONFLICT (snapshot_id) DO NOTHING`);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Chép tệp nguồn cạnh tệp thật với một chỗ đổi, nạp, xoá. */
async function banSao<T>(tep: string, cu: string, moi: string): Promise<T> {
  const goc = readFileSync(join(SRC, tep), "utf8");
  assert.ok(goc.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
  const f = join(SRC, tep.replace(/([^/]+)\.ts$/, `.sl1-$1-${process.pid}-${++seq}.ts`));
  writeFileSync(f, goc.replace(cu, moi));
  try {
    return (await import(f)) as T;
  } finally {
    rmSync(f, { force: true });
  }
}

/** Tin S03 đủ street_raw, bathrooms, kind bán, có bài nguồn. Loại hình: suy, quan sát, hay chưa có. */
async function tin(c: pg.Client, loai: { suy?: string; quanSat?: string } = {}, them: { bathrooms?: number | null } = {}) {
  const id = `${TAG}_${++seq}`;
  const post = `p_${id}`;
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't_sl1', $2, 'Nhóm thử')`,
    [post, "Bán căn 2PN 60m2 giá 3 tỷ, sổ hồng chính chủ, xem nhà ngay"]);
  await insertOffer(c, { offer_id: id, post_ids: [post], property_type: loai.quanSat ?? null, street_raw: "Đường Thử", bathrooms: them.bathrooms === undefined ? 2 : them.bathrooms });
  if (loai.suy) {
    await c.query(
      `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, observed_at)
       VALUES ($1, 'property_type', $2, 'inferred', 'e1_rule', 'transform-zalo@sl1', 'loai-hinh-nhom', now())`, [`S03:${post}`, loai.suy]);
    await c.query("SELECT resolve_offer_fields(ARRAY[$1])", [id]);
  }
  return { id, post };
}
const docTin = async (c: pg.Client, id: string) => (await c.query(
  "SELECT property_type, field_provenance -> 'property_type' AS fp FROM sale_offer_records WHERE offer_id = $1", [id])).rows[0];
const deXuat = async (c: pg.Client, id: string) => (await c.query(
  "SELECT id, source, route, value, status FROM enrichment_proposals WHERE offer_id = $1 AND field = 'property_type' ORDER BY id", [id])).rows;
const ctx = (propertyType: string | null): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType, buildingHint: null, areaHint: null, matchedBy: "",
} as ContextResult);
const llmLoai = (v: string): LlmFn => async () => ({ result: { property_type: v }, model: "qwen27b", tracePath: null } as Awaited<ReturnType<LlmFn>>);

type Chay = typeof runEnrich;
/** Luồng AC-11; mọi lệch mang «SL1-AC-11» để bản đột biến ghim được. */
async function luongEnrich(c: pg.Client, chay: Chay) {
  const a = await tin(c, { suy: "apartment" });
  const quanSat = await tin(c, { quanSat: "apartment" }, { bathrooms: null });
  await c.query(`CREATE TEMP VIEW sale_offers AS SELECT * FROM public.sale_offers WHERE offer_id LIKE '${TAG}%'`);
  try {
    assert.equal((await docTin(c, a.id)).fp.tier, "inferred", "SL1-AC-11 mẫu chưa ở lớp inferred");
    // E1 nói khác, LLM nói house. Không chỉ định tin: phải được bộ chọn bốc lên dù đủ street_raw, bathrooms.
    await chay({ client: c, runId: `sl1-${++seq}`, dry: false, limit: 50, llm: llmLoai("house"), resolve: async () => ctx("townhouse"), buildings: [] });
    const ds = await deXuat(c, a.id);
    assert.deepEqual(ds.map((d) => d.source), ["e2_llm"], "SL1-AC-11 tin suy phải được chọn, chỉ có đề xuất LLM, E1 không lên ô này");
    assert.notEqual(ds[0].route, "direct", "SL1-AC-11 đề xuất áp thẳng");
    assert.equal((await docTin(c, a.id)).property_type, "apartment", "SL1-AC-11 cột đổi trước khi áp");
    assert.equal((await deXuat(c, quanSat.id)).length, 0, "SL1-AC-11 tin observed mất luật giá trị cũ thắng");
    await c.query("SELECT apply_enrichment($1, 'test')", [[Number(ds[0].id)]]);
    const sau = await docTin(c, a.id);
    assert.equal(sau.property_type, "house", "SL1-AC-11 áp xong observed phải thắng");
    assert.equal(sau.fp.tier, "observed", "SL1-AC-11 provenance không đổi lớp");

    // E1 trùng giá trị suy, LLM im: không có đề xuất E1 trực tiếp.
    const b = await tin(c, { suy: "apartment" });
    await chay({ client: c, runId: `sl1-${++seq}`, dry: false, limit: 50, offerIds: [b.id], llm: async () => ({ result: null, model: "qwen27b", tracePath: null }), resolve: async () => ctx("apartment"), buildings: [] });
    assert.equal((await deXuat(c, b.id)).length, 0, "SL1-AC-11 E1 áp thẳng lên ô suy");
  } finally {
    await c.query("DROP VIEW pg_temp.sale_offers");
  }
}

test("SL1-AC-11 enrich chọn tin suy, LLM đề xuất, E1 không áp thẳng, observed giữ", { skip, timeout: 120_000 }, async () => {
  await withTx((c) => luongEnrich(c, runEnrich));
});

test("SL1-AC-11 đọc toàn bộ chữ: ô suy coi là trống, LLM đề xuất được, E1 không áp, observed giữ", { skip, timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    const suy = await tin(c, { suy: "apartment" });
    const quanSat = await tin(c, { quanSat: "apartment" });
    const ds = await chonTin(c);
    const quyet = (id: string, e1Loai: string | null, llm: string | null) => {
      const t = ds.find((x) => x.offer_id === id);
      assert.ok(t, "SL1-AC-11 bộ chọn đọc toàn bộ bỏ sót tin");
      return quyetTin({
        hienTai: t, e1Loai, intent: "offer", quoteOk: true, quoteYDinh: "Bán nhà", chuDaGat: "Bán nhà riêng 60m2", chungBai: false, held: new Set(),
        them: llm ? { property_type: llm, quote_loai: "Bán nhà riêng", price_vnd: null, quote_gia: null, area_m2: null, quote_dt: null, bedrooms: null, bathrooms: null, street: null, block: null } : null,
      }).de_xuat;
    };
    const coLlm = quyet(suy.id, "land", "house");
    assert.deepEqual(coLlm.map((d) => d.source), ["e2_llm"], "SL1-AC-11 ô suy phải nhận đề xuất LLM, E1 không lên ô này");
    assert.equal(coLlm[0].value, "house", "SL1-AC-11 giá trị đề xuất");
    assert.equal(quyet(suy.id, "apartment", null).length, 0, "SL1-AC-11 E1 áp thẳng lên ô suy");
    assert.equal(quyet(quanSat.id, null, "house").length, 0, "SL1-AC-11 tin observed mất luật giá trị cũ thắng");
  });
});

test("SL1-AC-11 hoàn tác ba ca: cột về giá trị suy, phát biểu suy còn sống", { skip, timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    for (const [ten, source, value] of [["LLM cùng giá trị", "e2_llm", "apartment"], ["LLM khác giá trị", "e2_llm", "house"], ["E1 trùng giá trị", "e1_rule", "apartment"]] as const) {
      const a = await tin(c, { suy: "apartment" });
      const id = await insertProposal(c, { offer_id: a.id, field: "property_type", value, source, route: "direct", review_id: null });
      const { rows: [{ n }] } = await c.query("SELECT apply_enrichment($1, 'test') AS n", [[id]]);
      assert.equal(n, 1, `SL1-AC-11 ${ten}: không áp được`);
      assert.equal((await docTin(c, a.id)).fp.tier, "observed", `SL1-AC-11 ${ten}: chưa lên observed`);
      const { rows: [{ r }] } = await c.query("SELECT revert_enrichment($1, 'hitl:test', 'thử') AS r", [[id]]);
      assert.equal(r, 1, `SL1-AC-11 ${ten}: không hoàn tác được`);
      const sau = await docTin(c, a.id);
      assert.equal(sau.property_type, "apartment", `SL1-AC-11 ${ten}: cột không về giá trị suy`);
      assert.equal(sau.fp.tier, "inferred", `SL1-AC-11 ${ten}: lớp không về inferred`);
      const { rows: suy } = await c.query(
        "SELECT 1 FROM field_assertions WHERE subject_key = $1 AND rule_id = 'loai-hinh-nhom' AND retracted_at IS NULL", [`S03:${a.post}`]);
      assert.equal(suy.length, 1, `SL1-AC-11 ${ten}: phát biểu suy bị rút`);
    }
  });
});

test("SL1-AC-11 đỏ trên bản route.ts và bản run.ts bỏ nhận biết inferred", { skip, timeout: 120_000 }, async () => {
  // Bản run.ts mượn bản route.ts đột biến để đo đúng đường đi của cả lượt.
  const f = join(SRC, `enrich/.sl1-route-do-${process.pid}.ts`);
  const route = readFileSync(join(SRC, "enrich/route.ts"), "utf8");
  const moc = "const suy = input.inferredFields?.has(field) ?? false;";
  assert.ok(route.includes(moc), "đột biến không khớp route.ts");
  writeFileSync(f, route.replace(moc, "const suy = false;"));
  try {
    const banRoute = await banSao<{ runEnrich: Chay }>("enrich/run.ts", 'from "./route.js"', `from "./.sl1-route-do-${process.pid}.js"`);
    await withTx((c) => assert.rejects(luongEnrich(c, banRoute.runEnrich), /SL1-AC-11/, "SL1-AC-11: thước không đỏ trên bản route.ts"));
  } finally {
    rmSync(f, { force: true });
  }
  const banRun = await banSao<{ runEnrich: Chay }>("enrich/run.ts",
    'inferredFields: o.loai_suy ? new Set<EnrichField>(["property_type"]) : undefined,', "");
  await withTx((c) => assert.rejects(luongEnrich(c, banRun.runEnrich), /SL1-AC-11/, "SL1-AC-11: thước không đỏ trên bản run.ts"));
});

// ---- Chấm ghép (AC-12) ----
async function capTin(c: pg.Client, s03: { suy?: string; quanSat?: string }) {
  const a = await tin(c, s03);
  const b = `${TAG}_${++seq}`;
  await insertOffer(c, { offer_id: b, source: "S06", post_ids: [], property_type: "apartment" });
  await c.query(
    "UPDATE sale_offer_records SET price_vnd = 3e9, area_m2 = 60, price_perm2 = 5e7, phuong_raw = 'phuc-loc', kind = 'sale' WHERE offer_id = ANY ($1)", [[a.id, b]]);
  return { a: a.id, b };
}
type HamCap = typeof queryPair;
async function luongCham(c: pg.Client, doc: HamCap) {
  const cham = async (s03: { suy?: string; quanSat?: string }) => {
    const { a, b } = await capTin(c, s03);
    const p = await doc(a, b, c);
    assert.ok(p, "SL1-AC-12 không đọc được cặp");
    return apNguong(p);
  };
  const khac = await cham({ suy: "house" });
  assert.equal(khac.same_house, "unsure", "SL1-AC-12 khác loại suy không được ra no");
  assert.ok(khac.ly_do.some((l) => l.ma === "thieu_loai"), "SL1-AC-12 khác loại suy thiếu thieu_loai");
  const cung = await cham({ suy: "apartment" });
  assert.equal(cung.same_house, "unsure", "SL1-AC-12 cùng loại suy không được ra yes");
  assert.ok(cung.ly_do.some((l) => l.ma === "thieu_loai"), "SL1-AC-12 cùng loại suy thiếu thieu_loai");
  assert.equal((await cham({ quanSat: "house" })).same_house, "no", "SL1-AC-12 observed khác loại phải giữ no");
  assert.equal((await cham({ quanSat: "apartment" })).same_house, "yes", "SL1-AC-12 observed cùng loại phải giữ yes");
}

test("SL1-AC-12 loại hình suy không tự ra kết luận ghép căn", { skip, timeout: 120_000 }, async () => {
  await withTx((c) => luongCham(c, queryPair));
});

test("SL1-AC-12 đỏ trên bản đọc cột thô", { skip, timeout: 120_000 }, async () => {
  const ban = await banSao<{ queryPair: HamCap }>("tools/native.ts",
    "CASE WHEN o.field_provenance #>> '{property_type,tier}' = 'inferred' THEN 'unknown' ELSE o.property_type END AS property_type", "o.property_type");
  await withTx((c) => assert.rejects(luongCham(c, ban.queryPair), /SL1-AC-12/, "SL1-AC-12: thước không đỏ trên bản đọc cột thô"));
});
