// xu-lai-trich-db.itest.ts — hồ sơ _acceptance/s03-noi-luat-trich-dan phần cần DB: Postgres local trong BEGIN…ROLLBACK.
// Đề xuất do chayLuot thật sinh với luật cũ tiêm qua kiemLoai, không viết tay; model giả, không gọi mạng. Chữ bài viết tay, số liệu giả.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: config:executors.test.ls1b_db
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type pg from "pg";

import { TEN_MODEL, type Nhan } from "../src/agents/nhan-bac-s03.js";
import type { ContextResult } from "../src/agents/context-resolver.js";
import { chayLuot, coMauDat, demLuot, docTraLoi, doMau, LUAT_VERSION, PROMPT_VERSION, xuLaiTrich } from "../src/enrich/doc-toan-bo.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { textHash } from "../../pipeline/lib/eval-labels.mjs";
import { kiemTrichLoai } from "../src/enrich/luat-trich-dan.js";
import type { ResolveFn } from "../src/enrich/run.js";
import { chayLenh, docCo, type Noi } from "../scripts/doc-toan-bo-s03.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { wilsonDuoi } from "../../pipeline/lib/eval-classify.mjs";
import { insertOffer, withTx } from "./helpers/db.js";

const SNAP = "hanoi__zalo-agent__2099-05-06T000000";
const MIG_065 = join(import.meta.dirname, "../../db/migrations/065_silver_labels.sql");
const MIG_069 = join(import.meta.dirname, "../../db/migrations/069_loai_hinh_suy_luan.sql");
let dem = 0;

async function nen(c: pg.Client) {
  await c.query(await readFile(MIG_065, "utf8"));
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  await c.query(`DELETE FROM ops_audit WHERE action = 'doc-toan-bo:mau'`);
}
type Tin = { id: string; text: string; property_type?: string | null; price?: number | null; area?: number | null };
async function moiTin(c: pg.Client, t: Tin): Promise<string> {
  const post = `t_xl_p_${process.pid}_${++dem}`;
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
    VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi', 'xl', $3, '2026-10-31T08:00:00Z')`, [post, SNAP, t.text]);
  await insertOffer(c, { offer_id: t.id, source: "S03", property_type: t.property_type === undefined ? "unknown" : t.property_type, post_ids: [post] });
  await c.query(`UPDATE sale_offers SET price_vnd = $2, area_m2 = $3, kind = 'sale', confidence = 'high' WHERE offer_id = $1`, [t.id, t.price ?? null, t.area ?? null]);
  return t.id;
}
const traLoi = (o: Record<string, unknown>) => JSON.stringify({ intent: "offer", kind: "sale", confidence: 0.9, quote: "", property_type: null, quote_loai: "", price_vnd: null, quote_gia: "", area_m2: null, quote_dt: "", ...o });
function hoiTheo(theoChu: (chu: string) => string, goi: string[] = []) {
  return async (chu: string): Promise<Nhan> => {
    goi.push(chu);
    const p = docTraLoi(theoChu(chu), chu);
    return { model: "gateway:anthropic/claude-haiku-5.5", ...p, error_kind: p.json_ok ? null : "json-hong", latency_ms: 1, cost_usd: 0.001 };
  };
}
const E1_RONG: ResolveFn = async () => ({ projectSlug: null, projectName: null, projectCandidates: [], propertyType: null, buildingHint: null, areaHint: null, matchedBy: "" }) as ContextResult;
/** Luật trước vòng này: chỉ `căn hộ`, `chung cư`, `cc`; mọi lý do mới đều từng là `khong-tu-khoa`. */
const luatCu: typeof kiemTrichLoai = (v, q, chu) => {
  const k = kiemTrichLoai(v, q, chu);
  if (k.ok) return k.ma === "trich-dan:so-phong" ? { ok: false, lyDo: "khong-tu-khoa" } : k;
  return k.lyDo === "ngu-canh-loai-tru" && v === "apartment" ? { ok: false, lyDo: "khong-tu-khoa" } : k;
};
/** Dựng tin và đề xuất bằng một lượt chayLuot thật với luật cũ. */
async function luotCu(c: pg.Client, tin: { t: Tin; loai?: string; quote: string }[], goi: string[] = []) {
  for (const x of tin) await moiTin(c, x.t);
  const hoi = hoiTheo((chu) => {
    const x = tin.find((y) => y.t.text === chu);
    return traLoi({ property_type: x?.loai ?? "apartment", quote_loai: x?.quote ?? "" });
  }, goi);
  return chayLuot({ client: c, runId: `doc-toan-bo-luot-cu-${++dem}`, tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin: tin.map((x) => x.t.id), hoi, resolve: E1_RONG, kiemLoai: luatCu });
}
const xuLai = (c: pg.Client, chiTin: string[], thu = false) =>
  xuLaiTrich({ client: c, runId: `doc-toan-bo-xu-lai-${++dem}`, thu, cam: [], chiTin, resolve: E1_RONG });
const deXuat = async (c: pg.Client, id: string) => (await c.query(`SELECT id, field, value, source, route, corroborated_by, status, run_id, evidence, reverted_at FROM enrichment_proposals WHERE offer_id = $1 ORDER BY id`, [id])).rows;
const loaiHinh = async (c: pg.Client, id: string) => (await c.query(`SELECT property_type, field_provenance #>> '{property_type,tier}' AS tang FROM sale_offers WHERE offer_id = $1`, [id])).rows[0];
/** Băm mọi cột của tin trừ loại hình, provenance, mốc cập nhật (AC-3). */
const bamTin = async (c: pg.Client, id: string) => (await c.query(
  `SELECT md5((to_jsonb(r) - 'property_type' - 'field_provenance' - 'last_seen')::text) AS h FROM sale_offer_records r WHERE offer_id = $1`, [id])).rows[0].h;
const demBang = async (c: pg.Client) => (await c.query(`SELECT
  (SELECT count(*) FROM ai_calls)::int AS goi, (SELECT count(*) FROM review_queue)::int AS the, (SELECT count(*) FROM silver_labels)::int AS nhan,
  (SELECT count(*) FROM enrichment_proposals)::int AS de_xuat, (SELECT count(*) FROM enrichment_proposals WHERE status = 'applied')::int AS da_ap,
  (SELECT count(*) FROM field_assertions)::int AS phat_bieu, (SELECT count(*) FROM ops_audit)::int AS nhat_ky`)).rows[0];
const noi = (c: pg.Client, o: Partial<Noi> = {}): Noi & { dong: string[] } => {
  const dong: string[] = [];
  return { client: c, khoa: "khoa-gia", resolve: E1_RONG, wilson: wilsonDuoi, log: (d) => dong.push(d), cam: [], dong, ...o };
};
const dongMau = (c: pg.Client, detail: Record<string, unknown>) => c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test', 'doc-toan-bo:mau', $1)`, [detail]);

// ---------- AC-3 ----------
test("AC-3 đề xuất lượt cũ thành applied, không gọi model, không thẻ, cột khác của tin không đổi", async () => {
  await withTx(async (c) => {
    await nen(c);
    const goi: string[] = [];
    const a = "t_xl_duong";
    const kqCu = await luotCu(c, [{ t: { id: a, text: "Cho thuê 2PN Times City 14tr", price: 3_000_000_000, area: 70 }, quote: "2PN" }], goi);
    assert.equal(kqCu.daAp, 0, "AC-3 luật cũ không được áp");
    const [cu] = await deXuat(c, a);
    assert.deepEqual([cu.status, cu.evidence.ly_do], ["skipped", "khong-tu-khoa"]);
    // Một đề xuất trường khác cùng lý do: chỉ dòng loại hình được xét lại.
    await c.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, evidence)
      VALUES ('t', $1, 'street_raw', 'Minh Khai', 'minh khai', 'e2_llm', 'review', 'skipped', $2)`, [a, { ly_do: "khong-tu-khoa", prompt_version: PROMPT_VERSION }]);
    const banTin = await bamTin(c, a);
    const goiTruoc = goi.length;
    const truoc = await demBang(c);

    const kq = await xuLai(c, [a]);

    assert.deepEqual([kq.xet, kq.dat, kq.daAp, kq.loiGhi.length], [1, 1, 1, 0]);
    const sau = await deXuat(c, a);
    assert.deepEqual([sau[0].status, sau[0].route, sau[0].corroborated_by], ["applied", "corroborated", "trich-dan:so-phong"]);
    assert.equal(sau[0].evidence.ly_do, undefined);
    assert.equal(sau[0].evidence.xu_lai_tu_run, cu.run_id);
    assert.equal(sau[0].evidence.trich, cu.evidence.trich, "AC-3 phải giữ câu trích cũ");
    assert.equal(sau[1].status, "skipped", "AC-3 đề xuất trường khác không được đổi");
    assert.equal((await loaiHinh(c, a)).property_type, "apartment");
    assert.equal(goi.length, goiTruoc, "AC-3 xử lại không được gọi model");
    const d = await demBang(c);
    assert.deepEqual([d.goi, d.the, d.nhan, d.de_xuat], [truoc.goi, truoc.the, truoc.nhan, truoc.de_xuat], "AC-3 xử lại không được thêm lời gọi, thẻ, nhãn, đề xuất");
    assert.equal(await bamTin(c, a), banTin, "AC-3 cột khác của tin đổi");
    // Đối chứng dương: phép băm thấy cột giá đổi.
    await c.query(`UPDATE sale_offers SET price_vnd = 1 WHERE offer_id = $1`, [a]);
    assert.notEqual(await bamTin(c, a), banTin, "AC-3 phép băm không thấy giá đổi");
  });
});

// ---------- AC-4 ----------
test("AC-4 chín ca âm cùng lượt với một ca dương: ca dương đổi, chín ca giữ nguyên", async () => {
  await withTx(async (c) => {
    await nen(c);
    const CA = [
      { t: { id: "t_xl4_duong", text: "Sẵn 3PN S1.07 full đồ 15tr" }, quote: "3PN" },
      { t: { id: "t_xl4_lydo", text: "Sẵn 1PN toà khác 9tr tại khu này" }, quote: "câu không có trong bài" },
      { t: { id: "t_xl4_hoantac", text: "Sẵn 2PN S2.03 đẹp 11tr thuê ngay" }, quote: "2PN" },
      { t: { id: "t_xl4_chudoi", text: "Sẵn 2PN S3.05 nhà đẹp 12tr" }, quote: "2PN" },
      { t: { id: "t_xl4_nguoi", text: "Sẵn 2PN S4.01 đồ mới 10tr" }, quote: "2PN" },
      { t: { id: "t_xl4_nghi", text: "Sẵn 2PN S5.02 trống 9tr" }, quote: "2PN" },
      { t: { id: "t_xl4_toa", text: "Toà BE1 full nội thất 8tr" }, quote: "Toà BE1" },
      { t: { id: "t_xl4_bietthu", text: "3PN full đồ, khu có biệt thự song lập 20tr" }, quote: "3PN" },
      { t: { id: "t_xl4_nha3pn", text: "Bán nhà 3pn ngõ rộng 5 tỷ" }, quote: "nhà 3pn" },
      { t: { id: "t_xl4_loaikhac", text: "Bán 3PN ngõ rộng ô tô vào 5 tỷ" }, loai: "house", quote: "3PN" },
    ];
    await luotCu(c, CA);
    const [hoanTac] = await deXuat(c, "t_xl4_hoantac");
    await c.query(`UPDATE enrichment_proposals SET status = 'queued', route = 'corroborated', corroborated_by = 'trich-dan:can-ho' WHERE id = $1`, [hoanTac.id]);
    await c.query(`SELECT apply_enrichment($1, 'test')`, [[hoanTac.id]]);
    await c.query(`SELECT revert_enrichment($1, 'hitl:test', 'mồi đã hoàn tác')`, [[hoanTac.id]]);
    await c.query(`UPDATE stg_zalo_posts SET text = 'Chủ sửa bài: 2PN S3.05 đồ khác 13tr' WHERE post_id = (SELECT post_ids[1] FROM sale_offers WHERE offer_id = 't_xl4_chudoi')`);
    await c.query(`UPDATE sale_offers SET property_type = 'apartment', field_provenance = field_provenance || '{"property_type":{"tier":"human"}}' WHERE offer_id = 't_xl4_nguoi'`);
    await c.query(`UPDATE sale_offers SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = 't_xl4_nghi'`);
    const AM = CA.slice(1).map((x) => x.t.id);
    const banDau = new Map<string, unknown>();
    for (const id of AM) banDau.set(id, { dx: await deXuat(c, id), tin: await loaiHinh(c, id), bam: await bamTin(c, id) });

    const kq = await xuLai(c, CA.map((x) => x.t.id));

    assert.equal(kq.daAp, 1, `AC-4 chỉ ca dương được áp: ${JSON.stringify(kq)}`);
    assert.deepEqual(await loaiHinh(c, "t_xl4_duong").then((r) => r.property_type), "apartment");
    for (const id of AM) {
      assert.deepEqual({ dx: await deXuat(c, id), tin: await loaiHinh(c, id), bam: await bamTin(c, id) }, banDau.get(id), `AC-4 ca ${id} phải giữ nguyên`);
    }
    assert.equal(kq.giuNguyen["ngu-canh-loai-tru"], 2, `AC-4 biệt thự, nhà 3pn dính chốt: ${JSON.stringify(kq.giuNguyen)}`);
    assert.equal(kq.giuNguyen["chu-doi"], 1, `AC-4 chữ đổi phải giữ: ${JSON.stringify(kq.giuNguyen)}`);
  });
});

// «Bài mới nhất» không cố định khi nhiều bài trùng captured_at; đo trên DB máy thu 04/11: 153 đề xuất rơi vào ca này.
test("AC-3 tin có bài khác đứng trước bài đã đọc: vẫn tìm đúng nhãn, thân bài xét trên bài đã đọc", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = "t_xl_haibai";
    await luotCu(c, [{ t: { id: a, text: "Sẵn 2PN S2.09 full đồ 10tr" }, quote: "2PN" }]);
    const postMoi = `t_xl_p_${process.pid}_${++dem}`;
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at, captured_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi', 'xl', 'Bài khác của tin, chưa ai đọc', '2026-11-01T08:00:00Z', now() + interval '1 hour')`, [postMoi, SNAP]);
    await c.query(`UPDATE sale_offers SET post_ids = post_ids || $2::text WHERE offer_id = $1`, [a, postMoi]);
    const kq = await xuLai(c, [a]);
    assert.equal(kq.daAp, 1, `AC-3 phải tìm được nhãn của bài đã đọc: ${JSON.stringify(kq)}`);
    assert.equal((await deXuat(c, a))[0].corroborated_by, "trich-dan:so-phong");
  });
});

test("AC-3 tin có bài khác cũng đã đọc, câu trích khác: chỉ xét bài sinh đề xuất", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = "t_xl_haibaidoc";
    await luotCu(c, [{ t: { id: a, text: "Sẵn 2PN S2.10 full đồ 10tr" }, quote: "2PN" }]);
    const postMoi = `t_xl_p_${process.pid}_${++dem}`, chuMoi = "Có 3PN, khu có biệt thự song lập";
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at, captured_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi', 'xl', $3, '2026-11-01T08:00:00Z', now() + interval '1 hour')`, [postMoi, SNAP, chuMoi]);
    await c.query(`UPDATE sale_offers SET post_ids = post_ids || $2::text WHERE offer_id = $1`, [a, postMoi]);
    await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, json_ok, probabilities, run_id)
      VALUES ('S03', $1, $2, $3, $4, 'offer', true, $5, 'r')`, [postMoi, textHash(chuMoi), TEN_MODEL.haiku, PROMPT_VERSION, { property_type: "apartment", quote_loai: "3PN" }]);
    const kq = await xuLai(c, [a]);
    assert.equal(kq.daAp, 1, `AC-3 phải xét bài có câu trích của đề xuất, không phải bài đứng đầu: ${JSON.stringify(kq)}`);
  });
});

// ---------- AC-5 ----------
test("AC-5 chạy lại lần hai không đổi đề xuất, phát biểu, nhật ký", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = "t_xl_lai";
    await luotCu(c, [{ t: { id: a, text: "Sẵn 2PN S7.02 full đồ 10tr" }, quote: "2PN" }]);
    const mot = await xuLai(c, [a]);
    assert.equal(mot.daAp, 1, "AC-5 đối chứng: lần một phải áp");
    const truoc = await demBang(c);
    const dx = await deXuat(c, a);
    const hai = await xuLai(c, [a]);
    assert.deepEqual([hai.xet, hai.daAp], [0, 0], "AC-5 lần hai phải báo áp 0");
    assert.deepEqual(await demBang(c), truoc, "AC-5 lần hai đổi số dòng");
    assert.deepEqual(await deXuat(c, a), dx, "AC-5 lần hai đổi đề xuất");
  });
});

// ---------- AC-6 + phần cổng của AC-9 ----------
test("AC-6 ba dòng mẫu không mở cổng; --thu không qua cổng; dòng do doMau thật ghi thì chạy", async () => {
  await withTx(async (c) => {
    await nen(c);
    const a = "t_xl_cong";
    await luotCu(c, [{ t: { id: a, text: "Sẵn 2PN S8.02 full đồ 10tr" }, quote: "2PN" }]);
    const CA_TU_CHOI: [string, Record<string, unknown>][] = [
      ["dòng 03/11 không có trường phiên bản", { prompt_version: PROMPT_VERSION, nguong: 0.85, dat: true }],
      ["dòng phiên bản cũ", { prompt_version: PROMPT_VERSION, luat_version: "trich-v1", dat: true }],
      ["dòng rớt phiên bản hiện tại", { prompt_version: PROMPT_VERSION, luat_version: LUAT_VERSION, dat: false }],
    ];
    for (const [ten, detail] of CA_TU_CHOI) {
      await dongMau(c, detail);
      const truoc = await demBang(c);
      const n = noi(c, { chiTin: [a] });
      assert.equal(await chayLenh(docCo(["--xu-lai-trich"]), n), 6, `AC-6 ${ten} phải từ chối xử lại`);
      const nThuong = noi(c, { hoi: hoiTheo(() => traLoi({})), chiTin: [a] });
      assert.equal(await chayLenh(docCo([]), nThuong), 6, `AC-6 ${ten} phải từ chối lượt thật`);
      assert.deepEqual(await demBang(c), truoc, `AC-6 ${ten} không được ghi`);
    }
    assert.equal(await coMauDat(c), false);

    const truocThu = await demBang(c);
    const nThu = noi(c, { chiTin: [a] });
    assert.equal(await chayLenh(docCo(["--xu-lai-trich", "--thu"]), nThu), 0, "AC-6 --thu không qua cổng");
    assert.deepEqual(await demBang(c), truocThu, "AC-6 --thu không được ghi dòng nào");
    assert.ok(nThu.dong.some((d) => d.includes("qua luật 1")), `AC-6 --thu phải báo số dự kiến: ${nThu.dong}`);
    assert.ok(nThu.dong.some((d) => /AI đã áp dự kiến \d+\/\d+ \(/.test(d)), `AC-9 --thu phải in tử số, mẫu số, tỉ lệ: ${nThu.dong}`);

    const nhan = await baiMau(c, 110, 40, 0);
    const tep = join(await mkdtemp(join(tmpdir(), "xl-")), "nhan.json");
    await writeFile(tep, JSON.stringify(nhan.map((x) => [x.post_id, { property_type: x.property_type }])));
    assert.equal(await chayLenh(docCo(["--mau", "110", "--nhan", tep, "--tran-usd", "3"]), noi(c, { hoi: hoiMau() })), 0, "AC-6 mẫu thật phải đạt");
    const n = noi(c, { chiTin: [a] });
    assert.equal(await chayLenh(docCo(["--xu-lai-trich"]), n), 0, `AC-6 dòng đạt phiên bản hiện tại phải chạy: ${n.dong}`);
    assert.equal((await loaiHinh(c, a)).property_type, "apartment");
  });
});

// ---------- AC-9: cổng tách nhánh ----------
/** `moi` bài chỉ có `2PN` (nhánh số phòng), còn lại có `căn hộ`; `sai` bài đầu nhãn nhà riêng. */
const baiMau = async (c: pg.Client, n: number, moi: number, sai: number) => {
  const nhan: { post_id: string; property_type: string }[] = [];
  for (let i = 0; i < n; i++) {
    const post = `t_xl_mau_${process.pid}_${++dem}`;
    const chu = `Chính chủ bán ${i < moi ? "2PN" : "căn hộ"} mã ${post}`;
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
      VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi', 'xl', $3, '2026-10-31T08:00:00Z')`, [post, SNAP, chu]);
    await insertOffer(c, { offer_id: `t_xl_mo_${post}`, source: "S03", property_type: "unknown", post_ids: [post] });
    nhan.push({ post_id: post, property_type: i < sai ? "house" : "apartment" });
  }
  return nhan;
};
const hoiMau = () => hoiTheo((chu) => traLoi({ property_type: "apartment", quote_loai: chu.includes("căn hộ") ? "căn hộ" : "2PN" }));
const doMauTest = (c: pg.Client, nhan: { post_id: string; property_type: string }[]) =>
  doMau({ client: c, runId: `m${++dem}`, nhan, n: nhan.length, nguong: 0.85, tranUsd: 3, thu: true, cam: [], hoi: hoiMau(), resolve: E1_RONG, wilson: wilsonDuoi });

test("AC-9 toàn mẫu đạt nhưng nhánh số phòng dưới 30 ca: không đạt", async () => {
  await withTx(async (c) => {
    await nen(c);
    const kq = await doMauTest(c, await baiMau(c, 110, 29, 0));
    assert.deepEqual([kq.ap, kq.apMoi, kq.dungMoi, kq.dat], [110, 29, 29, false]);
  });
});
test("AC-9 toàn mẫu đạt nhưng nhánh số phòng dưới ngưỡng: không đạt; đủ ca đúng thì đạt", async () => {
  await withTx(async (c) => {
    await nen(c);
    // 12 ca sai đều ở nhánh mới: toàn mẫu 148/160, Wilson ~0,88; nhánh mới 28/40, Wilson ~0,55.
    const kq = await doMauTest(c, await baiMau(c, 160, 40, 12));
    assert.equal(kq.canDuoi! >= 0.85, true, `AC-9 toàn mẫu phải đạt: ${kq.canDuoi}`);
    assert.deepEqual([kq.apMoi, kq.dungMoi, kq.dat], [40, 28, false]);
    assert.ok(kq.canDuoiMoi! < 0.85);
  });
  await withTx(async (c) => {
    await nen(c);
    const kq = await doMauTest(c, await baiMau(c, 140, 40, 0));
    assert.deepEqual([kq.apMoi, kq.dungMoi, kq.dat], [40, 40, true]);
  });
});

// ---------- AC-7 ----------
test("AC-7 hoàn tác theo run_id: tin loại suy về giá trị và tầng cũ, tin unknown về unknown", async () => {
  await withTx(async (c) => {
    await nen(c);
    // withTx nạp lại hàm bản 045, 059; tin loại suy cần bản 069 như DB thật.
    await c.query(await readFile(MIG_069, "utf8"));
    const suy = "t_xl_suy", rong = "t_xl_rong";
    await moiTin(c, { id: suy, text: "Sẵn 2PN S9.01 full đồ 10tr", property_type: null });
    const postSuy = (await c.query(`SELECT post_ids[1] AS p FROM sale_offers WHERE offer_id = $1`, [suy])).rows[0].p;
    await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, observed_at)
      VALUES ($1, 'property_type', 'apartment', 'inferred', 'e1_rule', 'transform-zalo@sl1', 'loai-hinh-nhom', now())`, [`S03:${postSuy}`]);
    await c.query("SELECT resolve_offer_fields(ARRAY[$1])", [suy]);
    await moiTin(c, { id: rong, text: "Sẵn 3PN S9.02 full đồ 15tr" });
    const hoi = hoiTheo((chu) => traLoi({ property_type: "apartment", quote_loai: chu.includes("3PN") ? "3PN" : "2PN" }));
    await chayLuot({ client: c, runId: `doc-toan-bo-luot-cu-${++dem}`, tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin: [suy, rong], hoi, resolve: E1_RONG, kiemLoai: luatCu });
    const banSuy = await loaiHinh(c, suy);
    assert.deepEqual([banSuy.property_type, banSuy.tang], ["apartment", "inferred"]);

    const runId = `doc-toan-bo-xu-lai-${++dem}`;
    const kq = await xuLaiTrich({ client: c, runId, thu: false, cam: [], chiTin: [suy, rong], resolve: E1_RONG });
    assert.equal(kq.daAp, 2, `AC-7 phải áp hai tin: ${JSON.stringify(kq)}`);
    assert.notEqual((await loaiHinh(c, suy)).tang, "inferred", "AC-7 tin loại suy phải có căn cứ sau áp");
    assert.equal((await loaiHinh(c, rong)).property_type, "apartment");

    const ids = (await c.query(`SELECT id FROM enrichment_proposals WHERE run_id = $1 AND status = 'applied'`, [runId])).rows.map((r) => r.id);
    assert.equal(ids.length, 2, "AC-7 run_id phải gom đúng hai đề xuất");
    await c.query(`SELECT revert_enrichment($1, 'hitl:test', 'lùi xử lại')`, [ids]);
    assert.deepEqual(await loaiHinh(c, suy), banSuy, "AC-7 tin loại suy phải về giá trị và tầng cũ");
    assert.equal((await loaiHinh(c, rong)).property_type, "unknown", "AC-7 tin unknown phải về unknown");
    for (const id of [suy, rong]) assert.ok((await deXuat(c, id))[0].reverted_at, "AC-7 đề xuất phải mang reverted_at");
  });
});

// ---------- AC-8 ----------
test("AC-8 --dem khớp truy vấn độc lập; bài mới 2PN qua lượt thường được áp theo luật mới", async () => {
  await withTx(async (c) => {
    await nen(c);
    const cu = "t_xl_dem_cu", moi = "t_xl_dem_moi";
    await luotCu(c, [{ t: { id: cu, text: "Sẵn 2PN S6.01 full đồ 10tr" }, quote: "2PN" }]);
    await xuLai(c, [cu]);
    await moiTin(c, { id: moi, text: "Cho thuê 2PN S6.02 trống 8tr" });
    const kq = await chayLuot({ client: c, runId: `doc-toan-bo-moi-${++dem}`, tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin: [moi], hoi: hoiTheo(() => traLoi({ property_type: "apartment", quote_loai: "2PN" })), resolve: E1_RONG });
    assert.equal(kq.daAp, 1, "AC-8 lượt thường phải áp bài mới");
    const [dx] = await deXuat(c, moi);
    assert.deepEqual([dx.status, dx.corroborated_by], ["applied", "trich-dan:so-phong"]);
    const { rows: [tay] } = await c.query(`SELECT count(DISTINCT o.offer_id)::int AS n FROM sale_offer_records o
      WHERE o.source = 'S03' AND o.retired_at IS NULL AND EXISTS (SELECT 1 FROM enrichment_proposals ep WHERE ep.offer_id = o.offer_id AND ep.source = 'e2_llm' AND ep.status = 'applied')`);
    assert.equal((await demLuot(c)).aiDaAp, tay.n, "AC-8 --dem lệch truy vấn độc lập");
    assert.ok(tay.n >= 2);
  });
});
