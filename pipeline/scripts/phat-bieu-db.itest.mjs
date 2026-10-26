// phat-bieu-db.itest.mjs — PL15 bảng phát biểu + bộ phân xử (PD-AC-n ↔ _acceptance/phat-bieu-va-phan-xu/evals.yaml).
// Cần DB local :5433. Mọi ca trong BEGIN … ROLLBACK, giữ pg_advisory_xact_lock(33033) và nạp 045 trong giao dịch (áp lại =
// kiểm idempotent khi DB đã áp). Tin mồi dựng bằng writeOffers nguồn thử TST; phát biểu ghi bằng lib/assert.mjs.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { writeOffers } from "../lib/write-offers.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { resolveOffers, subjectKey, writeAssertions } from "../lib/assert.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const MIG = readFileSync(join(ROOT, "db/migrations/045_phat_bieu_va_phan_xu.sql"), "utf8");
const MA_TRAN = JSON.parse(readFileSync(join(HERE, "fixtures/phan-xu-ma-tran.json"), "utf8")).ca;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

/** Chạy `fn` trong BEGIN … ROLLBACK, giữ khoá 33033 (test nạp migration song song là deadlock), nạp 045. */
export async function trongGiaoDich(client, fn) {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    await napMigration045(client);
    return await fn();
  } finally {
    await client.query("ROLLBACK");
  }
}
/** Nạp 045 (DB chưa áp → áp lần đầu; đã áp → áp lại, phải không lỗi). */
export async function napMigration045(client) { await client.query(MIG); }
/** Mở cổng «chưa cắt chuyển» trong giao dịch đang chạy (ca không đo cổng). */
export async function moCong(client) {
  await client.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test:phat-bieu', 'phat-bieu:cat-chuyen', '{}'::jsonb)`);
}

const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
const NAM_COT = VOCAB.enrich_field;
const bamTin = async () => createHash("sha256").update(JSON.stringify((await c.query(
  `SELECT offer_id, ${NAM_COT.join(", ")} FROM sale_offer_records ORDER BY offer_id`)).rows)).digest("hex");

const TST = "TST";
const SEED_AT = new Date("2026-10-20T00:00:00Z");
/** Tin mồi nguồn TST: posts > 0 → post_ids = [osk, …]; posts = 0 → chỉ post neo (post_ids rỗng). */
export function tinMoi(prefix, posts) {
  const ids = Array.from({ length: Math.max(posts, 1) }, (_, i) => `${prefix}-p${i}`);
  const osk = ids[0];
  return {
    row: {
      offer_id: mintOfferId(TST, osk), originating_system_key: osk, kind: "sale", confidence: "high",
      first_seen: SEED_AT, last_seen: SEED_AT, n_reposts: Math.max(posts, 1), post_ids: posts > 0 ? ids : [],
      price_tier: "P1", area_m2: 50, price_perm2: 100_000_000,
    },
    posts: ids,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
test("PD-AC-1 045 áp hai lần: bảng, CHECK theo sổ, chỉ mục sống, cột nguồn gốc, thước giá, không ghi dữ liệu tin", async () => {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    const truoc = await bamTin();
    const nTruoc = (await one("SELECT count(*)::int AS n FROM sale_offer_records")).n;
    await napMigration045(c);
    await napMigration045(c);
    assert.ok((await one("SELECT to_regclass('field_assertions') AS t")).t, "thiếu bảng field_assertions");
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offer_records")).n, nTruoc, "045 đổi số dòng tin");
    assert.equal(await bamTin(), truoc, "045 ghi vào năm cột của tin");
    // cột nguồn gốc có trên view sống
    assert.equal((await one(`SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_name = 'sale_offers' AND column_name = 'field_provenance'`)).n, 1, "view sale_offers thiếu field_provenance");
    await c.query("SELECT count(*) FROM v_ruler_p2");
    await c.query("SELECT count(*) FROM v_ruler_p2_area");

    // Ma trận CHECK viết trước: nhận đúng giá trị sổ, từ chối giá trị lạ (thông điệp nêu tên ràng buộc).
    const chen = (f) => `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method) VALUES ${f}`;
    let n = 0;
    for (const f of NAM_COT) {
      const v = f === "bedrooms" || f === "bathrooms" ? "2" : "x";
      const tier = f === "property_type" ? "fact" : "observed";
      const m = tier === "fact" ? "source_field" : "parser";
      await c.query(chen(`('TST:ac1-${f}', '${f}', '${v}', '${tier}', '${m}')`)); n++;
    }
    const tuChoi = async (sql, rang) => {
      await c.query("SAVEPOINT s");
      await assert.rejects(c.query(sql), (e) => { assert.match(e.message, rang); return true; });
      await c.query("ROLLBACK TO SAVEPOINT s"); n++;
    };
    await tuChoi(chen(`('TST:ac1-k', 'kind', 'sale', 'observed', 'parser')`), /field_assertions_field_chk/);
    for (const t of VOCAB.evidence_tier) {
      const m = t === "fact" ? "hitl" : "e1_rule";
      await c.query(chen(`('TST:ac1-t-${t}', 'street_raw', 'y', '${t}', '${m}')`)); n++;
    }
    await tuChoi(chen(`('TST:ac1-t', 'street_raw', 'y', 'khac', 'parser')`), /field_assertions_evidence_tier_chk/);
    for (const m of VOCAB.assertion_method) {
      const t = m === "hitl" || m === "source_field" ? "fact" : "observed";
      await c.query(chen(`('TST:ac1-m-${m}', 'street_raw', 'y', '${t}', '${m}')`)); n++;
    }
    await tuChoi(chen(`('TST:ac1-m', 'street_raw', 'y', 'observed', 'khac')`), /field_assertions_method_chk/);
    await tuChoi(chen(`('TST:ac1-c1', 'street_raw', 'y', 'fact', 'parser')`), /cặp lớp\/phương pháp không hợp lệ/);
    await tuChoi(chen(`('TST:ac1-c2', 'street_raw', 'y', 'observed', 'hitl')`), /cặp lớp\/phương pháp không hợp lệ/);
    // chỉ mục sống: trùng → lỗi; rút rồi ghi lại → được
    await tuChoi(chen(`('TST:ac1-street_raw', 'street_raw', ' X ', 'observed', 'parser')`), /field_assertions_live_uq/);
    await c.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thử' WHERE subject_key = 'TST:ac1-street_raw'`);
    await c.query(chen(`('TST:ac1-street_raw', 'street_raw', 'x', 'observed', 'parser')`)); n++;
    assert.equal(n, NAM_COT.length + VOCAB.evidence_tier.length + VOCAB.assertion_method.length + 7);
  } finally {
    await c.query("ROLLBACK");
  }
});

test("PD-AC-2 chỉ thêm: sửa, xoá, TRUNCATE bị chặn; rút đúng một lần, có lý do; bỏ trigger thì sửa được (đối chứng)", async () => {
  await trongGiaoDich(c, async () => {
    await writeAssertions(c, [{ subject_key: "TST:ac2", field: "street_raw", value: "Láng", evidence_tier: "observed", method: "parser" }]);
    const id = (await one("SELECT id FROM field_assertions WHERE subject_key = 'TST:ac2'")).id;
    const chan = async (sql, rang) => {
      await c.query("SAVEPOINT s");
      await assert.rejects(c.query(sql, sql.includes("$1") ? [id] : []), (e) => { assert.match(e.message, rang); return true; });
      await c.query("ROLLBACK TO SAVEPOINT s");
    };
    await chan("UPDATE field_assertions SET value = 'Kim Mã' WHERE id = $1", /field_assertions: chỉ thêm/);
    await chan("UPDATE field_assertions SET evidence_tier = 'fact', method = 'hitl' WHERE id = $1", /field_assertions: chỉ thêm/);
    await chan("DELETE FROM field_assertions WHERE id = $1", /field_assertions: chỉ thêm/);
    await chan("TRUNCATE field_assertions", /field_assertions: chỉ thêm/);
    await chan("UPDATE field_assertions SET retracted_at = now() WHERE id = $1", /field_assertions: rút phải có lý do/);
    await c.query("UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thử' WHERE id = $1", [id]);
    assert.ok((await one("SELECT retracted_at FROM field_assertions WHERE id = $1", [id])).retracted_at);
    await chan("UPDATE field_assertions SET retract_reason = 'lần hai' WHERE id = $1", /field_assertions: đã rút/);
    // đối chứng: thước đang đo trigger, không đo quyền
    await c.query("SAVEPOINT d");
    await c.query("DROP TRIGGER field_assertions_guard ON field_assertions");
    const r = await c.query("UPDATE field_assertions SET value = 'Kim Mã' WHERE id = $1", [id]);
    assert.equal(r.rowCount, 1, "đối chứng: bỏ trigger mà vẫn không sửa được — thước không đo trigger");
    await c.query("ROLLBACK TO SAVEPOINT d");
  });
});

// ---------------------------------------------------------------------------------------------------------------------
/** Ghi phát biểu của một ca lên tin mồi; `dao` đảo thứ tự ghi. Trả offer_id. */
async function gieoCa(ca, tin, dao = false) {
  const ds = ca.phat_bieu.map((p) => ({
    subject_key: p.post === "la" ? subjectKey(TST, `${tin.posts[0]}-la`) : subjectKey(TST, tin.posts[p.post]),
    field: p.field, value: p.value, evidence_tier: p.tier, method: p.method, rule_id: p.rule_id ?? null, rut: p.rut,
  }));
  for (const p of dao ? [...ds].reverse() : ds) {
    const { rut, ...row } = p;
    await writeAssertions(c, [row]);
    if (rut) {
      await c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'thử'
        WHERE subject_key = $1 AND field = $2 AND value_key = assertion_value_key($3) AND retracted_at IS NULL`,
      [row.subject_key, row.field, row.value]);
    }
  }
  return tin.row.offer_id;
}
const docTin = async (id) => one(`SELECT ${NAM_COT.join(", ")}, field_provenance FROM sale_offer_records WHERE offer_id = $1`, [id]);
const boIds = (prov) => JSON.parse(JSON.stringify(prov, (k, v) => (k === "ids" ? undefined : v)));

test("PD-AC-3 ma trận phân xử viết trước: giá trị cột + cờ nguồn gốc từng ca; đảo thứ tự ghi ra trùng; chủ thể lạ không lẫn", async () => {
  await trongGiaoDich(c, async () => {
    await moCong(c);
    const tins = MA_TRAN.map((ca, i) => ({ ca, a: tinMoi(`ac3-${i}`, ca.posts), b: tinMoi(`ac3d-${i}`, ca.posts) }));
    await writeOffers(c, TST, tins.flatMap((t) => [t.a.row, t.b.row]));
    let nAssert = 0;
    const nKyVong = MA_TRAN.reduce((s, ca) => s + Object.keys(ca.ky_vong).length, 0);
    for (const { ca, a, b } of tins) {
      const idA = await gieoCa(ca, a);
      const idB = await gieoCa(ca, b, true);
      await resolveOffers(c, [idA, idB]);
      const ra = await docTin(idA);
      const rb = await docTin(idB);
      for (const [f, k] of Object.entries(ca.ky_vong)) {
        const p = ra.field_provenance[f];
        assert.deepEqual(ra[f], k.v, `${ca.ten} · ${f}: cột`);
        if (k.prov === false) assert.equal(p, undefined, `${ca.ten} · ${f}: không được có nguồn gốc`);
        else if (k.goi_y !== undefined) assert.equal(p?.goi_y?.length, k.goi_y, `${ca.ten} · ${f}: số gợi ý`);
        else {
          assert.equal(p?.tier, k.tier, `${ca.ten} · ${f}: lớp`);
          assert.equal(p?.method, k.method, `${ca.ten} · ${f}: phương pháp`);
          assert.equal(p?.conflict, k.conflict, `${ca.ten} · ${f}: cờ bất đồng`);
          assert.equal(p?.lower_disagree, k.lower_disagree, `${ca.ten} · ${f}: cờ lớp dưới trái`);
          assert.equal(p?.measured, false, `${ca.ten} · ${f}: measured`);
          assert.ok(Array.isArray(p?.ids) && p.ids.length > 0, `${ca.ten} · ${f}: ids`);
        }
        nAssert++;
      }
      // đảo thứ tự: năm cột + nguồn gốc (bỏ ids — id dòng khác nhau) trùng
      for (const f of NAM_COT) assert.deepEqual(rb[f], ra[f], `${ca.ten} · ${f}: đảo thứ tự ghi đổi cột`);
      assert.deepEqual(boIds(rb.field_provenance), boIds(ra.field_provenance), `${ca.ten}: đảo thứ tự ghi đổi nguồn gốc`);
    }
    assert.equal(nAssert, nKyVong, "số assert ≠ số ô kỳ vọng của ma trận");
    assert.ok(MA_TRAN.length >= 12, "ma trận phải ≥ 12 ca");
  });
});

test("PD-AC-8 cổng resolve: chưa cắt chuyển thì phân xử từ chối, không ô nào đổi; có dòng cắt chuyển thì chạy", async () => {
  await trongGiaoDich(c, async () => {
    if ((await one("SELECT count(*)::int AS n FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen'")).n > 0) {
      // DB đã cắt chuyển thật (sau merge) — dựng lại cảnh «chưa cắt chuyển» trong giao dịch
      await c.query("UPDATE ops_audit SET action = 'phat-bieu:cat-chuyen#an' WHERE action = 'phat-bieu:cat-chuyen'");
    }
    const t = tinMoi("ac8g", 1);
    await writeOffers(c, TST, [t.row]).catch(() => {});   // writeOffers bản 045 gọi phân xử — chặn ở cổng là đúng
    await c.query("SAVEPOINT s");
    const truoc = await bamTin();
    await assert.rejects(resolveOffers(c, null), /phân xử: chưa cắt chuyển/);
    await c.query("ROLLBACK TO SAVEPOINT s");
    assert.equal(await bamTin(), truoc);
    await moCong(c);
    const r = await resolveOffers(c, [t.row.offer_id]);
    assert.equal(typeof r.offers, "number");
  });
});

// ---------------------------------------------------------------------------------------------------------------------
async function deXuat(offerId, field, value, source, route = "direct") {
  return Number((await one(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, evidence)
    VALUES ('pd-ac-6', $1, $2, $3, lower($3), $4, $5, '{}'::jsonb) RETURNING id`, [offerId, field, value, source, route])).id);
}
const trangThai = async (id) => (await one("SELECT status FROM enrichment_proposals WHERE id = $1", [id])).status;
const phatBieuCua = async (id) => c.query(
  "SELECT evidence_tier, method, changed_by, retracted_at, retract_reason FROM field_assertions WHERE evidence ->> 'proposal_id' = $1::text",
  [id]).then((r) => r.rows);

test("PD-AC-6 đường enrich qua phát biểu: E1/E2 quan sát, người sự thật; applied/skipped theo cột; hoàn tác về giá trị kế; thứ tự áp không đổi kết quả", async () => {
  await trongGiaoDich(c, async () => {
    await moCong(c);
    const a = tinMoi("ac6a", 1); const b = tinMoi("ac6b", 1);
    await writeOffers(c, TST, [a.row, b.row]);
    const oa = a.row.offer_id; const subj = subjectKey(TST, a.row.originating_system_key);
    // máy: E1 house → quan sát/e1_rule trên post neo, cột house
    const p1 = await deXuat(oa, "property_type", "house", "e1_rule");
    assert.equal(await one("SELECT apply_enrichment($1, 'enrich-run:pd') AS n", [[p1]]).then((r) => r.n), 1);
    assert.deepEqual((await phatBieuCua(p1)).map((x) => [x.evidence_tier, x.method]), [["observed", "e1_rule"]]);
    assert.equal((await one("SELECT subject_key FROM field_assertions WHERE evidence ->> 'proposal_id' = $1::text", [p1])).subject_key, subj);
    assert.equal((await docTin(oa)).property_type, "house");
    assert.equal(await trangThai(p1), "applied");
    // máy: E2 Đội Cấn và E1 Kim Mã cùng ô đường → E1 thắng (thứ tự tạm), E2 skipped, cờ bất đồng
    const p4 = await deXuat(oa, "street_raw", "Đội Cấn", "e2_llm");
    const p5 = await deXuat(oa, "street_raw", "Kim Mã", "e1_rule");
    await c.query("SELECT apply_enrichment($1, 'enrich-run:pd')", [[p4]]);
    await c.query("SELECT apply_enrichment($1, 'enrich-run:pd')", [[p5]]);
    let t = await docTin(oa);
    assert.equal(t.street_raw, "Kim Mã");
    assert.equal(t.field_provenance.street_raw.conflict, true);
    assert.equal(await trangThai(p5), "applied");
    // p4 đã chấm 'applied' lúc một mình nó (cột nhận Đội Cấn), nay cột đã sang Kim Mã — trạng thái đề xuất là lịch sử lúc áp
    // đảo thứ tự trên tin b: E1 trước rồi E2 → cùng cột, cùng cờ; E2 lần này 'skipped'
    const q5 = await deXuat(b.row.offer_id, "street_raw", "Kim Mã", "e1_rule");
    const q4 = await deXuat(b.row.offer_id, "street_raw", "Đội Cấn", "e2_llm");
    await c.query("SELECT apply_enrichment($1, 'enrich-run:pd')", [[q5]]);
    await c.query("SELECT apply_enrichment($1, 'enrich-run:pd')", [[q4]]);
    const tb = await docTin(b.row.offer_id);
    assert.equal(tb.street_raw, t.street_raw, "đảo thứ tự áp đổi cột");
    assert.deepEqual(boIds(tb.field_provenance.street_raw), boIds(t.field_provenance.street_raw), "đảo thứ tự áp đổi nguồn gốc");
    assert.equal(await trangThai(q4), "skipped");
    // người duyệt thẻ: E2 land (route review) → sự thật/hitl, changed_by, cột land, applied
    const p2 = await deXuat(oa, "property_type", "land", "e2_llm", "review");
    await c.query("SELECT apply_enrichment($1, 'hitl:thu')", [[p2]]);
    assert.deepEqual((await phatBieuCua(p2)).map((x) => [x.evidence_tier, x.method, x.changed_by]), [["fact", "hitl", "hitl:thu"]]);
    assert.equal((await docTin(oa)).property_type, "land");
    assert.equal(await trangThai(p2), "applied");
    // hitl-cung-gia-tri: người khác duyệt cùng giá trị land → không thêm dòng hitl, không rút
    const p7 = await deXuat(oa, "property_type", "land", "e1_rule", "review");
    await c.query("SELECT apply_enrichment($1, 'hitl:thu2')", [[p7]]);
    assert.equal((await one(`SELECT count(*)::int AS n FROM field_assertions WHERE subject_key = $1 AND field = 'property_type'
      AND method = 'hitl' AND retracted_at IS NULL`, [subj])).n, 1);
    // người đổi ý sang apartment → hitl land rút ('hitl-thay'), cột apartment
    const p6 = await deXuat(oa, "property_type", "apartment", "e1_rule", "review");
    await c.query("SELECT apply_enrichment($1, 'hitl:thu')", [[p6]]);
    assert.equal((await phatBieuCua(p2))[0].retract_reason, "hitl-thay");
    assert.equal((await docTin(oa)).property_type, "apartment");
    // hoàn tác p6 → phát biểu rút 'hoan-tac:…', cột về giá trị kế có căn cứ (E1 house — hitl land đã rút trước đó)
    assert.equal((await one("SELECT revert_enrichment($1, 'hitl:thu', 'thử') AS n", [[p6]])).n, 1);
    assert.match((await phatBieuCua(p6))[0].retract_reason, /^hoan-tac:thử$/);
    t = await docTin(oa);
    assert.equal(t.property_type, "house");
    assert.equal(t.field_provenance.property_type.method, "e1_rule");
    assert.equal(await trangThai(p6), "reverted");
    assert.ok((await one("SELECT count(*)::int AS n FROM ops_audit WHERE action = 'enrich:revert' AND detail ->> 'reason' = 'thử'")).n >= 1);
  });
});

test("PD-AC-8 cổng apply/revert: chưa cắt chuyển thì từ chối, không ô nào đổi", async () => {
  await trongGiaoDich(c, async () => {
    await c.query("UPDATE ops_audit SET action = 'phat-bieu:cat-chuyen#an' WHERE action = 'phat-bieu:cat-chuyen'");
    await c.query("SAVEPOINT m"); await moCong(c);
    const t = tinMoi("ac8e", 1);
    await writeOffers(c, TST, [t.row]);
    const p = await deXuat(t.row.offer_id, "street_raw", "Láng", "e1_rule");
    await c.query("UPDATE ops_audit SET action = 'phat-bieu:cat-chuyen#an' WHERE action = 'phat-bieu:cat-chuyen'");
    const truoc = await bamTin();
    for (const sql of ["SELECT apply_enrichment($1, 'enrich-run:pd')", "SELECT revert_enrichment($1, 'hitl:thu', 'thử')"]) {
      await c.query("SAVEPOINT s");
      await assert.rejects(c.query(sql, [[p]]), /phân xử: chưa cắt chuyển/, sql);
      await c.query("ROLLBACK TO SAVEPOINT s");
      assert.equal(await bamTin(), truoc, `${sql} đổi cột khi chưa cắt chuyển`);
    }
  });
});
