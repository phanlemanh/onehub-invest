// doc-toan-bo-db.itest.ts — hồ sơ _acceptance/s03-llm-doc-toan-bo phần cần DB: một lượt trên Postgres local trong BEGIN…ROLLBACK.
// Model giả qua `hoi` đi qua bộ đọc trả lời thật; không gọi mạng, không tốn tiền. Chữ bài viết tay, số liệu giả.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: config:executors.test.ls1_db
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type pg from "pg";

import type { Nhan } from "../src/agents/nhan-bac-s03.js";
import type { ContextResult } from "../src/agents/context-resolver.js";
import { chayLuot, chonTin, docTraLoi, PROMPT_VERSION } from "../src/enrich/doc-toan-bo.js";
import { runEnrich, type ResolveFn } from "../src/enrich/run.js";
import { insertOffer, withTx } from "./helpers/db.js";

const SNAP = "hanoi__zalo-agent__2099-05-05T000000";
const MIG_065 = join(import.meta.dirname, "../../db/migrations/065_silver_labels.sql");
let dem = 0;

type Tin = { nhom?: string; id: string; text: string | null; source?: string; property_type?: string; price?: number | null; area?: number | null; kind?: string; confidence?: string; street?: string };

async function nen(c: pg.Client) {
  await c.query(await readFile(MIG_065, "utf8"));
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
}
async function moiTin(c: pg.Client, t: Tin): Promise<string> {
  const post = `t_ls1_p_${process.pid}_${++dem}`;
  if (t.text !== null) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
      VALUES ($1, $2, 'openclaw-hook', $4, 'ls1', $3, '2026-10-31T08:00:00Z')`, [post, SNAP, t.text, t.nhom ?? "Nhóm mồi LS1"]);
  }
  await insertOffer(c, { offer_id: t.id, source: t.source ?? "S03", property_type: t.property_type ?? "unknown", street_raw: t.street ?? null, post_ids: [post] });
  await c.query(`UPDATE sale_offers SET price_vnd = $2, area_m2 = $3, kind = $4, confidence = $5 WHERE offer_id = $1`,
    [t.id, t.price ?? null, t.area ?? null, t.kind ?? "sale", t.confidence ?? "high"]);
  return t.id;
}

/** Câu trả lời model giả, đi qua bộ đọc thật. */
const traLoi = (o: Record<string, unknown>) => JSON.stringify({ intent: "offer", kind: "sale", confidence: 0.9, quote: "", property_type: null, quote_loai: "", price_vnd: null, quote_gia: "", area_m2: null, quote_dt: "", bedrooms: null, bathrooms: null, street: null, block: null, ...o });
function hoiGia(theoChu: (chu: string) => string, goi: string[] = []) {
  return async (chu: string): Promise<Nhan> => {
    goi.push(chu);
    const p = docTraLoi(theoChu(chu), chu);
    return { model: "gateway:anthropic/claude-haiku-5.5", ...p, error_kind: p.json_ok ? null : "json-hong", latency_ms: 1, cost_usd: 0.001 };
  };
}
const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({ projectSlug: null, projectName: null, projectCandidates: [], propertyType: null, buildingHint: null, areaHint: null, matchedBy: "", ...o });
const E1_RONG: ResolveFn = async () => ctx();
const chay = (c: pg.Client, chiTin: string[], hoi: (chu: string) => Promise<Nhan>, o: Partial<Parameters<typeof chayLuot>[0]> = {}) =>
  chayLuot({ client: c, runId: `ls1-${++dem}`, tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin, hoi, resolve: E1_RONG, ...o });
const loaiHinh = async (c: pg.Client, id: string) => (await c.query(`SELECT property_type FROM sale_offers WHERE offer_id = $1`, [id])).rows[0].property_type;
const theCua = async (c: pg.Client, id: string) => (await c.query(`SELECT id, status, evidence FROM review_queue WHERE item_type = 'agent_output' AND item_id = $1 ORDER BY id`, [`enrich:${id}`])).rows;
const deXuat = async (c: pg.Client, id: string) => (await c.query(`SELECT id, field, value, source, route, corroborated_by, status, evidence FROM enrichment_proposals WHERE offer_id = $1 ORDER BY id`, [id])).rows;

// ---------- AC-1 ----------
export function kiemDaDoc(goi: string[], mongDoc: Record<string, string>, khongDoc: Record<string, string>) {
  for (const [id, chu] of Object.entries(mongDoc)) assert.equal(goi.filter((g) => g === chu).length, 1, `LS1-AC-1 tin ${id} phải được đọc đúng một lần`);
  for (const [id, chu] of Object.entries(khongDoc)) assert.ok(!goi.includes(chu), `LS1-AC-1 tin ${id} không được đọc`);
}
const MA_TRAN_AC1: Tin[] = [
  { id: "t_ls1_ban", text: "Bán căn hộ 2PN giá 3 tỷ tại Times City" },
  { id: "t_ls1_thue", text: "Cho thuê căn hộ 2PN 14tr tại Times City", kind: "rent_lt" },
  { id: "t_ls1_tinthap", text: "Bán gấp căn góc tầng cao giá thương lượng", confidence: "low" },
  { id: "t_ls1_du", text: "Bán căn đủ trường đã có loại hình rồi nhé", property_type: "apartment", street: "Minh Khai" },
  { id: "t_ls1_dathu", text: "Bán căn đã thử trong ba mươi ngày qua nhé" },
];
test("LS1-AC-1 mọi tin S03 có chữ đọc đúng một lần; S05 không đọc; không chữ đếm riêng", async () => {
  await withTx(async (c) => {
    await nen(c);
    for (const t of MA_TRAN_AC1) await moiTin(c, t);
    await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test', 'enrich:thu', $1)`, [{ offer_id: "t_ls1_dathu", run_id: "cu" }]);
    await moiTin(c, { id: "t_ls1_s05", text: "Tin nguồn khác không thuộc lượt đọc này", source: "S05" });
    await moiTin(c, { id: "t_ls1_ngan", text: "ảnh" });
    await moiTin(c, { id: "t_ls1_khongbai", text: null });
    // Không cờ giới hạn: tập chọn của dòng lệnh chứa đủ tin S03, không có tin S05.
    const chon = new Set((await chonTin(c)).map((t) => t.offer_id));
    for (const t of MA_TRAN_AC1) assert.ok(chon.has(t.id), `LS1-AC-1 chonTin bỏ sót ${t.id}`);
    assert.ok(!chon.has("t_ls1_s05"), "LS1-AC-1 chonTin lấy cả S05");
    const goi: string[] = [];
    const ids = [...MA_TRAN_AC1.map((t) => t.id), "t_ls1_s05", "t_ls1_ngan", "t_ls1_khongbai"];
    const kq = await chay(c, ids, hoiGia(() => traLoi({}), goi));
    assert.equal(kq.tin, 5);
    assert.equal(kq.khongChu, 2, "LS1-AC-1 tin không chữ phải đếm riêng");
    kiemDaDoc(goi, Object.fromEntries(MA_TRAN_AC1.map((t) => [t.id, t.text!])), { t_ls1_s05: "Tin nguồn khác không thuộc lượt đọc này" });
    assert.throws(() => kiemDaDoc(goi.filter((g) => g !== MA_TRAN_AC1[1].text), { t_ls1_thue: MA_TRAN_AC1[1].text! }, {}), /LS1-AC-1 tin t_ls1_thue/, "chiều đỏ AC-1");
  });
});

// ---------- AC-3, AC-4 ----------
test("LS1-AC-3 căn hộ, trích thật có từ khoá: ô được điền qua apply_enrichment, đề xuất mang mã luật, không thẻ", async () => {
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, { id: "t_ls1_ap", text: "Chính chủ bán căn hộ 2PN Times City giá 3 tỷ" });
    const kq = await chay(c, [id], hoiGia(() => traLoi({ quote: "Chính chủ bán", property_type: "apartment", quote_loai: "bán căn hộ 2PN" })));
    assert.equal(await loaiHinh(c, id), "apartment", "LS1-AC-3 ô loại hình không được điền");
    const [d] = await deXuat(c, id);
    assert.deepEqual([d.source, d.route, d.status, d.corroborated_by], ["e2_llm", "corroborated", "applied", "trich-dan:can-ho"]);
    assert.equal((await theCua(c, id)).length, 0, "LS1-AC-3 không được có thẻ");
    assert.equal(kq.daAp, 1);
    const n = await c.query(`SELECT count(*)::int AS n FROM silver_labels WHERE prompt_version = $1 AND run_id LIKE 'ls1-%'`, [PROMPT_VERSION]);
    assert.equal(n.rows[0].n, 1, "LS1-AC-3 nhãn phải vào silver_labels");
  });
});

const CHU_DUNG = "Chính chủ bán căn hộ 2PN Times City giá 3 tỷ";
const MA_TRAN_AC4: [string, string, string, Record<string, unknown>, string | null][] = [
  ["trích giả", "t_ls1_gia", CHU_DUNG, { property_type: "apartment", quote_loai: "bán căn hộ 3PN" }, "trich-gia"],
  ["không từ khoá", "t_ls1_ktk", "Cần bán gấp 2PN Times City giá 3 tỷ", { property_type: "apartment", quote_loai: "bán gấp 2PN" }, "khong-tu-khoa"],
  ["từ khoá loại khác", "t_ls1_lk", "Chính chủ bán nhà phố 4 tầng Minh Khai", { property_type: "apartment", quote_loai: "bán nhà phố" }, "tu-khoa-loai-khac"],
  ["gần X", "t_ls1_gan", "Cho thuê phòng gần chung cư Times City 3tr", { property_type: "apartment", quote_loai: "gần chung cư Times City" }, "ngu-canh-loai-tru"],
  ["cạnh X", "t_ls1_canh", "Bán lô cạnh căn hộ mẫu dự án Minh Khai", { property_type: "apartment", quote_loai: "cạnh căn hộ mẫu" }, "ngu-canh-loai-tru"],
  ["cần mua X", "t_ls1_cm", "Khách cần mua căn hộ 2PN khu Minh Khai", { property_type: "apartment", quote_loai: "cần mua căn hộ 2PN" }, "ngu-canh-loai-tru"],
  ["không có trích", "t_ls1_ktr", CHU_DUNG + " tin không trích", { property_type: "apartment", quote_loai: "" }, "khong-co-trich"],
  ["hai loại", "t_ls1_hai", "Bán căn hộ và nhà phố cùng khu Minh Khai", { property_type: "apartment", quote_loai: "Bán căn hộ và nhà phố" }, "ngu-canh-loai-tru"],
];
test("LS1-AC-4 ma trận: loại hình giữ unknown, đề xuất skipped ghi lý do, không thẻ; đối chứng dương cùng tin", async () => {
  await withTx(async (c) => {
    await nen(c);
    for (const [ten, id, text, tra, lyDo] of MA_TRAN_AC4) {
      await moiTin(c, { id, text });
      await chay(c, [id], hoiGia(() => traLoi(tra)));
      assert.equal(await loaiHinh(c, id), "unknown", `LS1-AC-4 ${ten}: loại hình bị đổi`);
      const [d] = await deXuat(c, id);
      assert.deepEqual([d?.status, d?.evidence?.ly_do], ["skipped", lyDo], `LS1-AC-4 ${ten}: phải skipped lý do ${lyDo}`);
      assert.equal((await theCua(c, id)).length, 0, `LS1-AC-4 ${ten}: không được có thẻ`);
    }
    const duong = await moiTin(c, { id: "t_ls1_dg", text: CHU_DUNG + " căn đối chứng" });
    await chay(c, [duong], hoiGia(() => traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" })));
    assert.equal(await loaiHinh(c, duong), "apartment", "LS1-AC-4 đối chứng dương không áp");
  });
});

test("LS1-AC-4 hỏng JSON: không đề xuất, không thẻ, được đọc lại; nhãn tốt thay nhãn hỏng, cộng chi phí, không gọi lần ba; tin đã có loại hình không đổi", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = await moiTin(c, { id: "t_ls1_hong", text: "Bán căn gì đó không rõ loại hình nhé" });
    const goi: string[] = [];
    await chay(c, [a], hoiGia(() => "không phải json", goi));
    assert.equal((await deXuat(c, a)).length, 0);
    assert.equal(await loaiHinh(c, a), "unknown");
    await chay(c, [a], hoiGia(() => "không phải json", goi));
    assert.equal(goi.length, 2, "JSON hỏng phải được đọc lại ở lượt sau");
    assert.equal((await deXuat(c, a)).length, 0, "LS1-AC-4 đọc hỏng hai lần không được sinh đề xuất");
    await chay(c, [a], hoiGia(() => traLoi({ property_type: "apartment", quote_loai: "Bán căn" }), goi));
    assert.equal(goi.length, 3);
    assert.equal((await deXuat(c, a)).length, 1, "đọc lại được thì tin phải vào pha quyết, hỏng trước đó không được đánh dấu đã xử");
    const { rows: nhan } = await c.query(`SELECT json_ok, error_kind, cost_usd::float8 AS usd FROM silver_labels WHERE post_id = (SELECT post_ids[1] FROM sale_offers WHERE offer_id = $1)`, [a]);
    assert.equal(nhan.length, 1, "một bài một nhãn");
    assert.equal(nhan[0].json_ok, true);
    assert.equal(nhan[0].error_kind, null);
    assert.ok(Math.abs(nhan[0].usd - 0.003) < 1e-9, `chi phí phải cộng cả lần hỏng: ${nhan[0].usd}`);
    await chay(c, [a], hoiGia(() => "không phải json", goi));
    assert.equal(goi.length, 3, "nhãn đọc được thì không gọi lại");
    const b = await moiTin(c, { id: "t_ls1_co", text: "Bán căn đã có loại hình nhà riêng rồi", property_type: "house" });
    await chay(c, [b], hoiGia(() => traLoi({ property_type: "apartment", quote_loai: "Bán căn" })));
    assert.equal(await loaiHinh(c, b), "house", "LS1-AC-4 tin đã có loại hình bị đổi");
    assert.equal((await deXuat(c, b)).length, 0);
  });
});

test("LS1-AC-4 E1 trái model và model nói nhà phố: lên thẻ, không tự điền", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = await moiTin(c, { id: "t_ls1_e1", text: CHU_DUNG + " căn xung đột" });
    await chay(c, [a], hoiGia(() => traLoi({ property_type: "apartment", quote_loai: "câu bịa" })), { resolve: async () => ctx({ propertyType: "land", typeBasis: "luật mồi" }) });
    const ds = await deXuat(c, a);
    assert.deepEqual(ds.map((d) => [d.source, d.status]), [["e1_rule", "queued"], ["e2_llm", "queued"]], "LS1-AC-4 E1 trái model phải có hai đề xuất chờ");
    const [the] = await theCua(c, a);
    assert.equal(the.evidence.fields.filter((f: { conflict?: boolean }) => f.conflict).length, 2);
    assert.equal(await loaiHinh(c, a), "unknown");
    const b = await moiTin(c, { id: "t_ls1_nha", text: "Chính chủ bán nhà phố 4 tầng Minh Khai giá tốt" });
    await chay(c, [b], hoiGia(() => traLoi({ property_type: "house", quote_loai: "bán nhà phố" })));
    assert.equal(await loaiHinh(c, b), "unknown", "LS1-AC-4 nhà phố không được tự điền");
    assert.equal((await theCua(c, b)).length, 1, "LS1-AC-4 nhà phố phải lên thẻ");
  });
});

// ---------- AC-5 ----------
const bamTin = async (c: pg.Client, id: string) => (await c.query(`SELECT md5(s::text) AS h FROM sale_offers s WHERE offer_id = $1`, [id])).rows[0].h;
test("LS1-AC-5 inquiry kèm trích thật: thẻ có câu trích, tin không nghỉ, không cột nào đổi; trích giả hay offer thì không thẻ", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = await moiTin(c, { id: "t_ls1_tim", text: "Khách em cần mua căn hộ 2PN tầm 3 tỷ khu Minh Khai" });
    const truoc = await bamTin(c, a);
    await chay(c, [a], hoiGia(() => traLoi({ intent: "inquiry", kind: null, quote: "cần mua căn hộ 2PN", property_type: "apartment", quote_loai: "căn hộ 2PN" })));
    const [the] = await theCua(c, a);
    assert.ok(the, "LS1-AC-5 phải có thẻ");
    assert.deepEqual(the.evidence.doi_chieu, [{ loai: "y_dinh", trich: "cần mua căn hộ 2PN", ai: "inquiry", bo_doc: "offer" }]);
    assert.equal(await bamTin(c, a), truoc, "LS1-AC-5 dòng tin bị đổi");
    assert.equal((await c.query(`SELECT retired_at FROM sale_offers WHERE offer_id = $1`, [a])).rows[0].retired_at, null, "LS1-AC-5 tin bị nghỉ");
    const b = await moiTin(c, { id: "t_ls1_gia2", text: "Khách em tìm căn 2PN khu Minh Khai tầm 3 tỷ" });
    await chay(c, [b], hoiGia(() => traLoi({ intent: "inquiry", kind: null, quote: "câu bịa" })));
    assert.equal((await theCua(c, b)).length, 0, "LS1-AC-5 trích giả không được có thẻ");
    const d = await moiTin(c, { id: "t_ls1_offer", text: "Chính chủ bán căn 2PN khu Minh Khai giá 3 tỷ" });
    await chay(c, [d], hoiGia(() => traLoi({ intent: "offer", quote: "Chính chủ bán" })));
    assert.equal((await theCua(c, d)).length, 0, "LS1-AC-5 nói offer không được có thẻ");
  });
});

// ---------- AC-6 ----------
export function kiemBamGia(truoc: Map<string, string>, sau: Map<string, string>) {
  for (const [id, h] of truoc) assert.equal(sau.get(id), h, `LS1-AC-6 cột giá, diện tích của tin ${id} bị đổi`);
}
const bamGia = async (c: pg.Client) => new Map<string, string>((await c.query(`SELECT offer_id, md5(coalesce(price_vnd::text, '') || '|' || coalesce(area_m2::text, '')) AS h FROM sale_offers`)).rows.map((r) => [r.offer_id, r.h]));
test("LS1-AC-6 giá, diện tích khác bộ đọc: băm không đổi; lệch quá ngưỡng lên thẻ, trong ngưỡng thì không; đọc lỗi không thẻ", async () => {
  await withTx(async (c) => {
    await nen(c);
    const lech = await moiTin(c, { id: "t_ls1_lech", text: "Bán căn 2PN giá 5 tỷ diện tích 80m2 khu Minh Khai", price: 3e9, area: 70 });
    const trong = await moiTin(c, { id: "t_ls1_trong", text: "Bán căn 2PN giá 3,1 tỷ diện tích 71m2 khu Minh Khai", price: 3e9, area: 70 });
    const hong = await moiTin(c, { id: "t_ls1_doc", text: "Bán căn 2PN giá 9 tỷ diện tích 99m2 khu Minh Khai", price: 3e9, area: 70 });
    const truoc = await bamGia(c);
    await chay(c, [lech], hoiGia(() => traLoi({ price_vnd: 5e9, quote_gia: "giá 5 tỷ", area_m2: 80, quote_dt: "80m2" })));
    await chay(c, [trong], hoiGia(() => traLoi({ price_vnd: 3.1e9, quote_gia: "giá 3,1 tỷ", area_m2: 71, quote_dt: "71m2" })));
    await chay(c, [hong], hoiGia(() => "không phải json"));
    kiemBamGia(truoc, await bamGia(c));
    const [the] = await theCua(c, lech);
    assert.deepEqual(the.evidence.doi_chieu.map((d: { loai: string }) => d.loai), ["gia", "dien_tich"], "LS1-AC-6 lệch quá ngưỡng phải lên thẻ");
    assert.equal((await theCua(c, trong)).length, 0, "LS1-AC-6 trong ngưỡng không được lên thẻ");
    assert.equal((await theCua(c, hong)).length, 0, "LS1-AC-6 đọc lỗi không được lên thẻ");
    await c.query(`UPDATE sale_offers SET price_vnd = 1 WHERE offer_id = $1`, [lech]);
    await assert.rejects(async () => kiemBamGia(truoc, await bamGia(c)), /LS1-AC-6 cột giá, diện tích của tin t_ls1_lech/, "chiều đỏ AC-6");
  });
});

// ---------- AC-7: chạy lại ----------
const FIXTURE_AC7 = { id: "t_ls1_ba", text: "Khách cần mua căn hộ giá 5 tỷ khu Minh Khai rộng rãi", price: 3e9, area: 70 };
const hoiAc7 = (goi: string[] = []) => hoiGia(() => traLoi({ intent: "inquiry", kind: null, quote: "cần mua căn hộ", property_type: "apartment", quote_loai: "cần mua căn hộ", price_vnd: 5e9, quote_gia: "giá 5 tỷ" }), goi);
const E1_DAT: ResolveFn = async () => ctx({ propertyType: "land", typeBasis: "luật mồi" });
test("LS1-AC-7 E1 trái model, ý định, giá; chạy hai lần: đúng một thẻ, không nhân đôi, không gọi lần hai", async () => {
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, FIXTURE_AC7);
    const goi: string[] = [];
    await chay(c, [id], hoiAc7(goi), { resolve: E1_DAT });
    const dem1 = (await deXuat(c, id)).length;
    const nhan = async () => (await c.query(`SELECT count(*)::int AS n FROM silver_labels WHERE run_id LIKE 'ls1-%'`)).rows[0].n;
    const nhan1 = await nhan();
    await chay(c, [id], hoiAc7(goi), { resolve: E1_DAT });
    const the = await theCua(c, id);
    assert.equal(the.length, 1, "LS1-AC-7 phải đúng một thẻ");
    assert.deepEqual(the[0].evidence.doi_chieu, [
      { loai: "y_dinh", trich: "cần mua căn hộ", ai: "inquiry", bo_doc: "offer" },
      { loai: "gia", trich: "giá 5 tỷ", ai: 5e9, bo_doc: 3e9 },
    ], "LS1-AC-7 hàng đối chiếu sai trích hoặc sai bên");
    assert.equal(the[0].evidence.fields.length, 2, "LS1-AC-7 thẻ phải có hai bên xung đột");
    assert.equal(goi.length, 1, "LS1-AC-7 gọi model lần hai cho cùng chữ");
    assert.equal((await deXuat(c, id)).length, dem1, "LS1-AC-7 đề xuất nhân đôi");
    assert.equal(await nhan(), nhan1, "LS1-AC-7 nhãn nhân đôi");
  });
});

test("LS1 Focus 1: thẻ đã duyệt, chạy lại không mọc thẻ mới; chữ đổi thì xét lại", async () => {
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, { id: "t_ls1_f1", text: "Khách cần mua căn hộ 2PN khu Minh Khai tầm 3 tỷ" });
    const hoi = hoiGia(() => traLoi({ intent: "inquiry", kind: null, quote: "cần mua căn hộ" }));
    await chay(c, [id], hoi);
    const [the] = await theCua(c, id);
    await c.query(`UPDATE review_queue SET status = 'approved' WHERE id = $1`, [the.id]);
    await chay(c, [id], hoi);
    assert.equal((await theCua(c, id)).length, 1, "Focus 1: thẻ đã duyệt mọc lại");
    await c.query(`UPDATE stg_zalo_posts SET text = text || ' đã sửa' WHERE post_id = ANY ((SELECT post_ids FROM sale_offers WHERE offer_id = $1)::text[])`, [id]);
    await chay(c, [id], hoi);
    assert.equal((await theCua(c, id)).length, 2, "Focus 1 đối chứng: chữ đổi phải được xét lại");
  });
});

test("LS1 Focus 2: enrich-run dựng lại evidence của thẻ, đối chiếu còn nguyên; «Để sau» truyền sang thẻ mới", async () => {
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, FIXTURE_AC7);
    await chay(c, [id], hoiAc7(), { resolve: E1_DAT });
    const r = await runEnrich({
      client: c, runId: "ls1-dem", dry: false, limit: 1, offerIds: [id], resolve: E1_DAT,
      llm: async () => ({ result: { property_type: "room" }, model: "m", tracePath: null }),
    });
    assert.deepEqual(r.dem.loiGhi, []);
    const [the] = await theCua(c, id);
    assert.deepEqual(the.evidence.doi_chieu?.map((d: { loai: string }) => d.loai), ["y_dinh", "gia"], "Focus 2: enrich-run làm mất đối chiếu");
    assert.ok(the.evidence.fields.length >= 3, "Focus 2 đối chứng: enrich-run phải thật sự dựng lại thẻ");
    await c.query(`UPDATE review_queue SET status = 'deferred' WHERE id = $1`, [the.id]);
    await runEnrich({ client: c, runId: "ls1-dem2", dry: false, limit: 1, offerIds: [id], resolve: E1_DAT, llm: async () => ({ result: { property_type: "room" }, model: "m", tracePath: null }) });
    const ds = await theCua(c, id);
    assert.equal(ds.length, 2);
    assert.deepEqual(ds[1].evidence.doi_chieu?.map((d: { loai: string }) => d.loai), ["y_dinh", "gia"], "Focus 2: thẻ mới sau «Để sau» mất đối chiếu");
  });
});

// ---------- AC-8: trần, thử, cờ, thiếu khoá ----------
import { MockLanguageModelV4 } from "ai/test";
import { chayLenh, docCo, type Noi } from "../scripts/doc-toan-bo-s03.js";
import { coMauDat, demLuot, doMau, CO_DO_USD_NGAY } from "../src/enrich/doc-toan-bo.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { wilsonDuoi } from "../../pipeline/lib/eval-classify.mjs";

const noi = (c: pg.Client, o: Partial<Noi> = {}): Noi & { dong: string[] } => {
  const dong: string[] = [];
  return { client: c, khoa: "khoa-gia", resolve: E1_RONG, wilson: wilsonDuoi, log: (d) => dong.push(d), cam: [], dong, ...o };
};
const mauDat = (c: pg.Client) => c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test', 'doc-toan-bo:mau', $1)`, [{ prompt_version: PROMPT_VERSION, dat: true }]);
const BANG_THU = ["silver_labels", "enrichment_proposals", "review_queue", "ops_audit", "ai_calls", "field_assertions"];
const demBang = async (c: pg.Client) => Object.fromEntries(await Promise.all(BANG_THU.map(async (b) => [b, (await c.query(`SELECT count(*)::int AS n FROM ${b}`)).rows[0].n])));

test("LS1-AC-8 trần nhỏ: dừng trước bài vượt trần, in đã đọc, còn lại; chạy lại đọc tiếp, không đọc lại", async () => {
  await withTx(async (c) => {
    await nen(c);
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push(await moiTin(c, { id: `t_ls1_tran${i}`, text: `Bán căn số ${i} rộng rãi khu Minh Khai giá tốt` }));
    const goi: string[] = [];
    const n = noi(c, { hoi: hoiGia(() => traLoi({}), goi), chiTin: ids });
    await mauDat(c);
    const co = { ...docCo([]), tranUsd: 0.0025 };
    assert.equal(await chayLenh(co, n), 4, "LS1-AC-8 phải thoát 4 khi chạm trần");
    assert.equal(goi.length, 2, "LS1-AC-8 phải dừng trước bài vượt trần");
    assert.ok(n.dong.some((d) => d.includes("đã đọc 2") && d.includes("còn lại 3")), `LS1-AC-8 không in đã đọc, còn lại: ${n.dong}`);
    assert.equal(await chayLenh({ ...co, tranUsd: 3 }, n), 0);
    assert.equal(goi.length, 5, "LS1-AC-8 lượt sau phải đọc đúng phần còn lại");
    assert.equal(new Set(goi).size, 5, "LS1-AC-8 có bài bị đọc lại");
  });
});

test("LS1-AC-8 --thu không ghi dòng nào kể cả ai_calls; đối chứng: lượt thường có ghi", async () => {
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, { id: "t_ls1_thu", text: "Chính chủ bán căn hộ 2PN Times City giá 3 tỷ" });
    const tra = traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" });
    const model = new MockLanguageModelV4({ modelId: "mock", doGenerate: async () => ({
      content: [{ type: "text", text: tra }], finishReason: { unified: "stop", raw: "stop" },
      usage: { inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 1, text: 1, reasoning: undefined } }, warnings: [],
    }) } as never);
    const truoc = await demBang(c);
    const n = noi(c, { languageModel: model, chiTin: [id], khoa: undefined });
    assert.equal(await chayLenh({ ...docCo(["--thu"]) }, n), 0);
    assert.deepEqual(await demBang(c), truoc, "LS1-AC-8 --thu có ghi");
    assert.ok(n.dong.some((d) => d.includes("đã áp 1")), `LS1-AC-8 --thu phải báo số dự kiến: ${n.dong}`);
    assert.equal(await loaiHinh(c, id), "unknown");
    await mauDat(c);
    assert.equal(await chayLenh(docCo([]), noi(c, { hoi: hoiGia(() => tra), chiTin: [id] })), 0);
    assert.equal(await loaiHinh(c, id), "apartment", "LS1-AC-8 đối chứng: lượt thường phải ghi");
  });
});

test("LS1-AC-8 không cờ: trần 3 USD, 500 thẻ; cờ sai ném lỗi; thiếu khoá thoát 2 trước lời gọi đầu", async () => {
  const co = docCo([]);
  assert.deepEqual([co.tranUsd, co.tranThe, co.thu, co.mau], [3, 500, false, null], "LS1-AC-8 mặc định sai");
  assert.equal(docCo(["--tran-usd", "1"]).tranUsd, 1);
  assert.throws(() => docCo(["--tran-usd", "x"]), /--tran-usd/);
  assert.throws(() => docCo(["--mau", "10"]), /--mau và --nhan/);
  assert.ok(!("model" in co), "LS1-AC-8 không có cờ đổi model");
  await withTx(async (c) => {
    const n = noi(c, { khoa: undefined });
    assert.equal(await chayLenh(co, n), 2);
    assert.ok(n.dong.some((d) => d.includes("thiếu AI_GATEWAY_API_KEY")), "LS1-AC-8 phải nói rõ thiếu khoá");
  });
});

test("LS1-AC-8 vượt --tran-the: dừng tạo thẻ, báo, tin khác vẫn áp; lượt sau tạo tiếp", async () => {
  await withTx(async (c) => {
    await nen(c);
    const the = [await moiTin(c, { id: "t_ls1_the0", text: "Khách cần mua căn hộ 2PN khu Minh Khai số một" }), await moiTin(c, { id: "t_ls1_the1", text: "Khách cần mua căn hộ 2PN khu Minh Khai số hai" })];
    const ap = await moiTin(c, { id: "t_ls1_the2", text: "Chính chủ bán căn hộ 2PN khu Minh Khai giá 3 tỷ" });
    const hoi = hoiGia((chu) => chu.startsWith("Khách") ? traLoi({ intent: "inquiry", kind: null, quote: "cần mua căn hộ" }) : traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" }));
    await mauDat(c);
    const n = noi(c, { hoi, chiTin: [...the, ap] });
    assert.equal(await chayLenh({ ...docCo([]), tranThe: 1 }, n), 0);
    const co = await Promise.all(the.map(async (id) => (await theCua(c, id)).length));
    assert.equal(co[0] + co[1], 1, "LS1-AC-8 vượt trần vẫn tạo thẻ");
    assert.ok(n.dong.some((d) => d.includes("dừng tạo thẻ")), `LS1-AC-8 không báo trần thẻ: ${n.dong}`);
    assert.equal(await loaiHinh(c, ap), "apartment", "LS1-AC-8 tin không cần thẻ vẫn phải áp");
    await chayLenh({ ...docCo([]), tranThe: 5 }, n);
    assert.equal((await theCua(c, the[0])).length + (await theCua(c, the[1])).length, 2, "LS1-AC-8 lượt sau phải tạo nốt");
  });
});

// ---------- AC-9: đếm, cờ đỏ, hoàn tác ----------
/** Đếm độc lập với demLuot: duyệt từng dòng bằng JS. */
async function demTay(c: pg.Client) {
  const song = new Set<string>((await c.query(`SELECT offer_id FROM sale_offers WHERE source = 'S03' AND retired_at IS NULL`)).rows.map((r) => r.offer_id));
  const ds = (await c.query(`SELECT offer_id, status, source FROM enrichment_proposals`)).rows.filter((r) => song.has(r.offer_id));
  const tap = (f: (r: { status: string; source: string }) => boolean) => new Set(ds.filter(f).map((r) => r.offer_id)).size;
  return { mau: song.size, coDeXuat: tap((r) => r.status !== "skipped"), coDeXuatKeSkipped: tap(() => true), aiDaAp: tap((r) => r.source === "e2_llm" && r.status === "applied") };
}
export function kiemDem(d: Awaited<ReturnType<typeof demTay>>, tay: Awaited<ReturnType<typeof demTay>>) {
  for (const k of Object.keys(tay) as (keyof typeof tay)[]) assert.equal(d[k], tay[k], `LS1-AC-9 --dem sai số ${k}`);
}
test("LS1-AC-9 --dem khớp đếm độc lập, phân biệt skipped và đã áp; lùi cả lượt trả về unknown", async () => {
  await withTx(async (c) => {
    await nen(c);
    const ap = await moiTin(c, { id: "t_ls1_d_ap", text: "Chính chủ bán căn hộ 2PN khu Minh Khai giá 3 tỷ" });
    const bo = await moiTin(c, { id: "t_ls1_d_bo", text: "Cần bán gấp 2PN khu Minh Khai giá 3 tỷ nhé" });
    const rong = await moiTin(c, { id: "t_ls1_d_rong", text: "Bán căn khu Minh Khai không nói loại hình gì" });
    const s05 = await moiTin(c, { id: "t_ls1_d_s05", text: "Tin S05 đã có đề xuất không tính vào mẫu S03", source: "S05" });
    await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status) VALUES ('t', $1, 'property_type', 'land', 'land', 'e2_llm', 'review', 'queued')`, [s05]);
    const truoc = await demLuot(c);
    kiemDem(truoc, await demTay(c));
    const hoi = hoiGia((chu) => chu.includes("Chính chủ") ? traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" })
      : chu.includes("Cần bán") ? traLoi({ property_type: "apartment", quote_loai: "bán gấp 2PN" }) : traLoi({}));
    const kq = await chay(c, [ap, bo, rong, s05], hoi);
    assert.equal(kq.daAp, 1);
    const sau = await demLuot(c);
    kiemDem(sau, await demTay(c));
    assert.equal(sau.aiDaAp - truoc.aiDaAp, 1, "LS1-AC-9 AI đã áp phải tăng đúng một");
    assert.equal(sau.coDeXuat - truoc.coDeXuat, 1, "LS1-AC-9 skipped không tính vào có đề xuất");
    assert.equal(sau.coDeXuatKeSkipped - truoc.coDeXuatKeSkipped, 2, "LS1-AC-9 kể skipped phải tăng hai");
    assert.throws(() => kiemDem({ ...sau, coDeXuat: sau.coDeXuat + 1 }, { mau: sau.mau, coDeXuat: sau.coDeXuat, coDeXuatKeSkipped: sau.coDeXuatKeSkipped, aiDaAp: sau.aiDaAp }), /LS1-AC-9 --dem sai số coDeXuat/, "chiều đỏ đếm cả S05");
    // Dòng người vận hành đọc: mỗi số phải đúng ô, so với đếm độc lập.
    const tay = await demTay(c);
    const pt = (x: number) => `${x} (${(x / tay.mau * 100).toFixed(1)}%)`;
    const n = noi(c);
    await chayLenh(docCo(["--dem"]), n);
    assert.ok(n.dong.some((d) => d.startsWith(`mẫu (tin S03 sống): ${tay.mau} `)), `LS1-AC-9 --dem in sai mẫu: ${n.dong}`);
    const dong = `có đề xuất: ${pt(tay.coDeXuat)} · kể skipped: ${pt(tay.coDeXuatKeSkipped)} · AI đã áp: ${pt(tay.aiDaAp)}`;
    assert.ok(n.dong.includes(dong), `LS1-AC-9 --dem in sai ô, mong «${dong}»: ${n.dong}`);
  });
});

test("LS1-AC-9 cờ đỏ chi phí hai phía quanh 5 USD/ngày", async () => {
  await withTx(async (c) => {
    await nen(c);
    const dong = async (post: string, usd: number, ngay: string) => c.query(
      `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, json_ok, cost_usd, run_id, labeled_at)
       VALUES ('S03', $1, 'h', 'm', $2, 'offer', true, $3, 'r', $4)`, [post, PROMPT_VERSION, usd, ngay]);
    await dong("t_ls1_c1", CO_DO_USD_NGAY, "2099-01-01T01:00:00Z");
    await dong("t_ls1_c2", CO_DO_USD_NGAY + 0.01, "2099-01-02T01:00:00Z");
    const d = (await demLuot(c)).chiTheoNgay.filter((x) => x.ngay.startsWith("2099"));
    assert.deepEqual(d.map((x) => x.do), [false, true], "LS1-AC-9 cờ đỏ phải bật khi quá, không bật khi đúng bằng 5 USD");
    const n = noi(c);
    await chayLenh({ ...docCo(["--dem"]) }, n);
    const chi = (ngay: string) => n.dong.find((l) => l.startsWith(`chi ${ngay}`)) ?? "";
    assert.ok(chi("2099-01-02").includes("CỜ ĐỎ"), `LS1-AC-9 ngày quá 5 USD phải có cờ: ${n.dong}`);
    assert.ok(chi("2099-01-01") && !chi("2099-01-01").includes("CỜ ĐỎ"), `LS1-AC-9 ngày đúng 5 USD không được có cờ: ${n.dong}`);
  });
});

// ---------- AC-10: mẫu ----------
const baiMau = async (c: pg.Client, n: number, sai: number) => {
  const nhan: { post_id: string; property_type: string | null }[] = [];
  for (let i = 0; i < n; i++) {
    const post = `t_ls1_mau_${process.pid}_${++dem}`;
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi LS1', 'ls1', $3, '2026-10-31T08:00:00Z')`, [post, SNAP, `Chính chủ bán căn hộ 2PN mã ${post}`]);
    await insertOffer(c, { offer_id: `t_ls1_mo_${post}`, source: "S03", property_type: "unknown", street_raw: null, post_ids: [post] });
    nhan.push({ post_id: post, property_type: i < sai ? "house" : "apartment" });
  }
  return nhan;
};
/** Băm canonical và lớp đề xuất, thẻ: đo mẫu không được đổi dòng nào. */
const bamCanon = async (c: pg.Client) => (await c.query(`SELECT
  (SELECT md5(coalesce(string_agg(offer_id || '|' || property_type || '|' || coalesce(price_vnd::text, '') || '|' || coalesce(area_m2::text, ''), ',' ORDER BY offer_id), '')) FROM sale_offer_records) AS tin,
  (SELECT count(*) FROM enrichment_proposals) AS de_xuat, (SELECT count(*) FROM review_queue) AS the`)).rows[0];
const hoiCanHo = (goi: string[] = []) => hoiGia(() => traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" }), goi);

test("LS1-AC-10 mẫu đạt: Wilson khớp tính tay, in đủ số, ghi dòng mẫu, không chạm canonical; lượt thật dùng lại nhãn", async () => {
  await withTx(async (c) => {
    await nen(c);
    const nhan = await baiMau(c, 110, 2);
    const truoc = await bamCanon(c);
    const goi: string[] = [];
    const kq = await doMau({ client: c, runId: "m1", nhan, n: 110, nguong: 0.85, tranUsd: 3, thu: false, cam: [], hoi: hoiCanHo(goi), resolve: E1_RONG, wilson: wilsonDuoi });
    // Wilson 108/110, z=1,96 tính tay: 0,9360.
    assert.deepEqual([kq.n, kq.ap, kq.dung, kq.the, kq.dat], [110, 110, 108, 0, true]);
    assert.ok(Math.abs(kq.canDuoi! - 0.936) < 0.001, `LS1-AC-10 Wilson lệch tính tay: ${kq.canDuoi}`);
    assert.deepEqual(await bamCanon(c), truoc, "LS1-AC-10 mẫu đạt đổi canonical, đề xuất hoặc thẻ");
    // Đối chứng dương: phép băm thấy tin đổi.
    await c.query(`UPDATE sale_offers SET property_type = 'apartment' WHERE offer_id = $1`, [`t_ls1_mo_${nhan[0].post_id}`]);
    assert.notDeepEqual(await bamCanon(c), truoc, "LS1-AC-10 phép băm không thấy tin đổi");
    await c.query(`UPDATE sale_offers SET property_type = 'unknown' WHERE offer_id = $1`, [`t_ls1_mo_${nhan[0].post_id}`]);
    assert.equal(await coMauDat(c), true);
    assert.equal(goi.length, 110);
    await doMau({ client: c, runId: "m2", nhan, n: 110, nguong: 0.85, tranUsd: 3, thu: false, cam: [], hoi: hoiCanHo(goi), resolve: E1_RONG, wilson: wilsonDuoi });
    assert.equal(goi.length, 110, "LS1-AC-10 đo lại không được trả tiền hai lần");
  });
});

test("LS1-AC-10 mẫu đọc lại bài JSON hỏng: lượt hỏng không tính ca áp, lượt sau chỉ gọi đúng bài hỏng", async () => {
  await withTx(async (c) => {
    await nen(c);
    const nhan = await baiMau(c, 3, 0);
    const mot = (hoi: (chu: string) => Promise<Nhan>) => doMau({ client: c, runId: `m${++dem}`, nhan, n: 3, nguong: 0.85, tranUsd: 3, thu: false, cam: [], hoi, resolve: E1_RONG, wilson: wilsonDuoi });
    const goi: string[] = [];
    const hongCuoi = hoiGia((chu) => (chu.includes(nhan[2].post_id) ? "{\"intent\":\"off" : traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" })), goi);
    const dau = await mot(hongCuoi);
    assert.equal(dau.ap, 2, "bài hỏng không được tính là máy áp");
    assert.equal(goi.length, 3);
    const lai: string[] = [];
    const sau = await mot(hoiCanHo(lai));
    assert.equal(lai.length, 1, "chỉ bài hỏng được gọi lại");
    assert.ok(lai[0].includes(nhan[2].post_id));
    assert.equal(sau.ap, 3, "đọc lại được thì bài vào phép đo");
  });
});

test("LS1-AC-10 dưới ngưỡng và dưới 100 ca: thoát 5, không đạt; chưa có mẫu thì lượt thật thoát 6, có mẫu đạt thì chạy", async () => {
  const { writeFile, mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, { id: "t_ls1_m_tin", text: "Chính chủ bán căn hộ 2PN khu Minh Khai giá 3 tỷ" });
    const n6 = noi(c, { hoi: hoiCanHo(), chiTin: [id] });
    await c.query(`DELETE FROM ops_audit WHERE action = 'doc-toan-bo:mau'`);
    assert.equal(await chayLenh(docCo([]), n6), 6, "LS1-AC-10 chưa có mẫu phải từ chối");
    assert.ok(n6.dong.some((d) => d.includes("từ chối chạy thật")), `LS1-AC-10 thông điệp từ chối: ${n6.dong}`);
    assert.equal(await loaiHinh(c, id), "unknown");

    const tep = join(await mkdtemp(join(tmpdir(), "ls1-")), "nhan.json");
    const sai = await baiMau(c, 110, 30);
    await writeFile(tep, JSON.stringify(sai.map((x) => [x.post_id, { property_type: x.property_type }])));
    const n5 = noi(c, { hoi: hoiCanHo() });
    const banDuoi = await bamCanon(c);
    assert.equal(await chayLenh(docCo(["--mau", "110", "--nhan", tep]), n5), 5, "LS1-AC-10 dưới ngưỡng phải thoát 5");
    assert.ok(n5.dong.some((d) => d.includes("DƯỚI NGƯỠNG")), `LS1-AC-10: ${n5.dong}`);
    assert.equal(await coMauDat(c), false, "LS1-AC-10 mẫu rớt không được tính đạt");
    assert.deepEqual(await bamCanon(c), banDuoi, "LS1-AC-10 dưới ngưỡng đổi canonical, đề xuất hoặc thẻ");

    const it = await baiMau(c, 50, 0);
    await writeFile(tep, JSON.stringify(it.map((x) => [x.post_id, { property_type: x.property_type }])));
    assert.equal(await chayLenh(docCo(["--mau", "50", "--nhan", tep]), noi(c, { hoi: hoiCanHo() })), 5, "LS1-AC-10 dưới 100 ca phải thoát 5");

    const dat = await baiMau(c, 120, 0);
    await writeFile(tep, JSON.stringify(dat.map((x) => [x.post_id, { property_type: x.property_type }])));
    assert.equal(await chayLenh(docCo(["--mau", "120", "--nhan", tep]), noi(c, { hoi: hoiCanHo() })), 0);
    assert.equal(await chayLenh(docCo([]), noi(c, { hoi: hoiCanHo(), chiTin: [id] })), 0, "LS1-AC-10 có mẫu đạt phải chạy");
    assert.equal(await loaiHinh(c, id), "apartment");
  });
});

// ---------- AC-2 trên đường thật: chữ đến model do chính lệnh dựng, tên cấm đọc từ source_registry ----------
const LO_DB = ["0912.345.678", "khach@example.test", "https://nguon-gia.example/tin/1", "www.khac.example/x", "NguonGiaThat", "nguongia.vn", "Nhóm Giả Hà Nội"];
const DAU_BAI = "Bán căn hộ 2PN Times City.";
const DUOI_BAI = "Đuôi bài dài vẫn phải tới model.";
const BAI_DB = `${DAU_BAI} LH ${LO_DB[0]} hoặc ${LO_DB[1]}. Xem ${LO_DB[2]} ${LO_DB[3]}. Đăng ở ${LO_DB[4]} ${LO_DB[5]} trong ${LO_DB[6]}. ` + "Căn góc thoáng mát, nội thất đầy đủ. ".repeat(45) + DUOI_BAI;
export function kiemChuGui(goi: string[]) {
  assert.equal(goi.length, 1, "LS1-AC-2 phải đúng một lời gọi");
  assert.ok(goi[0].length > 500 && goi[0].includes(DUOI_BAI), "LS1-AC-2 chữ gửi đi bị cắt");
  assert.ok(goi[0].includes(DAU_BAI), "LS1-AC-2 đối chứng dương: chữ thường phải còn");
  for (const lo of LO_DB) assert.ok(!goi[0].includes(lo), `LS1-AC-2 chữ đến model còn chuỗi lộ: ${lo}`);
}
test("LS1-AC-2 chayLuot và doMau: chữ gửi đi đã gạt SĐT, email, link, tên nhóm, tên nguồn trong source_registry", async () => {
  assert.ok(BAI_DB.length >= 1500);
  await withTx(async (c) => {
    await nen(c);
    await c.query(`INSERT INTO source_registry (code, real_name, label_vi, source_ids) VALUES ('S98', $1, 'nguồn thử', $2)`, [LO_DB[4], [LO_DB[5]]]);
    const id = await moiTin(c, { id: "t_ls1_gat", text: BAI_DB, nhom: LO_DB[6] });
    const goi: string[] = [];
    await chay(c, [id], hoiGia(() => traLoi({}), goi), { cam: undefined });
    kiemChuGui(goi);
    const post = (await c.query(`SELECT post_ids[1] AS p FROM sale_offers WHERE offer_id = $1`, [id])).rows[0].p;
    await c.query(`DELETE FROM silver_labels WHERE post_id = $1`, [post]);
    const goiMau: string[] = [];
    await doMau({ client: c, runId: "m-gat", nhan: [{ post_id: post, property_type: "apartment" }], n: 1, nguong: 0.85, tranUsd: 3, thu: false, hoi: hoiGia(() => traLoi({}), goiMau), resolve: E1_RONG, wilson: wilsonDuoi });
    kiemChuGui(goiMau);
  });
});
test("chiều đỏ LS1-AC-2: chữ chưa gạt thì phép đo báo chuỗi lộ", () => {
  assert.throws(() => kiemChuGui([BAI_DB]), /LS1-AC-2 chữ đến model còn chuỗi lộ/);
});

test("LS1-AC-5 not_listing kèm trích có thật qua lượt thật: thẻ mang câu trích, tin không nghỉ", async () => {
  await withTx(async (c) => {
    await nen(c);
    const id = await moiTin(c, { id: "t_ls1_nl", text: "Mọi người ơi cho hỏi thủ tục sang tên nhà thế nào", property_type: "house" });
    await chay(c, [id], hoiGia(() => traLoi({ intent: "not_listing", kind: null, quote: "cho hỏi thủ tục" })));
    const [the] = await theCua(c, id);
    assert.deepEqual(the?.evidence.doi_chieu, [{ loai: "y_dinh", trich: "cho hỏi thủ tục", ai: "not_listing", bo_doc: "offer" }]);
    assert.equal((await c.query(`SELECT retired_at FROM sale_offers WHERE offer_id = $1`, [id])).rows[0].retired_at, null, "LS1-AC-5 tin bị nghỉ");
  });
});

test("LS1-AC-9 lùi cả lượt: id lấy theo run_id --dem in ra, mọi tin của lượt về unknown, lượt khác giữ nguyên", async () => {
  await withTx(async (c) => {
    await nen(c);
    const hoi = hoiGia(() => traLoi({ property_type: "apartment", quote_loai: "bán căn hộ 2PN" }));
    const CHU = "Chính chủ bán căn hộ 2PN khu Minh Khai mã";
    const a = await moiTin(c, { id: "t_ls1_l_a", text: `${CHU} A` });
    const b = await moiTin(c, { id: "t_ls1_l_b", text: `${CHU} B` });
    const giu = await moiTin(c, { id: "t_ls1_l_giu", text: `${CHU} C` });
    const RUN = "doc-toan-bo-t-lui";
    assert.equal((await chay(c, [a, b], hoi, { runId: RUN })).daAp, 2);
    await chay(c, [giu], hoi, { runId: "doc-toan-bo-t-giu" });
    const n = noi(c);
    await chayLenh(docCo(["--dem"]), n);
    assert.ok(n.dong.some((d) => d.startsWith("run_id để hoàn tác:") && d.includes(RUN)), `LS1-AC-9 --dem phải in run_id: ${n.dong}`);
    const ids = (await c.query(`SELECT id FROM enrichment_proposals WHERE run_id = $1 AND status = 'applied'`, [RUN])).rows.map((r) => r.id);
    assert.equal(ids.length, 2);
    await c.query(`SELECT revert_enrichment($1, $2, $3)`, [ids, "hitl:test", "lùi cả lượt"]);
    assert.deepEqual([await loaiHinh(c, a), await loaiHinh(c, b), await loaiHinh(c, giu)], ["unknown", "unknown", "apartment"], "LS1-AC-9 lùi lượt sai tin");
  });
});
