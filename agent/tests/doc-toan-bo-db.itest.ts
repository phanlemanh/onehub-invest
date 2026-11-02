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

type Tin = { id: string; text: string | null; source?: string; property_type?: string; price?: number | null; area?: number | null; kind?: string; confidence?: string; street?: string };

async function nen(c: pg.Client) {
  await c.query(await readFile(MIG_065, "utf8"));
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
}
async function moiTin(c: pg.Client, t: Tin): Promise<string> {
  const post = `t_ls1_p_${process.pid}_${++dem}`;
  if (t.text !== null) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi LS1', 'ls1', $3, '2026-10-31T08:00:00Z')`, [post, SNAP, t.text]);
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

test("LS1-AC-4 hỏng JSON: không đề xuất, không thẻ, đánh dấu đã xử; tin đã có loại hình không đổi", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = await moiTin(c, { id: "t_ls1_hong", text: "Bán căn gì đó không rõ loại hình nhé" });
    const goi: string[] = [];
    await chay(c, [a], hoiGia(() => "không phải json", goi));
    assert.equal((await deXuat(c, a)).length, 0);
    assert.equal(await loaiHinh(c, a), "unknown");
    await chay(c, [a], hoiGia(() => "không phải json", goi));
    assert.equal(goi.length, 1, "LS1-AC-4 JSON hỏng không gọi lại");
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
    assert.deepEqual(the[0].evidence.doi_chieu.map((d: { loai: string }) => d.loai), ["y_dinh", "gia"]);
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
