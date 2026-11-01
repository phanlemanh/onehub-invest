// can-theo-tin.itest.mjs — hàng can-theo-tin-khi-phan-xu-lai (CT-AC-n ↔ _acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml).
// Áp/hoàn tác đề xuất làm giàu phải đưa căn (properties) của tin chung bài đăng theo (066), không chỉ căn của tin đề xuất.
// Cần DB thử (DATABASE_URL, bash db/db-thu.sh oneinvest_p2_ct). Mọi ca trong BEGIN … ROLLBACK, giữ pg_advisory_xact_lock(33033),
// nạp 045 + 059 + 063 + hàm 066 qua napPhatBieu. Chiều đỏ nạp bản hàm 063 trong cùng giao dịch.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { writeOffers } from "../lib/write-offers.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { napPhatBieu, KHOI_SUA_066 } from "../lib/nap-045.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Nguyên văn một hàm trong một migration: từ CREATE OR REPLACE FUNCTION <ten> tới «END $$;» đầu tiên sau đó. */
function ham(tep, ten) {
  const s = readFileSync(join(ROOT, "db/migrations", tep), "utf8");
  const i = s.indexOf(`CREATE OR REPLACE FUNCTION ${ten}(`);
  const j = s.indexOf("END $$;", i);
  if (i < 0 || j < 0) throw new Error(`không tìm thấy hàm ${ten} trong ${tep}`);
  return s.slice(i, j + "END $$;".length);
}
const APPLY_063 = ham("063_phat_bieu_theo_bai_dang.sql", "apply_enrichment");
const REVERT_063 = ham("063_phat_bieu_theo_bai_dang.sql", "revert_enrichment");

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
function tin(osk, posts, extra = {}) {
  return {
    offer_id: mintOfferId(TST, osk), originating_system_key: osk, kind: "sale", confidence: "high",
    first_seen: SEED_AT, last_seen: SEED_AT, n_reposts: posts.length, post_ids: posts,
    price_tier: "P1", area_m2: 50, price_perm2: 100_000_000, ...extra,
  };
}
async function deXuat(offerId, field, value) {
  return Number((await one(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, evidence)
    VALUES ('ct-can-theo-tin', $1, $2, $3, lower($3), 'e2_llm', 'direct', '{}'::jsonb) RETURNING id`, [offerId, field, value])).id);
}
async function can(offerIds, cot = {}) {
  const id = Number((await one(`INSERT INTO properties (kind, property_type, bedrooms, bathrooms, street)
    VALUES ('sale', 'unknown', $1, $2, $3) RETURNING id`, [cot.bedrooms ?? null, cot.bathrooms ?? null, cot.street ?? null])).id);
  for (const o of offerIds) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [id, o]);
  return id;
}
const canRow = (id) => one("SELECT bedrooms, bathrooms, street, enrichment_log FROM properties WHERE id = $1", [id]);
const bedroomsCuaTin = async (ids) =>
  (await c.query("SELECT bedrooms FROM sale_offer_records WHERE offer_id = ANY ($1)", [ids])).rows.map((r) => r.bedrooms);
const ACTOR = { may: "enrich-run:ct", nguoi: "hitl:thu" };

/** Ma trận viết trước: máy/người × B sống/nghỉ × PB cùng/khác căn PA. */
const MA_TRAN = [];
for (const nguoi of ["may", "nguoi"]) for (const bNghi of [false, true]) for (const cungCan of [false, true]) {
  MA_TRAN.push({ nguoi, bNghi, cungCan, o: `${nguoi}·B ${bNghi ? "nghỉ" : "sống"}·${cungCan ? "cùng" : "khác"} căn` });
}

/**
 * A neo ở post P, B chung post P. PA gắn A; PB gắn B (cùng căn: PB = PA gắn cả A lẫn B). `truocLienKet` chạy TRƯỚC khi gắn
 * căn (để giá trị của tin có sẵn mà căn còn trống).
 */
async function dung(tag, { bNghi, cungCan, pb = {}, them = [], truocLienKet }) {
  const P = `ct-${tag}-p`;
  const A = tin(P, [P]);
  const B = tin(`ct-${tag}-b`, [`ct-${tag}-b`, P]);
  const D = tin(`ct-${tag}-d`, [`ct-${tag}-d`]);
  await writeOffers(c, TST, [A, B, D, ...them]);
  if (truocLienKet) await truocLienKet({ A: A.offer_id, B: B.offer_id, D: D.offer_id });
  const PA = await can(cungCan ? [A.offer_id, B.offer_id] : [A.offer_id]);
  const PB = cungCan ? PA : await can([B.offer_id], pb);
  if (cungCan && Object.keys(pb).length) {
    await c.query("UPDATE properties SET bedrooms = $2 WHERE id = $1", [PA, pb.bedrooms ?? null]);
  }
  if (bNghi) await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'doi_khoa' WHERE offer_id = $1`, [B.offer_id]);
  return { A: A.offer_id, B: B.offer_id, D: D.offer_id, PA, PB };
}

// ---------------------------------------------------------------------------------------------------------------------
/** Áp đề xuất bedrooms của A; PB phải bằng max() bedrooms các tin gắn PB, và có dòng log mang offer_ids chứa B. */
async function kiemAp(tag, { nguoi, bNghi, cungCan, o }) {
  const t = await dung(tag, { bNghi, cungCan });
  const p = await deXuat(t.A, "bedrooms", "3");
  await c.query("SELECT apply_enrichment($1, $2)", [[p], ACTOR[nguoi]]);
  const ganPB = (await c.query("SELECT offer_id FROM property_offers WHERE property_id = $1", [t.PB])).rows.map((r) => r.offer_id);
  const ky = Math.max(...(await bedroomsCuaTin(ganPB)).filter((x) => x != null));
  const pb = await canRow(t.PB);
  assert.equal((await bedroomsCuaTin([t.B]))[0], 3, `tiền đề: B phải được phân xử lại về 3 (${o})`);
  if (pb.bedrooms !== ky) throw new Error(`CT-AC-1: căn tin chung bài đăng không nhận theo (${o}): PB=${pb.bedrooms}, kỳ vọng ${ky}`);
  const log = pb.enrichment_log.at(-1);
  if (!log || log.src !== "enrich-proposals" || !(log.offer_ids ?? []).includes(t.B)) {
    throw new Error(`CT-AC-1: dòng log thiếu offer_ids của B (${o})`);
  }
  return t;
}

test("CT-AC-1 áp đề xuất: căn của tin chung bài đăng nhận max() giá trị, log mang offer_ids (ma trận 8 ô)", async () => {
  for (const o of MA_TRAN) await trongGiaoDich(() => kiemAp(`a1-${MA_TRAN.indexOf(o)}`, o));
});

test("CT-AC-1 ô A ≠ B cùng căn: căn nhận max() bedrooms của A và B", async () => {
  await trongGiaoDich(async () => {
    // B có sẵn bedrooms 4 từ đề xuất riêng (chủ thể của B), áp TRƯỚC khi gắn căn → căn còn trống
    const t = await dung("a1-max", {
      bNghi: false, cungCan: true,
      truocLienKet: async ({ B }) => { await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(B, "bedrooms", "4")]]); },
    });
    assert.equal((await canRow(t.PA)).bedrooms, null, "tiền đề: căn còn trống");
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(t.A, "bedrooms", "3")]]);
    const [a] = await bedroomsCuaTin([t.A]);
    const [b] = await bedroomsCuaTin([t.B]);
    assert.notEqual(a, null);
    assert.equal((await canRow(t.PA)).bedrooms, Math.max(a, b ?? -Infinity), "CT-AC-1: căn không nhận max() của các tin gắn căn");
  });
});

test("CT-AC-1 ô PB có sẵn giá trị: ô giữ nguyên khi áp", async () => {
  await trongGiaoDich(async () => {
    const t = await dung("a1-san", { bNghi: false, cungCan: false, pb: { bedrooms: 9 } });
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(t.A, "bedrooms", "3")]]);
    assert.equal((await canRow(t.PB)).bedrooms, 9, "CT-AC-1: ô căn có sẵn bị ghi đè");
  });
});

test("CT-AC-1 chiều đỏ: bản apply_enrichment 063 — khác căn không nhận theo, cùng căn chỉ thiếu offer_ids trong log", async () => {
  for (const o of MA_TRAN) {
    await trongGiaoDich(async () => {
      await c.query(APPLY_063);
      const mau = o.cungCan ? /CT-AC-1: dòng log thiếu offer_ids của B/ : /CT-AC-1: căn tin chung bài đăng không nhận theo/;
      await assert.rejects(kiemAp(`a1d-${MA_TRAN.indexOf(o)}`, o), mau, o.o);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
/** Áp (066) rồi hoàn tác; `con` = căn còn tin mang 3 hay không. revertCu nạp revert 063 trước khi hoàn tác. */
async function kiemHoanTac(tag, { nguoi, bNghi, cungCan, o }, { revertCu = false, dGiu = false, bGiu = false } = {}) {
  const t = await dung(tag, {
    bNghi, cungCan,
    truocLienKet: bGiu ? async ({ B }) => {
      await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(B, "bedrooms", "3")]]);
    } : undefined,
  });
  if (dGiu) {
    // D gắn PB mang sẵn 3 từ đề xuất riêng
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(t.D, "bedrooms", "3")]]);
    await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [t.PB, t.D]);
  }
  const p = await deXuat(t.A, "bedrooms", "3");
  await c.query("SELECT apply_enrichment($1, $2)", [[p], ACTOR[nguoi]]);
  assert.equal((await canRow(t.PB)).bedrooms, 3, `tiền đề: áp phải điền PB (${o})`);
  const nLog = (await canRow(t.PB)).enrichment_log.length;
  if (revertCu) await c.query(REVERT_063);
  assert.equal((await one("SELECT revert_enrichment($1, 'hitl:thu', 'thử hoàn tác') AS n", [[p]])).n, 1);
  const ganPB = (await c.query("SELECT offer_id FROM property_offers WHERE property_id = $1", [t.PB])).rows.map((r) => r.offer_id);
  // cùng tập bản ghi mà bước áp đọc: kể cả tin đã nghỉ
  const conMang = (await c.query(`SELECT 1 FROM sale_offer_records WHERE offer_id = ANY ($1) AND bedrooms = 3`, [ganPB])).rowCount > 0;
  const pb = await canRow(t.PB);
  if (bGiu && pb.bedrooms === null) throw new Error(`CT-AC-2: căn mất giá trị B vẫn mang (${o})`);
  if (conMang && pb.bedrooms === null) throw new Error(`CT-AC-2: căn mất giá trị còn tin mang (${o})`);
  if (!conMang && pb.bedrooms === 3) throw new Error(`CT-AC-2: căn tin chung bài đăng giữ giá trị đã rút (${o})`);
  const moi = pb.enrichment_log.slice(nLog);
  if (!moi.some((l) => l.src === "enrich-revert")) throw new Error(`CT-AC-2: căn thiếu dòng enrich-revert (${o})`);
  return { pb, conMang };
}

test("CT-AC-2 hoàn tác: căn của tin chung bài đăng mất giá trị đã rút (ma trận 8 ô)", async () => {
  for (const o of MA_TRAN) {
    await trongGiaoDich(async () => {
      const { pb, conMang } = await kiemHoanTac(`a2-${MA_TRAN.indexOf(o)}`, o);
      assert.equal(conMang, false, `tiền đề ô thường: không tin nào của PB còn mang 3 (${o.o})`);
      assert.equal(pb.bedrooms, null);
    });
  }
});

test("CT-AC-2 ô D của PB mang cùng giá trị: căn giữ", async () => {
  await trongGiaoDich(async () => {
    const { pb } = await kiemHoanTac("a2-d", MA_TRAN[0], { dGiu: true });
    assert.equal(pb.bedrooms, 3);
  });
});

test("CT-AC-2 ô B còn mang giá trị từ nguồn riêng sau phân xử lại: căn giữ (B sống và B đã nghỉ, khác căn)", async () => {
  for (const o of MA_TRAN.filter((x) => x.nguoi === "may" && !x.cungCan)) {
    await trongGiaoDich(async () => {
      const { pb, conMang } = await kiemHoanTac(`a2-b-${MA_TRAN.indexOf(o)}`, o, { bGiu: true });
      assert.equal(conMang, true, `tiền đề: B vẫn mang 3 sau hoàn tác (${o.o})`);
      assert.equal(pb.bedrooms, 3);
    });
  }
});

test("CT-AC-1 proposal_ids: một lượt áp có đề xuất của hai bài đăng — căn tin chung chỉ ghi đề xuất cùng bài", async () => {
  await trongGiaoDich(async () => {
    const t = await dung("a1-pid", { bNghi: false, cungCan: false });
    const X = tin("ct-a1-pid-x", ["ct-a1-pid-x"]);
    await writeOffers(c, TST, [X]);
    const pA = await deXuat(t.A, "bedrooms", "3");
    const pX = await deXuat(X.offer_id, "bedrooms", "2");
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[pA, pX]]);
    const log = (await canRow(t.PB)).enrichment_log.at(-1);
    assert.deepEqual(log.proposal_ids, [pA], "CT-AC-1: căn tin chung ghi đề xuất của bài đăng khác");
  });
});

test("CT-AC-2 chiều đỏ: bản revert_enrichment 063 để căn khác căn PA giữ giá trị đã rút", async () => {
  for (const o of MA_TRAN.filter((x) => !x.cungCan)) {
    await trongGiaoDich(async () => {
      await assert.rejects(kiemHoanTac(`a2d-${MA_TRAN.indexOf(o)}`, o, { revertCu: true }),
        /CT-AC-2: căn tin chung bài đăng giữ giá trị đã rút/, o.o);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
/** Tin C không chung bài đăng: áp + hoàn tác; chụp căn PC và cột C (bỏ t của log và khoá offer_ids mới của 066). */
async function luotRieng() {
  const C = tin("ct-a3-c", ["ct-a3-c"]);
  await writeOffers(c, TST, [C]);
  const PC = await can([C.offer_id]);
  const p = await deXuat(C.offer_id, "bedrooms", "3");
  const chup = async () => {
    const r = await canRow(PC);
    const log = r.enrichment_log.map(({ t, offer_ids, proposal_ids, ...x }) => x);
    const col = await one("SELECT property_type, bedrooms, bathrooms, street_raw FROM sale_offer_records WHERE offer_id = $1", [C.offer_id]);
    const khac = await one(`SELECT md5(coalesce(string_agg(concat_ws('|', bedrooms, bathrooms, street, property_type), ',' ORDER BY id), ''))
      AS h FROM properties WHERE id <> $1`, [PC]);
    return { can: { bedrooms: r.bedrooms, bathrooms: r.bathrooms, street: r.street, log }, col, khac: khac.h };
  };
  await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[p]]);
  const sauAp = await chup();
  await c.query("SELECT revert_enrichment($1, 'hitl:thu', 'thử')", [[p]]);
  return { sauAp, sauRut: await chup() };
}

test("CT-AC-3 tin không chung bài đăng: áp + hoàn tác bằng 066 và 063 cho cùng căn, cùng cột, mọi căn khác không đổi", async () => {
  const moi = await trongGiaoDich(luotRieng);
  const cu = await trongGiaoDich(async () => { await c.query(APPLY_063); await c.query(REVERT_063); return luotRieng(); });
  assert.equal(moi.sauAp.can.bedrooms, 3);
  assert.deepEqual(moi, cu, "CT-AC-3: tin không chung bài đăng cho kết quả khác bản 063");
});

// ---------------------------------------------------------------------------------------------------------------------
const demLech = async (ids) => Number((await one(`
  SELECT count(*) FILTER (WHERE p.bedrooms IS NULL AND o.bedrooms IS NOT NULL) AS n
    FROM property_offers po JOIN properties p ON p.id = po.property_id JOIN sale_offer_records o ON o.offer_id = po.offer_id
   WHERE p.id = ANY ($1)`, [ids])).n);
const demAudit = async () => Number((await one("SELECT count(*) AS n FROM ops_audit WHERE action = 'can-theo-tin:sua-mot-lan-066'")).n);

test("CT-AC-4 sửa một lần: điền đúng các ô lệch do 063 để lại, một dòng audit, lượt hai 0 ô, ba ô đối chứng", async () => {
  await trongGiaoDich(async () => {
    await c.query(APPLY_063);
    await c.query(REVERT_063);
    // Lệch thật: áp bằng 063 nên PB của B chung bài còn trống.
    const t = await dung("a4", { bNghi: false, cungCan: false });
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(t.A, "bedrooms", "3")]]);
    // Đối chứng 1 — đề xuất không còn applied (đánh dấu reverted) dù tin còn mang giá trị: căn không được điền.
    const r = await dung("a4-rv", { bNghi: false, cungCan: false });
    const pr = await deXuat(r.A, "bedrooms", "5");
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[pr]]);
    await c.query("UPDATE enrichment_proposals SET status = 'reverted' WHERE id = $1", [pr]);
    // Đối chứng 2 — căn không gắn tin chung chủ thể của đề xuất applied nào, dù tin G MANG giá trị (đề xuất của G không
    // applied — đánh dấu skipped): bản khối sửa bỏ bộ lọc tin chung sẽ điền PG → phép này đỏ.
    const G = tin("ct-a4-g", ["ct-a4-g"]);
    await writeOffers(c, TST, [G]);
    const pg_ = await deXuat(G.offer_id, "bedrooms", "4");
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[pg_]]);
    await c.query("UPDATE enrichment_proposals SET status = 'skipped' WHERE id = $1", [pg_]);
    const PG = await can([G.offer_id]);
    assert.equal((await bedroomsCuaTin([G.offer_id]))[0], 4, "tiền đề: G mang giá trị");
    const hG = async () => (await one("SELECT md5(row(bedrooms, bathrooms, street, enrichment_log)::text) AS h FROM properties WHERE id = $1", [PG])).h;
    const truocG = await hG();
    // Đối chứng 3 — ô căn có sẵn: giữ nguyên.
    const s = await dung("a4-san", { bNghi: false, cungCan: false, pb: { bedrooms: 9 } });
    await c.query("SELECT apply_enrichment($1, 'enrich-run:ct')", [[await deXuat(s.A, "bedrooms", "3")]]);

    const lechTruoc = await demLech([t.PB]);
    assert.equal(lechTruoc, 1, "tiền đề: 063 để PB lệch 1 ô");
    const auditTruoc = await demAudit();
    await c.query(KHOI_SUA_066);
    assert.equal(await demLech([t.PB]), 0, "CT-AC-4: ô lệch chưa được điền");
    assert.equal((await canRow(t.PB)).bedrooms, 3);
    assert.equal(await demAudit(), auditTruoc + 1, "CT-AC-4: thiếu dòng audit");
    const d = (await one("SELECT detail FROM ops_audit WHERE action = 'can-theo-tin:sua-mot-lan-066' ORDER BY id DESC LIMIT 1")).detail;
    assert.deepEqual({ cells: d.cells, properties: d.properties }, { cells: lechTruoc, properties: 1 }, "CT-AC-4: detail không khớp đếm độc lập");
    assert.equal((await canRow(r.PB)).bedrooms, null, "CT-AC-4: đối chứng đề xuất không còn applied bị điền");
    assert.equal(await hG(), truocG, "CT-AC-4: đối chứng căn không chung bị đổi");
    assert.equal((await canRow(s.PB)).bedrooms, 9, "CT-AC-4: đối chứng ô có sẵn bị ghi đè");
    await c.query(KHOI_SUA_066);
    assert.equal(await demAudit(), auditTruoc + 1, "CT-AC-4: lượt hai thêm dòng audit");
  });
});
