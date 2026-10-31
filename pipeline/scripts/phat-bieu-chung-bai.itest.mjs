// phat-bieu-chung-bai.itest.mjs — hàng phat-bieu-db-do-tren-main (PB-AC-n ↔ _acceptance/phat-bieu-db-do-tren-main/evals.yaml).
// Áp/hoàn tác đề xuất làm giàu phải phân xử lại mọi bản ghi tin chung post (063), không chỉ tin của đề xuất.
// Cần DB local :5433 — chạy trên DB thử (DATABASE_URL, bash db/db-thu.sh oneinvest_p2_pd). Mọi ca trong BEGIN … ROLLBACK,
// giữ pg_advisory_xact_lock(33033), nạp 045 + 059 + hàm 063 qua napPhatBieu. Chiều đỏ nạp bản hàm cũ trong cùng giao dịch.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { writeOffers } from "../lib/write-offers.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { napPhatBieu, SAU_045_CUA_059 } from "../lib/nap-045.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const doc = (f) => readFileSync(join(ROOT, "db/migrations", f), "utf8");
/** Nguyên văn một hàm trong một migration: từ CREATE OR REPLACE FUNCTION <ten> tới «END $$;» đầu tiên sau đó. */
function ham(tep, ten) {
  const s = doc(tep);
  const i = s.indexOf(`CREATE OR REPLACE FUNCTION ${ten}(`);
  const j = s.indexOf("END $$;", i);
  if (i < 0 || j < 0) throw new Error(`không tìm thấy hàm ${ten} trong ${tep}`);
  return s.slice(i, j + "END $$;".length);
}
const APPLY_CU = ham("059_thoi_gian_hieu_luc.sql", "apply_enrichment");   // trước 063
const REVERT_CU = ham("045_phat_bieu_va_phan_xu.sql", "revert_enrichment");   // trước 063
const MIG_045 = doc("045_phat_bieu_va_phan_xu.sql");
const HAM_045 = MIG_045.slice(MIG_045.indexOf("-- 6. Bộ phân xử"));

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  try {
    await napPhatBieu(c);
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

const TST = "TST";
const SEED_AT = new Date("2026-10-20T00:00:00Z");
function tin(osk, posts) {
  return {
    offer_id: mintOfferId(TST, osk), originating_system_key: osk, kind: "sale", confidence: "high",
    first_seen: SEED_AT, last_seen: SEED_AT, n_reposts: posts.length, post_ids: posts,
    price_tier: "P1", area_m2: 50, price_perm2: 100_000_000,
  };
}
/** A neo ở post P; B chung post P (sống hoặc nghỉ đổi khoá); C không chung post với ai. */
async function dung(tag, { bNghi }) {
  const P = `pb-${tag}-p`;
  const A = tin(P, [P]);
  const B = tin(`pb-${tag}-b`, [`pb-${tag}-b`, P]);
  const C = tin(`pb-${tag}-c`, [`pb-${tag}-c`]);
  await writeOffers(c, TST, [A, B, C]);
  if (bNghi) await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'doi_khoa' WHERE offer_id = $1`, [B.offer_id]);
  return { A: A.offer_id, B: B.offer_id, C: C.offer_id };
}
async function deXuat(offerId, field = "property_type", value = "apartment") {
  return Number((await one(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, evidence)
    VALUES ('pb-chung-bai', $1, $2, $3, lower($3), 'e2_llm', 'direct', '{}'::jsonb) RETURNING id`, [offerId, field, value])).id);
}
const cot = async (id) => one(
  `SELECT property_type, bedrooms, bathrooms, street_raw, block_raw, field_provenance FROM sale_offer_records WHERE offer_id = $1`, [id]);
/** Ô của tin bằng kết quả phân xử lại trên phát biểu sống (resolve lần nữa không đổi gì). */
async function bangPhanXu(ids, nhan) {
  const r = (await one("SELECT resolve_offer_fields($1::text[]) AS r", [ids])).r;
  if (r.offers_changed !== 0) throw new Error(`${nhan}: cột chưa bằng kết quả phân xử (${r.offers_changed} tin đổi khi phân xử lại)`);
}
const ACTOR = { may: "enrich-run:pb", nguoi: "hitl:thu" };
const MA_TRAN = [["may", false], ["may", true], ["nguoi", false], ["nguoi", true]];

// ---------------------------------------------------------------------------------------------------------------------
/** Áp đề xuất của A; B chung post phải đổi theo, C giữ nguyên. */
async function kiemAp(tag, nguoi, bNghi) {
  const t = await dung(tag, { bNghi });
  const truocC = await cot(t.C);
  const p = await deXuat(t.A);
  await c.query("SELECT apply_enrichment($1, $2)", [[p], ACTOR[nguoi]]);
  const b = await cot(t.B);
  if (b.property_type !== "apartment") {
    throw new Error(`PB-AC-1: tin chung post không được phân xử lại (B=${b.property_type}, ${nguoi}, B ${bNghi ? "nghỉ" : "sống"})`);
  }
  assert.equal((await cot(t.A)).property_type, "apartment");
  await bangPhanXu([t.A, t.B], "PB-AC-1");
  assert.deepEqual(await cot(t.C), truocC, "PB-AC-1: tin không chung post bị đổi");
  return t;
}

test("PB-AC-1 áp đề xuất: mọi tin chung post được phân xử lại, tin riêng giữ nguyên (máy/người × B sống/nghỉ)", async () => {
  for (const [nguoi, bNghi] of MA_TRAN) {
    await trongGiaoDich(() => kiemAp(`ac1-${nguoi}-${bNghi ? "n" : "s"}`, nguoi, bNghi));
  }
});

test("PB-AC-1 chiều đỏ: bản apply_enrichment trước 063 để tin chung post giữ cột cũ", async () => {
  for (const [nguoi, bNghi] of MA_TRAN) {
    await trongGiaoDich(async () => {
      await c.query(APPLY_CU);
      await assert.rejects(kiemAp(`ac1d-${nguoi}-${bNghi ? "n" : "s"}`, nguoi, bNghi),
        /PB-AC-1: tin chung post không được phân xử lại/);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
/** Áp (bản 063) rồi hoàn tác; B về giá trị phân xử sau khi rút, C giữ nguyên. */
async function kiemHoanTac(tag, nguoi, bNghi, revertCu = false) {
  const t = await dung(tag, { bNghi });
  const truocC = await cot(t.C);
  const p = await deXuat(t.A);
  await c.query("SELECT apply_enrichment($1, $2)", [[p], ACTOR[nguoi]]);
  assert.equal((await cot(t.B)).property_type, "apartment", "tiền đề: áp phải đổi B");
  if (revertCu) await c.query(REVERT_CU);
  assert.equal((await one("SELECT revert_enrichment($1, 'hitl:thu', 'thử hoàn tác') AS n", [[p]])).n, 1);
  const b = await cot(t.B);
  if (b.property_type !== "unknown") {
    throw new Error(`PB-AC-2: hoàn tác không về tin chung post (B=${b.property_type}, ${nguoi}, B ${bNghi ? "nghỉ" : "sống"})`);
  }
  assert.equal((await cot(t.A)).property_type, "unknown");
  await bangPhanXu([t.A, t.B], "PB-AC-2");
  assert.deepEqual(await cot(t.C), truocC, "PB-AC-2: tin không chung post bị đổi");
}

test("PB-AC-2 hoàn tác: mọi tin chung post về đúng kết quả phân xử sau khi rút (máy/người × B sống/nghỉ)", async () => {
  for (const [nguoi, bNghi] of MA_TRAN) {
    await trongGiaoDich(() => kiemHoanTac(`ac2-${nguoi}-${bNghi ? "n" : "s"}`, nguoi, bNghi));
  }
});

test("PB-AC-2 chiều đỏ: bản revert_enrichment trước 063 để tin chung post giữ giá trị đã rút", async () => {
  for (const [nguoi, bNghi] of MA_TRAN) {
    await trongGiaoDich(async () => {
      await assert.rejects(kiemHoanTac(`ac2d-${nguoi}-${bNghi ? "n" : "s"}`, nguoi, bNghi, true),
        /PB-AC-2: hoàn tác không về tin chung post/);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
/** Tin không chung post: một lượt áp + hoàn tác, chụp những gì người dùng/hàm thấy (bỏ mã phát biểu — chuỗi số tăng). */
async function luotRieng(tag) {
  const t = await dung(tag, { bNghi: false });
  const p = await deXuat(t.C, "bedrooms", "3");
  const chup = async () => {
    const r = await cot(t.C);
    const fp = JSON.parse(JSON.stringify(r.field_provenance, (k, v) => (k === "ids" ? undefined : v)));
    const de = await one("SELECT status, applied_at IS NOT NULL AS da_ap FROM enrichment_proposals WHERE id = $1", [p]);
    const prop = await one("SELECT md5(coalesce(string_agg(p::text, '|' ORDER BY p.id), '')) AS h FROM properties p");
    return { ...r, field_provenance: fp, de, prop: prop.h };
  };
  const nAp = (await one("SELECT apply_enrichment($1, 'enrich-run:pb') AS n", [[p]])).n;
  const sauAp = await chup();
  const nRut = (await one("SELECT revert_enrichment($1, 'hitl:thu', 'thử') AS n", [[p]])).n;
  const sauRut = await chup();
  return { nAp, sauAp, nRut, sauRut };
}

test("PB-AC-3 tin không chung post: áp + hoàn tác bằng bản 063 và bản trước 063 cho cùng kết quả", async () => {
  const moi = await trongGiaoDich(() => luotRieng("ac3"));
  const cu = await trongGiaoDich(async () => {
    await c.query(APPLY_CU);
    await c.query(REVERT_CU);
    return luotRieng("ac3");
  });
  assert.equal(moi.nAp, 1);
  assert.equal(moi.sauAp.bedrooms, 3);
  assert.deepEqual(moi, cu, "PB-AC-3: tin không chung post khác hành vi trước 063");
});

// ---------------------------------------------------------------------------------------------------------------------
const dinhNghia = async (sig) => (await one(`SELECT pg_get_functiondef($1::regprocedure) AS d`, [sig])).d;
async function kiemBoNap(nhan) {
  for (const sig of ["apply_enrichment(bigint[],text)", "revert_enrichment(bigint[],text,text)"]) {
    if (!(await dinhNghia(sig)).includes("offers_chung_chu_the")) throw new Error(`PB-AC-4: bộ nạp test đè hàm 063 bằng bản cũ (${sig}, ${nhan})`);
  }
}

test("PB-AC-4 bộ nạp test: sau napPhatBieu hai hàm ghi là bản 063", async () => {
  await trongGiaoDich(() => kiemBoNap("napPhatBieu"));
});

test("PB-AC-4 chiều đỏ: nạp lại 045 + 059 mà không nạp 063 thì hai hàm là bản cũ", async () => {
  await trongGiaoDich(async () => {
    await c.query(HAM_045);
    await c.query(SAU_045_CUA_059);
    await assert.rejects(kiemBoNap("thiếu 063"), /PB-AC-4: bộ nạp test đè hàm 063 bằng bản cũ/);
  });
});
