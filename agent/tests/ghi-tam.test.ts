// ghi-tam.test.ts — NB10 `ghi-tam-do-sau-co-han`, AC-1…AC-9 (E1–E9). Ca DB chạy trong withTx (BEGIN…ROLLBACK, helper nạp
// migration 129); model và E1 giả lập. Mỗi ca ghim thông điệp có mã AC để probe đột biến (probes/dot-bien.mjs) đọc được.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type pg from "pg";

import type { ContextResult } from "../src/agents/context-resolver.js";
import { buildEnrichInput, type EnrichResult } from "../src/agents/enrich-text.js";
import type { Nhan } from "../src/agents/nhan-bac-s03.js";
import { chayLuot, docTraLoi } from "../src/enrich/doc-toan-bo.js";
import { DAU_DAP_AN_LUAT, phieuDocLap } from "../src/enrich/ghi-tam/doc-lap.js";
import { HAN_DO_BU_NGAY, NAC_GHI_TAM } from "../src/enrich/ghi-tam/lo.js";
import { routeFields, type Routed } from "../src/enrich/route.js";
import { congGhiTam, runEnrich, type LlmFn, type ResolveFn } from "../src/enrich/run.js";
import { dongTongKetLuot } from "../src/enrich/tong-ket.js";
import { insertOffer, withTx } from "./helpers/db.js";

const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType: null,
  buildingHint: null, areaHint: null, matchedBy: "group_name", ...o,
});
const resolveWith = (o: Partial<ContextResult> = {}): ResolveFn => async () => ctx(o);
const kq = (o: Partial<EnrichResult>): EnrichResult => ({ confidence: 0.9, ...o });
/** Model giả lập trả `r` và báo đúng lời nhắc đã gửi — mặc định là lời nhắc thật của buildEnrichInput. */
const llmPrompt = (r: EnrichResult, prompt?: (text: string, c: ContextResult) => string): LlmFn =>
  async (text, c) => ({ result: r, model: "gia-lap", tracePath: null, prompt: (prompt ?? buildEnrichInput)(text, c) });

let seq = 0;
async function tin(c: pg.Client, o: { property_type?: string | null; block_raw?: string | null } = {}) {
  const id = `t_nb10_${process.pid}_${++seq}`;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
                 ON CONFLICT (snapshot_id) DO NOTHING`);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, 'Nhóm thử')`,
    [`p_${id}`, "Bán căn 2pn tầng trung, sẵn sổ, giá thương lượng"]);
  await insertOffer(c, { offer_id: id, post_ids: [`p_${id}`], property_type: o.property_type ?? "unknown", bedrooms: 2, block_raw: o.block_raw ?? null });
  return id;
}
const dongTin = async (c: pg.Client, id: string) =>
  (await c.query(`SELECT property_type, block_raw FROM sale_offers WHERE offer_id = $1`, [id])).rows[0];
const deXuat = async (c: pg.Client, id: string, field: string) =>
  (await c.query(`SELECT * FROM enrichment_proposals WHERE offer_id = $1 AND field = $2 ORDER BY id`, [id, field])).rows;
const lo = async (c: pg.Client, ma: string) => (await c.query(`SELECT *, han_do_bu::text AS han FROM ghi_tam_lo WHERE ma = $1`, [ma])).rows[0];
const LBV = [{ slug: "gpk-lumiere-boulevard", name: "Lumiere Boulevard", aliases: ["lbv"] }];
const chay = (c: pg.Client, runId: string, ids: string[], llm: LlmFn, resolve: ResolveFn, buildings = LBV) =>
  runEnrich({ client: c, runId, dry: false, limit: 50, offerIds: ids, llm, resolve, buildings });

// ---------- AC-1 ----------
const NHAN_LUAT = ["Loại hình từ nhóm", "Mã tòa phát hiện"];
test("E1 AC-1 lời nhắc không mang loại hình và mã toà của luật, vẫn mang dự án, ứng viên, khu vực (ma trận 2 × 2)", () => {
  for (const coLoai of [true, false]) {
    for (const coToa of [true, false]) {
      const o = `ô loại=${coLoai} toà=${coToa}`;
      const p = buildEnrichInput("Bán căn 2pn", ctx({
        projectName: "Vinhomes Ocean Park", projectCandidates: ["Ocean Park 2", "Ocean Park 3"], areaHint: "Gia Lâm",
        propertyType: coLoai ? "townhouse" : null, buildingHint: coToa ? "S2.05" : null,
      }));
      for (const n of NHAN_LUAT) assert.ok(!p.includes(n), `AC-1 ${o}: lời nhắc còn dòng «${n}»`);
      if (coLoai) assert.ok(!p.includes("townhouse"), `AC-1 ${o}: lời nhắc còn giá trị loại hình của luật`);
      if (coToa) assert.ok(!p.includes("S2.05"), `AC-1 ${o}: lời nhắc còn mã toà của luật`);
      for (const giu of ["Vinhomes Ocean Park", "Ocean Park 2", "Gia Lâm"]) assert.ok(p.includes(giu), `AC-1 ${o}: lời nhắc mất «${giu}»`);
    }
  }
});

test("E1 AC-1 phieuDocLap: lời nhắc thật độc lập; mỗi dấu đáp án của luật, lời nhắc rỗng hay vắng thì không", () => {
  assert.equal(phieuDocLap(buildEnrichInput("Bán căn", ctx({ propertyType: "apartment", buildingHint: "LBV" }))), true, "AC-2 lời nhắc thật phải độc lập");
  for (const d of DAU_DAP_AN_LUAT) assert.equal(phieuDocLap(`TIN ĐĂNG:\nx\n- ${d.toUpperCase()}: y`), false, `AC-2 dấu «${d}» lọt qua`);
  assert.equal(phieuDocLap(""), false, "AC-2 lời nhắc rỗng tính là độc lập");
  assert.equal(phieuDocLap(undefined), false, "AC-2 lời nhắc vắng tính là độc lập");
});

// ---------- AC-2 ----------
test("E2 AC-2 lời nhắc mang đáp án hay danh sách toà: không phải phiếu hai, lên thẻ; lời nhắc sạch thì ghi tạm", async () => {
  await withTx(async (c) => {
    const [a, b, cc] = [await tin(c), await tin(c), await tin(c, { property_type: "apartment" })];
    const runId = `enrich-nb10-e2-${seq}`;
    await chay(c, runId, [a], llmPrompt(kq({ property_type: "apartment" })), resolveWith({ propertyType: "apartment" }));
    await chay(c, runId, [b], llmPrompt(kq({ property_type: "apartment" }), (t) => `TIN ĐĂNG:\n${t}\n- Loại hình từ nhóm: apartment`),
      resolveWith({ propertyType: "apartment" }));
    await chay(c, runId, [cc], llmPrompt(kq({ building: "LBV" }), (t) => `TIN ĐĂNG:\n${t}\n- Danh sách toà của dự án: Lumiere Boulevard, Masteri`),
      resolveWith());
    const [pa] = await deXuat(c, a, "property_type");
    assert.deepEqual([pa.route, pa.status, pa.ghi_tam, pa.evidence.doc_lap], ["corroborated", "applied", true, true], "AC-2 tin A (lời nhắc sạch) phải ghi tạm");
    assert.ok(pa.lo_id, "AC-2 tin A thiếu lô");
    const [pb] = await deXuat(c, b, "property_type");
    assert.deepEqual([pb.route, pb.status, pb.evidence.doc_lap, pb.evidence.trung_luat, pb.lo_id],
      ["review", "queued", false, "e1", null], `AC-2 tin B (lời nhắc mang đáp án) route ${pb.route}`);
    assert.equal((await dongTin(c, b)).property_type, "unknown", "AC-2 tin B ô bị đổi");
    const [pc] = await deXuat(c, cc, "block_raw");
    assert.deepEqual([pc.route, pc.status, pc.evidence.doc_lap], ["review", "queued", false], `AC-2 tin C (danh sách toà) route ${pc.route}`);
    assert.equal((await dongTin(c, cc)).block_raw, null, "AC-2 tin C ô toà bị đổi");
  });
});

// ---------- AC-3 ----------
test("E3 AC-3 lượt đêm ghi ba giá trị: đúng hai lô theo trường, mỗi giá trị có lô và cờ, không đề xuất nào thiếu lô", async () => {
  await withTx(async (c) => {
    const [a, b, cc] = [await tin(c), await tin(c), await tin(c, { property_type: "apartment" })];
    const runId = `enrich-nb10-e3-${seq}`;
    const r = await chay(c, runId, [a, b], llmPrompt(kq({ property_type: "apartment" })), resolveWith({ propertyType: "apartment" }));
    const r2 = await chay(c, runId, [cc], llmPrompt(kq({ building: "LBV" })), resolveWith());
    const { rows: los } = await c.query(`SELECT *, han_do_bu::text AS han, (han_do_bu - mo_luc::date) AS ngay FROM ghi_tam_lo WHERE nguon_luot = $1 ORDER BY ma`, [runId]);
    assert.deepEqual(los.map((l) => [l.ma, l.field, l.ghi_boi, l.model, l.nac, l.ngay, l.doc_lap, l.trang_thai]), [
      [`${runId}:block_raw`, "block_raw", `enrich-run:${runId}`, "gia-lap", NAC_GHI_TAM, HAN_DO_BU_NGAY, true, "dang-ghi"],
      [`${runId}:property_type`, "property_type", `enrich-run:${runId}`, "gia-lap", NAC_GHI_TAM, HAN_DO_BU_NGAY, true, "dang-ghi"],
    ], "AC-3 lô của lượt lệch");
    const { rows: [d] } = await c.query(`SELECT count(*) FILTER (WHERE lo_id IS NULL)::int AS thieu, count(*)::int AS tong,
        count(*) FILTER (WHERE ghi_tam)::int AS co FROM enrichment_proposals
       WHERE run_id = $1 AND status = 'applied' AND route = 'corroborated'`, [runId]);
    assert.deepEqual([d.tong, d.thieu, d.co], [3, 0, 3], "AC-3 đề xuất corroborated thiếu lô hoặc thiếu cờ");
    assert.deepEqual([r.ghiTam.lo, r2.ghiTam.lo], [[`${runId}:property_type`], [`${runId}:block_raw`]], "AC-3 kết quả lượt không báo lô");
  });
});

const SNAP_DTB = "hanoi__zalo-agent__2099-11-26T000000";
const traLoiDoc = (o: Record<string, unknown>) => JSON.stringify({ intent: "offer", kind: "sale", confidence: 0.9, quote: "", property_type: null, quote_loai: "", price_vnd: null, quote_gia: "", area_m2: null, quote_dt: "", bedrooms: null, bathrooms: null, street: null, block: null, ...o });
test("E3 AC-3 lượt đọc toàn bộ: giá trị tự ghi có lô <run_id>:property_type, độc lập, cờ ghi tạm", async () => {
  await withTx(async (c) => {
    await c.query(await readFile(join(import.meta.dirname, "../../db/migrations/065_silver_labels.sql"), "utf8"));
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP_DTB]);
    const post = `t_nb10_dtb_${process.pid}`;
    const chu = "Chính chủ bán căn hộ 2PN Times City giá 3 tỷ";
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm NB10', 'nb10', $3, '2026-11-26T08:00:00Z')`, [post, SNAP_DTB, chu]);
    const id = `t_nb10_dtb_${process.pid}`;
    await insertOffer(c, { offer_id: id, property_type: "unknown", post_ids: [post] });
    const hoi = async (ch: string): Promise<Nhan> => {
      const p = docTraLoi(traLoiDoc({ quote: "Chính chủ bán", property_type: "apartment", quote_loai: "bán căn hộ 2PN" }), ch);
      return { model: "gateway:anthropic/claude-haiku-5.5", ...p, error_kind: null, latency_ms: 1, cost_usd: 0.001 };
    };
    const runId = `nb10-dtb-${seq}`;
    await chayLuot({ client: c, runId, tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin: [id], hoi, resolve: async () => ctx({ matchedBy: "" }) });
    const [d] = await deXuat(c, id, "property_type");
    assert.deepEqual([d.route, d.status, d.lo_id, d.ghi_tam], ["corroborated", "applied", `${runId}:property_type`, true], "AC-3 đọc toàn bộ áp mà thiếu lô");
    assert.equal((await lo(c, `${runId}:property_type`)).doc_lap, true, "AC-3 lô đọc toàn bộ phải độc lập");
  });
});

// ---------- AC-5, AC-7 (hàm SQL mà lệnh rut-lo-ghi-tam.mjs gọi) ----------
async function loBa(c: pg.Client, runId: string) {
  const [a, b] = [await tin(c), await tin(c, { property_type: "apartment" })];
  await chay(c, runId, [a], llmPrompt(kq({ property_type: "house", building: "LBV" })), resolveWith({ propertyType: "house" }));
  await chay(c, runId, [b], llmPrompt(kq({ building: "LBV" })), resolveWith());
  return { a, b };
}
test("E5 AC-5 rút cả lô: tin và đề xuất về như trước, lô da-rut, chạy lại 0; actor không phải người hay thiếu lý do thì từ chối", async () => {
  await withTx(async (c) => {
    const runId = `enrich-nb10-e5-${seq}`;
    const { a, b } = await loBa(c, runId);
    const ma = `${runId}:block_raw`;
    const truoc = await c.query(`SELECT count(*)::int AS n FROM enrichment_proposals WHERE lo_id = $1 AND status = 'applied'`, [ma]);
    assert.equal(truoc.rows[0].n, 2, "AC-5 tiền đề: lô toà có 2 giá trị");
    for (const [actor, lyDo, mau] of [["may:khac", "x", /chỉ người/], ["hitl:thu", "", /thiếu lý do/]] as const) {
      await c.query("SAVEPOINT s");
      await assert.rejects(c.query(`SELECT rut_lo_ghi_tam($1, $2, $3, false)`, [ma, actor, lyDo]), mau, `AC-5 actor ${actor} lý do «${lyDo}» không bị từ chối`);
      await c.query("ROLLBACK TO SAVEPOINT s");
    }
    const { rows: [r] } = await c.query(`SELECT rut_lo_ghi_tam($1, 'hitl:thu', 'thu rut', false) AS n`, [ma]);
    assert.equal(r.n, 2, "AC-5 số giá trị rút");
    assert.equal((await dongTin(c, a)).block_raw, null, "AC-5 tin A ô toà chưa về như trước");
    assert.equal((await dongTin(c, b)).block_raw, null, "AC-5 tin B ô toà chưa về như trước");
    assert.equal((await dongTin(c, a)).property_type, "house", "AC-5 rút lô toà làm đổi loại hình — rút ngoài lô");
    assert.deepEqual((await deXuat(c, a, "block_raw")).map((p) => p.status), ["reverted"], "AC-5 đề xuất chưa reverted");
    assert.equal((await lo(c, ma)).trang_thai, "da-rut");
    const { rows: [r2] } = await c.query(`SELECT rut_lo_ghi_tam($1, 'hitl:thu', 'thu rut', false) AS n`, [ma]);
    assert.equal(r2.n, 0, "AC-5 chạy lại phải 0");
    assert.equal((await c.query(`SELECT dung FROM ghi_tam_o WHERE field = 'block_raw'`)).rows[0]?.dung ?? false, false, "AC-5 người rút tay không dừng ô");
  });
});

test("E7 AC-7 kết quả đo bù: không đạt → rút + dừng ô; đạt → thôi cờ, không rút; actor máy không rút được đề xuất ngoài lô", async () => {
  await withTx(async (c) => {
    const runId = `enrich-nb10-e7-${seq}`;
    const { a } = await loBa(c, runId);
    await c.query(`SELECT ghi_ket_qua_do_bu($1, 'khong-dat', 'hitl:thu')`, [`${runId}:block_raw`]);
    assert.equal((await lo(c, `${runId}:block_raw`)).trang_thai, "da-rut", "AC-7 lô không đạt chưa rút");
    assert.equal((await c.query(`SELECT dung FROM ghi_tam_o WHERE field = 'block_raw'`)).rows[0]?.dung, true, "AC-7 ô toà chưa dừng");
    await c.query(`SELECT ghi_ket_qua_do_bu($1, 'dat', 'hitl:thu')`, [`${runId}:property_type`]);
    const l = await lo(c, `${runId}:property_type`);
    assert.deepEqual([l.trang_thai, l.ket_qua_do_bu], ["dat", "dat"]);
    assert.deepEqual((await deXuat(c, a, "property_type")).map((p) => [p.status, p.ghi_tam]), [["applied", false]], "AC-7 lô đạt mà giá trị còn cờ hoặc bị rút");
    // Đề xuất không thuộc lô ghi tạm (E1 direct) — actor máy bị từ chối.
    const d = await tin(c);
    await chay(c, `${runId}-d`, [d], llmPrompt(kq({})), resolveWith({ propertyType: "apartment" }));
    const [pd] = await deXuat(c, d, "property_type");
    assert.equal(pd.route, "direct");
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`SELECT revert_enrichment(ARRAY[$1::bigint], 'may:ghi-tam:het-han', 'x')`, [pd.id]), /chỉ cho đề xuất thuộc lô ghi tạm/,
      "AC-7 actor máy rút được đề xuất ngoài lô");
    await c.query("ROLLBACK TO SAVEPOINT s");
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`SELECT ghi_ket_qua_do_bu($1, 'dat', 'may:ghi-tam:x')`, [`${runId}:property_type`]), /chỉ người/, "AC-7 máy ghi được kết quả đo bù");
    await c.query("ROLLBACK TO SAVEPOINT s");
  });
});

// ---------- AC-6 ----------
test("E6 AC-6 lô quá hạn: lượt kế không ghi trường đó, báo tên lô, rút bằng actor máy, ô dừng; trường khác vẫn ghi", async () => {
  await withTx(async (c) => {
    const runId = `enrich-nb10-e6-${seq}`;
    await loBa(c, runId);
    await c.query(`UPDATE ghi_tam_lo SET han_do_bu = current_date - 1 WHERE ma = $1`, [`${runId}:property_type`]);
    const t2 = await tin(c);
    const r = await chay(c, `${runId}-ke`, [t2], llmPrompt(kq({ property_type: "apartment", building: "LBV" })), resolveWith({ propertyType: "apartment" }));
    assert.deepEqual(r.ghiTam.hetHan.map((h) => [h.ma, h.field]), [[`${runId}:property_type`, "property_type"]], "AC-6 lượt kế không rút lô quá hạn");
    const lq = await lo(c, `${runId}:property_type`);
    assert.equal(lq.trang_thai, "da-rut");
    const { rows: [rv] } = await c.query(`SELECT DISTINCT reverted_by FROM enrichment_proposals WHERE lo_id = $1`, [`${runId}:property_type`]);
    assert.equal(rv.reverted_by, "may:ghi-tam:het-han");
    assert.deepEqual((await deXuat(c, t2, "property_type")).map((p) => [p.route, p.status, p.evidence.ly_do_khong_ghi]),
      [["review", "queued", "o-dung"]], "AC-6 lô quá hạn vẫn ghi thêm loại hình");
    assert.deepEqual((await deXuat(c, t2, "block_raw")).map((p) => [p.route, p.status, p.ghi_tam]), [["corroborated", "applied", true]], "AC-6 trường khác không được ghi");
    const inRa = dongTongKetLuot(r.dem, r.chuyenThe, r.ghiTam);
    assert.ok(inRa.some((l) => l.includes(`lô ${runId}:property_type quá hạn đo bù`)), `AC-6 tổng kết không báo tên lô: ${inRa.join(" / ")}`);
    const t3 = await tin(c);
    await chay(c, `${runId}-ba`, [t3], llmPrompt(kq({ property_type: "apartment" })), resolveWith({ propertyType: "apartment" }));
    assert.equal((await deXuat(c, t3, "property_type"))[0].status, "queued", "AC-6 lượt thứ ba vẫn ghi loại hình khi ô dừng");
  });
});

test("E6 AC-6 xét hạn không cần lượt: xet_han_ghi_tam rút lô quá hạn, lô còn hạn giữ nguyên", async () => {
  await withTx(async (c) => {
    const runId = `enrich-nb10-e6b-${seq}`;
    await loBa(c, runId);
    await c.query(`UPDATE ghi_tam_lo SET han_do_bu = current_date - 1 WHERE ma = $1`, [`${runId}:block_raw`]);
    const { rows } = await c.query(`SELECT ma FROM xet_han_ghi_tam() WHERE ma LIKE $1`, [`${runId}%`]);
    assert.deepEqual(rows.map((x) => x.ma), [`${runId}:block_raw`], "AC-6 xét hạn độc lập không rút đúng lô");
    assert.equal((await lo(c, `${runId}:property_type`)).trang_thai, "dang-ghi", "AC-6 lô còn hạn bị đổi");
  });
});

const MIG_DIR = join(import.meta.dirname, "../../db/migrations");
/** Thân revert_enrichment bản 066 nguyên văn — giả lập ngày 066 được áp lên máy thu SAU 129. */
async function revert066(): Promise<string> {
  const t = await readFile(join(MIG_DIR, "066_can_theo_tin.sql"), "utf8");
  const i = t.indexOf("CREATE OR REPLACE FUNCTION revert_enrichment");
  return t.slice(i, t.indexOf("$$;", t.indexOf("AS $$", i)) + 3);
}
test("E6 AC-6 bẫy thứ tự 066: áp 066 sau 129 làm mất bản vá → rút bằng actor máy bị từ chối nguyên khối, lượt báo lỗi và vẫn dừng trường; chạy lại 129 thì rút được", async () => {
  await withTx(async (c) => {
    const runId = `enrich-nb10-e6c-${seq}`;
    await loBa(c, runId);
    const ma = `${runId}:block_raw`;
    await c.query(`UPDATE ghi_tam_lo SET han_do_bu = current_date - 1 WHERE ma = $1`, [ma]);
    await c.query(await revert066());
    const vaCon = async () => (await c.query(`SELECT prosrc ~ '129 \\(NB10 Hỏi-4\\)' AS co FROM pg_proc WHERE proname = 'revert_enrichment'`)).rows[0].co;
    assert.equal(await vaCon(), false, "AC-6 tiền đề: nạp 066 phải làm mất bản vá 129");
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`SELECT * FROM xet_han_ghi_tam()`), /chỉ người được hoàn tác/, "AC-6 mất bản vá mà actor máy vẫn rút được");
    await c.query("ROLLBACK TO SAVEPOINT s");
    assert.equal((await lo(c, ma)).trang_thai, "dang-ghi", "AC-6 rút nửa chừng khi bị từ chối");
    assert.equal(Number((await c.query(`SELECT count(*) FROM enrichment_proposals WHERE lo_id = $1 AND status = 'applied'`, [ma])).rows[0].count), 2,
      "AC-6 giá trị của lô bị đổi khi lệnh rút bị từ chối");
    const t2 = await tin(c, { property_type: "apartment" });
    const r = await chay(c, `${runId}-ke`, [t2], llmPrompt(kq({ building: "LBV" })), resolveWith());
    assert.match(r.ghiTam.loiXetHan ?? "", /chỉ người được hoàn tác/, "AC-6 lượt không báo lệnh rút bị từ chối");
    assert.ok(dongTongKetLuot(r.dem, r.chuyenThe, r.ghiTam).some((l) => l.startsWith("✗ xét hạn ghi tạm bị từ chối")), "AC-6 tổng kết im lặng khi rút bị từ chối");
    assert.deepEqual((await deXuat(c, t2, "block_raw")).map((p) => [p.route, p.status]), [["review", "queued"]], "AC-6 trường quá hạn vẫn ghi khi rút bị từ chối");
    await c.query(await readFile(join(MIG_DIR, "129_ghi_tam_lo.sql"), "utf8"));
    assert.equal(await vaCon(), true, "AC-6 chạy lại 129 không phục hồi bản vá");
    assert.deepEqual((await c.query(`SELECT ma FROM xet_han_ghi_tam() WHERE ma = $1`, [ma])).rows.map((x) => x.ma), [ma], "AC-6 sau khi vá lại vẫn không rút được");
  });
});

// ---------- AC-8 ----------
test("E8 AC-8 loại hình ghi tạm không làm căn lên B3; lô đạt thì lên; bậc tin không đổi", async () => {
  await withTx(async (c) => {
    const runId = `enrich-nb10-e8-${seq}`;
    const a = await tin(c);
    await chay(c, runId, [a], llmPrompt(kq({ property_type: "apartment" })), resolveWith({ propertyType: "apartment" }));
    const nut = (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
      VALUES ('project', 'NB10 DA', 'nb10-da-${seq}', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`)).rows[0].id;
    const bld = `bld_${String(1000 + seq).padStart(26, "0")}`;
    const can = `unt_${String(1000 + seq).padStart(26, "0")}`;
    await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
      VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [bld, nut]);
    await c.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, '10', $1, 'xac_minh')`, [can, bld]);
    // Khu vực có thật của DB (khoá ngoại sale_offers_area_id_fkey); DB trống của CI thì gieo một khu trong giao dịch.
    const { rows: [kv] } = await c.query(`SELECT id FROM areas ORDER BY id LIMIT 1`);
    const khu = kv?.id ?? (await c.query(`INSERT INTO areas (id, region_type, name, country_code) VALUES ('vn-nb10-thu', 'submarket', 'NB10 thử', 'VN') RETURNING id`)).rows[0].id;
    await c.query(`UPDATE sale_offer_records SET price_vnd = 3000000000, area_m2 = 70, area_id = $2, kind = 'sale' WHERE offer_id = $1`, [a, khu]);
    await c.query(`CREATE OR REPLACE FUNCTION offer_unit_key(p_offer_id text) RETURNS text LANGUAGE sql STABLE AS
      $f$ SELECT CASE WHEN p_offer_id = '${a}' THEN '${can}' END $f$`);
    const bac = async () => (await c.query(`SELECT data_level FROM unit_data_level() WHERE unit_key = $1`, [can])).rows[0]?.data_level ?? null;
    assert.equal(await bac(), null, "AC-8 căn lên bậc nhờ loại hình ghi tạm");
    await c.query(`SELECT ghi_ket_qua_do_bu($1, 'dat', 'hitl:thu')`, [`${runId}:property_type`]);
    assert.ok(["B3", "B4", "B5"].includes(await bac() ?? ""), "AC-8 lô đạt mà căn không lên B3");
  });
});

// ---------- AC-9 ----------
const c1 = (o: Partial<Routed>): Routed => ({ field: "property_type", value: "apartment", source: "e2_llm", route: "corroborated", corroboratedBy: "e1", ...o });
test("E9 AC-9 cổng ghi tạm chỉ đổi nhánh corroborated; mọi nhánh khác của routeFields giữ nguyên", () => {
  const b = [{ slug: "lbv", name: "Lumiere Boulevard", aliases: ["lbv"] }];
  const ma: [string, Parameters<typeof routeFields>[0], string[]][] = [
    ["fill-gap", { current: { property_type: "apartment" }, e1: { property_type: "house" }, llm: { property_type: "house" }, buildings: b }, []],
    ["E1 một mình", { current: {}, e1: { property_type: "apartment" }, llm: null, buildings: b }, ["property_type:direct"]],
    ["E1=LLM", { current: {}, e1: { property_type: "apartment" }, llm: { property_type: "apartment" }, buildings: b }, ["property_type:corroborated"]],
    ["E1≠LLM", { current: {}, e1: { property_type: "apartment" }, llm: { property_type: "house" }, buildings: b }, ["property_type:review", "property_type:review"]],
    ["field giữ", { current: {}, e1: { property_type: "apartment" }, llm: { property_type: "apartment" }, buildings: b, held: new Set(["property_type" as const]) }, ["property_type:review", "property_type:review"]],
    ["LLM khớp danh bạ", { current: {}, e1: {}, llm: { block_raw: "LBV" }, buildings: b }, ["block_raw:corroborated"]],
    ["LLM không căn cứ", { current: {}, e1: {}, llm: { street_raw: "Minh Khai" }, buildings: b }, ["street_raw:review"]],
  ];
  for (const [ten, vao, mong] of ma) {
    const goc = routeFields(vao).filter((r) => r.field === "property_type" || r.field === "block_raw" || r.field === "street_raw");
    assert.deepEqual(goc.map((r) => `${r.field}:${r.route}`), mong, `AC-9 routeFields đổi ở ô ${ten}`);
    const mo = congGhiTam(goc, { docLap: true, oDung: new Set() });
    assert.deepEqual(mo, goc, `AC-9 cổng mở mà đổi ô ${ten}`);
    const dong = congGhiTam(goc, { docLap: false, oDung: new Set() });
    for (const [i, r] of goc.entries()) {
      const k = dong[i];
      if (r.route === "corroborated") assert.deepEqual([k.route, k.corroboratedBy, k.trungLuat], ["review", null, r.corroboratedBy], `AC-9 ô ${ten} phiếu không độc lập vẫn áp`);
      else assert.deepEqual(k, r, `AC-9 cổng đổi nhánh không phải corroborated ở ô ${ten}`);
    }
  }
  const dung = congGhiTam([c1({}), c1({ field: "block_raw", value: "LBV", corroboratedBy: "asset_nodes:lbv" })], { docLap: true, oDung: new Set(["property_type" as const]) });
  assert.deepEqual(dung.map((r) => [r.field, r.route, r.lyDoKhongGhi ?? null]), [["property_type", "review", "o-dung"], ["block_raw", "corroborated", null]], "AC-9 áp corroborated khi ô dừng");
});
