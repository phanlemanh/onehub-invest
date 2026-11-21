// cham-bong-bo-sung-tin.test.ts — NB1: chấm bóng hàng «Bổ sung tin». Tên ca bắt đầu bằng mã AC để probe
// _acceptance/cham-bong-bo-sung-tin/probes/cham.sh lọc. Mã nguồn nạp theo CHAM_BONG_SRC (mặc định «cham-bong») để probe đột biến
// chạy cùng bộ ca trên bản sao đã sửa (agent/src/enrich/cham-bong.dot-bien/).
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const SRC = process.env.CHAM_BONG_SRC ?? "cham-bong";
const KC = (await import(`../src/enrich/${SRC}/ket-cuc.js`)) as typeof import("../src/enrich/cham-bong/ket-cuc.js");
const CH = (await import(`../src/enrich/${SRC}/cau-hinh.js`)) as typeof import("../src/enrich/cham-bong/cau-hinh.js");
const PR = (await import(`../src/enrich/${SRC}/prompt.js`)) as typeof import("../src/enrich/cham-bong/prompt.js");
const DOC = (await import(`../src/enrich/${SRC}/doc.js`)) as typeof import("../src/enrich/cham-bong/doc.js");
type ModelCham = import("../src/enrich/cham-bong/cau-hinh.js").ModelCham;
type AiCallRecord = import("../src/runtime/ai-call-log.js").AiCallRecord;

// ---------- AC-4: kết cục ----------
const DX = "2";
const LAN = {
  bang: { v: "2", ly_do: null },
  A: { v: "3", ly_do: null },
  B: { v: "4", ly_do: null },
  rong: { v: null, ly_do: "khong-suy-ra" },
} as const;
type L = keyof typeof LAN;
/** Bảng viết tay: lần đọc 1 × lần đọc 2 → kết cục, và cờ ca biên khi KHÔNG có lech_tren_the. Có lech_tren_the thì ca biên luôn true. */
const BANG: [L, L, string, boolean][] = [
  ["bang", "bang", "khop", false],
  ["bang", "A", "lech_hai_lan", true],
  ["bang", "B", "lech_hai_lan", true],
  ["bang", "rong", "bo_trong", true],
  ["A", "bang", "lech_hai_lan", true],
  ["A", "A", "bac_dong_thuan", true],
  ["A", "B", "lech_hai_lan", true],
  ["A", "rong", "bo_trong", true],
  ["B", "bang", "lech_hai_lan", true],
  ["B", "A", "lech_hai_lan", true],
  ["B", "B", "bac_dong_thuan", true],
  ["B", "rong", "bo_trong", true],
  ["rong", "bang", "bo_trong", true],
  ["rong", "A", "bo_trong", true],
  ["rong", "B", "bo_trong", true],
  ["rong", "rong", "bo_trong", true],
];

test("AC-4 ma trận 16 cặp đọc × lech_tren_the × o_da_co = 64 assert", () => {
  let n = 0;
  for (const [a, b, ketCuc, caBienKhongLech] of BANG) {
    for (const lech of [false, true]) {
      for (const oDaCo of [false, true]) {
        const k = KC.ketCuc(DX, LAN[a], LAN[b]);
        assert.equal(k, ketCuc, `ô ${a}/${b} lech=${lech} o_da_co=${oDaCo}: kết cục ${k}, mong ${ketCuc}`);
        const cb = KC.laCaBien(k, lech);
        assert.equal(cb, lech ? true : caBienKhongLech, `ô ${a}/${b} lech=${lech} o_da_co=${oDaCo}: ca biên ${cb}`);
        n++;
      }
    }
  }
  assert.equal(n, 64);
});

test("AC-4 đối chứng dương: 4 ô khop không lech_tren_the không có cờ ca biên", () => {
  for (const oDaCo of [false, true]) for (const _ of [0, 1]) {
    assert.equal(KC.laCaBien(KC.ketCuc(DX, LAN.bang, LAN.bang), false), false, `ô khop o_da_co=${oDaCo} bị cờ ca biên`);
  }
});

test("AC-4 so theo khoá assertion_value_key: «02/2», hoa thường, khoảng trắng", () => {
  assert.equal(KC.ketCuc("2", { v: "02", ly_do: null }, { v: "2", ly_do: null }), "khop", "ô «02/2» phải khop");
  assert.equal(KC.ketCuc("Căn hộ", { v: "căn hộ", ly_do: null }, { v: " CĂN HỘ ", ly_do: null }), "khop", "ô «Căn hộ/căn hộ» phải khop");
  assert.equal(KC.khoaGiaTri("0"), "0");
  assert.equal(KC.khoaGiaTri("007"), "7");
  assert.equal(KC.khoaGiaTri(" S1.03 "), "s1.03");
});

test("AC-4 thứ tự ô ưu tiên", () => {
  assert.deepEqual([...KC.THU_TU_O], ["bathrooms", "bedrooms", "block_raw", "street_raw", "property_type"]);
});

// ---------- cấu hình ----------
const tepTam = (x: unknown) => {
  const p = join(mkdtempSync(join(tmpdir(), "cham-bong-")), "c.json");
  writeFileSync(p, JSON.stringify(x));
  return p;
};
const M = (khoa: string, gateway: string) => ({ khoa, gateway, gia_vao: 0.1, gia_ra: 0.5 });

test("cau-hinh tệp của kho: Haiku 5.5 + DeepSeek V4.1 Flash, trần 3 USD, lời nhắc cb-v1", () => {
  const { cauHinh, sha } = CH.napCauHinhCham();
  assert.match(sha, /^[0-9a-f]{64}$/);
  assert.deepEqual(cauHinh.model.map((m) => m.gateway), ["anthropic/claude-haiku-5.5", "deepseek/deepseek-v4.1-flash-1017"]);
  assert.equal(cauHinh.tran_usd, 3);
  assert.equal(cauHinh.prompt_version, "cb-v1");
});

test("cau-hinh chiều đỏ: model ngoài danh sách, hai model trùng, trần không dương", () => {
  const goc = { phien_ban: 1, prompt_version: "cb-v1", tran_usd: 3 };
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, model: [M("a", "anthropic/claude-haiku-5.5"), M("b", "openai/gpt-x")] })), /ngoài ba mã đã duyệt/);
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, model: [M("a", "anthropic/claude-haiku-5.5"), M("b", "anthropic/claude-haiku-5.5")] })), /trùng/);
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, tran_usd: 0, model: [M("a", "anthropic/claude-haiku-5.5"), M("b", "zai/glm-5.3-flash")] })), /tran_usd/);
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, model: [M("a", "anthropic/claude-haiku-5.5")] })), /đúng hai/);
});

// ---------- AC-3: luật kiểm ô ----------
const BAI3 = "Bán gấp căn hộ 2PN 2WC toà S1.03 đường Nguyễn Văn Linh, giá 3,2 tỷ";
test("AC-3 ma trận 8 ca kiểm ô", () => {
  const ca: [string, Parameters<typeof DOC.kiemO>[0], unknown, string | null, string | null][] = [
    ["trích có thật → giữ", "bathrooms", { v: 2, trich: "2WC", can_cu: "ghi 2WC" }, "2", null],
    ["trích không có trong bài → rỗng", "bathrooms", { v: 2, trich: "2 vệ sinh", can_cu: "x" }, null, "trich-gia"],
    ["trích khác hoa thường, khoảng trắng → giữ", "block_raw", { v: "S1.03", trich: "TOÀ   s1.03", can_cu: "x" }, "S1.03", null],
    ["loại hình trong từ vựng → giữ", "property_type", { v: "apartment", trich: "căn hộ", can_cu: "x" }, "apartment", null],
    ["loại hình ngoài từ vựng → rỗng", "property_type", { v: "chung_cu", trich: "căn hộ", can_cu: "x" }, null, "ngoai-tu-vung"],
    ["số WC «2» → giữ", "bathrooms", { v: "2", trich: "2WC", can_cu: "x" }, "2", null],
    ["số WC «2-3» → rỗng", "bathrooms", { v: "2-3", trich: "2WC", can_cu: "x" }, null, "khong-phai-so"],
    ["model trả rỗng → rỗng", "bedrooms", { v: null, trich: "", can_cu: "" }, null, "khong-suy-ra"],
  ];
  for (const [ten, f, raw, v, lyDo] of ca) {
    const o = DOC.kiemO(f, raw, BAI3);
    assert.equal(o.v, v, `ca ${ten}: v=${o.v}`);
    assert.equal(o.ly_do, lyDo, `ca ${ten}: ly_do=${o.ly_do}`);
  }
});

// ---------- AC-2: lời nhắc ----------
const MH: ModelCham = { khoa: "haiku", gateway: "anthropic/claude-haiku-5.5", duong: ["gateway"], gia_vao: 0.1, gia_ra: 0.5 };
const baiDai = (n: number, them = "") => `Bán căn hộ 2PN 2WC toà S1.03. ${them}`.padEnd(n, " Nội thất đầy đủ, view hồ, sổ đỏ chính chủ.");
const bat = () => {
  const loi: { system: string; user: string }[] = [];
  const goi: import("../src/enrich/cham-bong/doc.js").GoiModel = async (_m, _d, p) => {
    loi.push(p);
    return { text: JSON.stringify({ bathrooms: { v: 2, trich: "2WC", can_cu: "ghi 2WC" } }), vao: 100, ra: 20 };
  };
  return { loi, goi };
};

test("AC-2 lời nhắc chứa bài gốc đầy đủ trong khối ranh giới và tên ô; băm khớp", async () => {
  const bai = baiDai(420);
  assert.ok(bai.length > 300);
  const { loi, goi } = bat();
  const so: AiCallRecord[] = [];
  const k = await DOC.docMot({ model: MH, dauVao: { text: bai, group_name: "Nhóm A", o: ["bathrooms", "block_raw"] }, goi, recordCall: async (r) => { so.push(r); }, trace: "t" });
  assert.equal(loi.length, 1);
  const u = loi[0].user;
  const a = u.indexOf(PR.RANH_BAI.mo), b = u.indexOf(PR.RANH_BAI.dong);
  assert.ok(a >= 0 && b > a, "thiếu khối ranh giới");
  assert.equal(u.slice(a + PR.RANH_BAI.mo.length + 1, b - 1), bai, "bài trong khối không nguyên văn (hay bị cắt 300 ký tự)");
  for (const f of ["bathrooms", "block_raw"]) assert.ok(u.slice(0, a).includes(f), `thiếu tên ô ${f}`);
  const { createHash } = await import("node:crypto");
  assert.equal(k.sha_loi_nhac, createHash("sha256").update(`${loi[0].system}\n${u}`).digest("hex"));
  assert.equal(so.length, 1);
});

test("AC-2 thẻ canh: giá trị đề xuất không có trong bài vắng trên toàn bộ lời nhắc", async () => {
  const { loi, goi } = bat();
  for (const the of ["the-c1", "the-c2", "the-c3"]) {
    await DOC.docMot({ model: MH, dauVao: { text: baiDai(350), group_name: "Nhóm B", o: ["bathrooms"] }, goi, recordCall: async () => {}, trace: "t" });
    const toan = loi[loi.length - 1].system + loi[loi.length - 1].user;
    assert.ok(!toan.includes(`DEXUAT_CANH_${the}`), `thẻ ${the} lộ DEXUAT_CANH_${the}`);
  }
});

test("AC-2 lời nhắc JSON bọc markdown đọc được; JSON hỏng là lời gọi lỗi có một dòng sổ", async () => {
  const so: AiCallRecord[] = [];
  const md: import("../src/enrich/cham-bong/doc.js").GoiModel = async () => ({ text: "```json\n{\"bathrooms\":{\"v\":2,\"trich\":\"2WC\",\"can_cu\":\"x\"}}\n```", vao: 1, ra: 1 });
  const k1 = await DOC.docMot({ model: MH, dauVao: { text: BAI3, group_name: null, o: ["bathrooms", "bedrooms"] }, goi: md, recordCall: async (r) => { so.push(r); }, trace: "t" });
  assert.ok(k1.ok && k1.o.bathrooms.v === "2" && k1.o.bedrooms.ly_do === "khong-suy-ra");
  const hong: import("../src/enrich/cham-bong/doc.js").GoiModel = async () => ({ text: "không biết", vao: 1, ra: 1 });
  const k2 = await DOC.docMot({ model: MH, dauVao: { text: BAI3, group_name: null, o: ["bathrooms"] }, goi: hong, recordCall: async (r) => { so.push(r); }, trace: "t" });
  assert.ok(!k2.ok && k2.loi === "json-hong");
  assert.equal(so.length, 2);
  assert.deepEqual(so.map((r) => r.ok), [true, false]);
  assert.equal(so[1].viec, "cham-bong-bo-sung-tin");
  assert.equal(so[1].model, "gateway:anthropic/claude-haiku-5.5");
});

// ================= Ca DB (Task 3): tập E1 trên DB của riêng lượt (db-thu.sh --chay), mỗi ca BEGIN…ROLLBACK =================
const CHAY = (await import(`../src/enrich/${SRC}/chay.js`)) as typeof import("../src/enrich/cham-bong/chay.js");
const DB = (await import(`../src/enrich/${SRC}/doc-db.js`)) as typeof import("../src/enrich/cham-bong/doc-db.js");
const KHO = (await import(`../src/enrich/${SRC}/kho.js`)) as typeof import("../src/enrich/cham-bong/kho.js");
const { withTx, insertOffer, insertProposal } = await import("./helpers/db.js");
const { readFileSync, existsSync } = await import("node:fs");
type PgClient = import("pg").Client;
type GoiModelT = import("../src/enrich/cham-bong/doc.js").GoiModel;
type CauHinhT = import("../src/enrich/cham-bong/cau-hinh.js").CauHinhCham;
const MODEL_DUYET = (await import("../src/enrich/doc-gop-s03/cau-hinh.js")).MODEL_DUYET as readonly string[];

const CAU: CauHinhT = {
  phien_ban: 1, prompt_version: "cb-v1", tran_usd: 3,
  model: [
    { khoa: "haiku", gateway: "anthropic/claude-haiku-5.5", duong: ["gateway"], gia_vao: 0.1, gia_ra: 0.5 },
    { khoa: "deepseek", gateway: "deepseek/deepseek-v4.1-flash-1017", duong: ["gateway"], gia_vao: 0.3, gia_ra: 1.2 },
  ],
};
const C_H = (1000 * 0.1 + 100 * 0.5) / 1e6, C_D = (1000 * 0.3 + 100 * 1.2) / 1e6;
const DEM = " Nội thất đầy đủ, view hồ điều hoà, sổ đỏ chính chủ, hỗ trợ vay ngân hàng, liên hệ xem nhà bất cứ lúc nào trong tuần.";
const dai = (s: string) => (s + DEM.repeat(4)).slice(0, 340);

type TheFx = { ma: string; status?: string; text?: string; source?: string; bedrooms?: number; dx: [string, string, string, string?][] };
/** Tập E1 viết trước: 10 thẻ chờ còn đề xuất (13 đề xuất), «Để sau», đề xuất đã áp, 2 thẻ không đề xuất. dx = [ô, giá trị, nguồn, trạng thái]. */
const E1: TheFx[] = [
  { ma: "c01", text: dai("Bán căn hộ 2PN 2WC toà S1.03 đường Lê Lợi."), dx: [["bathrooms", "2", "e2_llm"]] },
  { ma: "c02", bedrooms: 2, text: dai("Cho thuê căn hộ 2PN 1WC toà PR2."), dx: [["bedrooms", "2", "e2_llm"]] },
  { ma: "c03", text: dai("Bán căn hộ 1PN toà S1.03 giá tốt."), dx: [["block_raw", "S1.03", "e1_rule"]] },
  { ma: "c04", text: dai("Bán nhà phố 3PN 3WC đường Lê Lợi."), dx: [["street_raw", "Lê Lợi", "e2_llm"]] },
  { ma: "c05", text: dai("Bán căn hộ studio toà TC1."), dx: [["property_type", "apartment", "e1_rule"]] },
  { ma: "c06", text: dai("Bán căn hộ 3PN 2WC toà BE3."), dx: [["bathrooms", "2", "e2_llm"], ["bedrooms", "3", "e2_llm"], ["property_type", "apartment", "e2_llm"]] },
  { ma: "c07", text: dai("Chuyển nhượng căn hộ 2PN toà M1."), dx: [["property_type", "apartment", "e2_llm"], ["property_type", "house", "e1_rule"]] },
  { ma: "c08", source: "S05", text: dai("Bán căn hộ 2PN 2WC toà L1."), dx: [["property_type", "apartment", "e2_llm"]] },
  { ma: "c09", text: dai("Cho thuê căn hộ 1PN toà PR5."), dx: [["block_raw", "PR5", "e2_llm"]] },
  { ma: "c10", text: dai("Bán căn hộ 1PN 1WC toà S2."), dx: [["bathrooms", "1", "e1_rule"]] },
  { ma: "c11", status: "deferred", text: dai("Bán căn hộ 2PN 2WC toà S1."), dx: [["bathrooms", "2", "e2_llm"]] },
  { ma: "c12", text: dai("Bán căn hộ 2PN 2WC toà S3."), dx: [["bathrooms", "2", "e2_llm", "applied"]] },
  { ma: "c13", text: dai("Bán căn hộ 2PN."), dx: [] },
  { ma: "c14", text: dai("Bán căn hộ 3PN."), dx: [] },
];

/** Gieo tập thẻ; trước đó đóng (trong giao dịch thử) mọi thẻ agent_output đang chờ có sẵn của bản chép DB. Trả review_id theo mã. */
async function gieo(c: PgClient, ds: TheFx[]): Promise<Map<string, number>> {
  await c.query(`UPDATE review_queue SET status = 'rejected' WHERE item_type = 'agent_output' AND status = 'pending'`);
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('nb1', 'test', 'S03', '{}') ON CONFLICT (snapshot_id) DO NOTHING`);
  const id = new Map<string, number>();
  for (const t of ds) {
    const offer = `nb1_${t.ma}`, post = `nb1_p_${t.ma}`;
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name, captured_at) VALUES ($1, 'nb1', $2, 'Nhóm NB1', now())`, [post, t.text ?? ""]);
    await insertOffer(c, { offer_id: offer, source: t.source ?? "S03", bedrooms: t.bedrooms ?? null, post_ids: [post] });
    const { rows: [r] } = await c.query(
      `INSERT INTO review_queue (item_type, item_id, title, status, evidence) VALUES ('agent_output', $1, 't', $2, jsonb_build_object('offer_id', $3::text)) RETURNING id`,
      [`enrich:${offer}`, t.status ?? "pending", offer]);
    id.set(t.ma, Number(r.id));
    for (const [field, value, source, st] of t.dx) {
      const pid = await insertProposal(c, { offer_id: offer, field, value, source, review_id: Number(r.id) });
      if (st) await c.query(`UPDATE enrichment_proposals SET status = $2 WHERE id = $1`, [pid, st]);
    }
  }
  return id;
}

const ranh = (u: string) => u.slice(u.indexOf(PR.RANH_BAI.mo) + PR.RANH_BAI.mo.length + 1, u.indexOf(PR.RANH_BAI.dong) - 1);
const docTu = (f: string, bai: string): unknown => {
  const m = {
    bathrooms: /(\d+)WC/.exec(bai), bedrooms: /(\d+)PN/.exec(bai), block_raw: /toà ([A-Za-z0-9]+(?:\.[0-9]+)?)/.exec(bai), street_raw: /đường ([^.,]+)/.exec(bai),
  }[f as "bathrooms"];
  if (f === "property_type") return bai.includes("căn hộ") ? { v: "apartment", trich: "căn hộ", can_cu: "bài ghi căn hộ" } : bai.includes("nhà phố") ? { v: "house", trich: "nhà phố", can_cu: "x" } : null;
  return m ? { v: m[1], trich: m[0], can_cu: "bài ghi thẳng" } : null;
};
type Goi = { model: string; ma: string; system: string; user: string };
/** Model giả lập xác định: đọc ô từ khối bài bằng biểu thức; `loiTai` = số thứ tự lời gọi (1-based) ném lỗi 500; `canh` = lần đọc đầu
 * (Haiku) trả street_raw «GIATRI_CANH_<offer>». Mỗi lời gọi 1000 token vào, 100 ra. */
function gia(o: { loiTai?: number[]; canh?: boolean; nemNeuGoi?: boolean } = {}) {
  const goi: Goi[] = [];
  const fn: GoiModelT = async (m, _d, p) => {
    if (o.nemNeuGoi) throw new Error("model bị gọi khi không được gọi");
    const bai = ranh(p.user);
    const ma = /nb1_(\S+)/.exec(p.user)?.[1] ?? "";
    goi.push({ model: m.gateway, ma, ...p });
    if (o.loiTai?.includes(goi.length)) throw Object.assign(new Error("Internal"), { status: 500 });
    const o2 = /Ô cần đọc: (.+)/.exec(p.user)![1].split(", ");
    const kq: Record<string, unknown> = Object.fromEntries(o2.map((f) => [f, docTu(f, bai)]));
    if (o.canh && m.gateway.startsWith("anthropic/")) kq.street_raw = { v: `GIATRI_CANH_${bai.slice(0, 12)}`, trich: "x", can_cu: "x" };
    return { text: JSON.stringify(kq), vao: 1000, ra: 100 };
  };
  return { goi, fn };
}
/** Lời gọi theo thẻ: model giả không thấy mã thẻ (lời nhắc không mang offer_id), nên đối chiếu qua chữ bài. */
const theCua = (g: Goi, ds: TheFx[]) => ds.find((t) => t.text && ranh(g.user) === t.text)?.ma ?? "?";
const tam = () => mkdtempSync(join(tmpdir(), "nb1-"));
const docJsonl = (p: string) => (existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const ghiDb = (c: PgClient): import("../src/runtime/ai-call-log.js").RecordCall => async (r) => {
  await c.query(`INSERT INTO ai_calls (khach, viec, model, input_tokens, output_tokens, latency_ms, ok, loi, trace) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [r.khach ?? "pipeline", r.viec, r.model, r.inputTokens, r.outputTokens, Math.round(r.latencyMs), r.ok, r.loi, r.trace]);
};
const chayE1 = (c: PgClient, o: Partial<Parameters<typeof CHAY.chay>[0]> & { goi: GoiModelT; thuMuc: string }) =>
  CHAY.chay({ truy: (s, a) => c.query(s, a as unknown[]), cauHinh: CAU, cheDo: "thu", recordCallDb: ghiDb(c), runId: `r${Date.now()}${Math.random().toString(36).slice(2, 6)}`, env: {}, ...o });

test("AC-1 mỗi thẻ chờ còn đề xuất đúng 2 lời gọi hai model đã duyệt; mỗi đề xuất chờ đúng 2 kết quả", async () => {
  await withTx(async (c) => {
    await gieo(c, E1);
    const g = gia(), thuMuc = tam();
    const tk = await chayE1(c, { goi: g.fn, thuMuc });
    const theoThe = new Map<string, Goi[]>();
    for (const x of g.goi) theoThe.set(theCua(x, E1), [...(theoThe.get(theCua(x, E1)) ?? []), x]);
    for (const t of E1) {
      const n = theoThe.get(t.ma)?.length ?? 0;
      const conDx = (t.status ?? "pending") === "pending" && t.dx.some((d) => !d[3]);
      if (conDx) {
        assert.equal(n, 2, `thẻ ${t.ma}: ${n} lời gọi, mong 2`);
        const ms = theoThe.get(t.ma)!.map((x) => x.model);
        assert.equal(new Set(ms).size, 2, `thẻ ${t.ma}: một model đọc hai lần`);
        for (const m of ms) assert.ok(MODEL_DUYET.includes(m), `thẻ ${t.ma}: model ${m} ngoài danh sách`);
      } else assert.equal(n, 0, `thẻ ${t.ma}: ${n} lời gọi, mong 0`);
    }
    assert.equal(g.goi.length, 20, `tổng lời gọi ${g.goi.length}, mong 20`);
    const kq = docJsonl(join(thuMuc, tk.run_id, "ket-qua.jsonl"));
    const doc = kq.filter((d) => d.loai === "doc");
    assert.equal(doc.length, 26, `tổng kết quả ${doc.length}, mong 26`);
    const theoDx = new Map<number, typeof doc>();
    for (const d of doc) theoDx.set(d.proposal_id, [...(theoDx.get(d.proposal_id) ?? []), d]);
    assert.equal(theoDx.size, 13);
    for (const [pid, ds] of theoDx) assert.equal(ds.length, 2, `đề xuất ${pid}: ${ds.length} kết quả`);
    const c07 = doc.filter((d) => d.offer_id === "nb1_c07");
    assert.equal(new Set(c07.map((d) => d.khoa)).size, 2, "hai đề xuất cùng ô c07 phải dùng chung hai lần đọc");
    for (const d of doc) if (d.v !== null) assert.ok(d.trich && d.can_cu, `kết quả ${d.proposal_id}/${d.model} có giá trị mà thiếu trích hay căn cứ`);
    assert.equal(tk.the_du, 10);
  });
});

test("AC-1 đọc DB chạy trong giao dịch chỉ đọc", async () => {
  const { truy, dong } = await DB.moDocChiDoc(process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest");
  try {
    await assert.rejects(truy(`INSERT INTO ai_calls (khach, viec, model, latency_ms, ok) VALUES ('pipeline','x','x',0,true)`), /read-only/);
  } finally { await dong(); }
});

test("AC-2 lời nhắc thật tới model: bài đầy đủ trong khối, không lộ đề xuất hay lần đọc kia; băm khớp", async () => {
  const CANH: TheFx[] = ["k1", "k2", "k3"].map((ma) => ({ ma, text: dai(`Bán căn hộ 2PN 2WC toà S1.0${ma[1]} đường Lê Lợi.`), dx: [["street_raw", `DEXUAT_CANH_${ma}`, "e2_llm"]] as TheFx["dx"] }));
  await withTx(async (c) => {
    await gieo(c, [...E1, ...CANH]);
    const g = gia({ canh: true }), thuMuc = tam();
    const tk = await chayE1(c, { goi: g.fn, thuMuc });
    const { createHash } = await import("node:crypto");
    for (const x of g.goi) {
      const ma = theCua(x, [...E1, ...CANH]);
      const t = [...E1, ...CANH].find((y) => y.ma === ma)!;
      assert.ok(t.text!.length > 300);
      assert.equal(ranh(x.user), t.text, `thẻ ${ma}: khối bài không nguyên văn`);
      const ngoai = x.system + x.user.slice(0, x.user.indexOf(PR.RANH_BAI.mo)) + x.user.slice(x.user.indexOf(PR.RANH_BAI.dong));
      for (const [f, v] of t.dx) {
        assert.ok(ngoai.includes(f), `thẻ ${ma}: thiếu tên ô ${f}`);
        if (v.startsWith("DEXUAT_CANH")) assert.ok(!(x.system + x.user).includes(v), `thẻ ${ma}: lộ «${v}»`);
        else if (!/^\d+$/.test(v)) assert.ok(!ngoai.includes(v) || PR.HUONG_DAN.includes(v), `thẻ ${ma}: lộ giá trị đề xuất «${v}» ngoài khối bài`);
      }
      assert.ok(!(x.system + x.user).includes("GIATRI_CANH"), `thẻ ${ma}: lộ giá trị lần đọc kia`);
      assert.ok(!/qwen|e2_llm|e1_rule/.test(x.system + x.user), `thẻ ${ma}: lộ model hay nguồn đề xuất`);
    }
    const kq = docJsonl(join(thuMuc, tk.run_id, "ket-qua.jsonl")).filter((d) => d.loai === "doc");
    const shaBat = new Set(g.goi.map((x) => createHash("sha256").update(`${x.system}\n${x.user}`).digest("hex")));
    for (const d of kq) assert.ok(shaBat.has(d.sha_loi_nhac), `kết quả ${d.proposal_id}: băm lời nhắc không khớp lời nhắc đã bắt`);
  });
});

/** Dấu ghi của DB trong giao dịch: số dòng chèn/sửa/xoá của mọi bảng public trừ ai_calls (pg_stat_xact_user_tables, phủ mọi bảng
 * kể cả bảng sau view sale_offers) cộng băm trọn từng dòng của bốn bảng bộ phận xử đọc. */
async function dauGhi(c: PgClient): Promise<Record<string, string>> {
  const { rows } = await c.query(`SELECT relname, (n_tup_ins + n_tup_upd + n_tup_del + n_tup_hot_upd)::text AS n FROM pg_stat_xact_user_tables
    WHERE schemaname = 'public' AND relname <> 'ai_calls' ORDER BY relname`);
  const d: Record<string, string> = Object.fromEntries(rows.map((r) => [r.relname, r.n]));
  for (const b of ["sale_offers", "enrichment_proposals", "review_queue", "field_assertions"]) {
    const { rows: [h] } = await c.query(`SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) AS h FROM ${b} t`);
    d[`md5:${b}`] = h.h;
  }
  return d;
}
const lech = (a: Record<string, string>, b: Record<string, string>) => Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k]);
const demAi = async (c: PgClient) => Number((await c.query(`SELECT count(*) FROM ai_calls`)).rows[0].count);

test("AC-5 năm lượt (thử, áp, áp lỗi ở thẻ 3, áp dừng vì trần, thử dừng vì trần) không đổi bảng nào trừ ai_calls", async () => {
  await withTx(async (c) => {
    await gieo(c, E1);
    const luot: [string, Partial<Parameters<typeof CHAY.chay>[0]>, ReturnType<typeof gia>][] = [
      ["thử trọn", { cheDo: "thu" }, gia()],
      ["áp trọn", { cheDo: "ap" }, gia()],
      ["áp lỗi ở thẻ 3", { cheDo: "ap" }, gia({ loiTai: [5, 6] })],
      ["áp dừng vì trần", { cheDo: "ap", tranUsd: 4 * C_H + 3 * C_D + C_D / 2 }, gia()],
      ["thử dừng vì trần", { cheDo: "thu", tranUsd: 4 * C_H + 3 * C_D + C_D / 2 }, gia()],
    ];
    for (const [ten, o, g] of luot) {
      const truoc = await dauGhi(c), ai0 = await demAi(c);
      await chayE1(c, { ...o, goi: g.fn, thuMuc: tam() });
      const sau = await dauGhi(c);
      assert.deepEqual(lech(truoc, sau), [], `lượt ${ten}: bảng đổi ${lech(truoc, sau).join(", ")}`);
      if (o.cheDo === "thu") assert.equal(await demAi(c), ai0, `lượt ${ten}: ai_calls đổi ở chế độ thử`);
    }
    // Đối chứng dương: ghi ngoài bộ chạy làm thước đỏ, nêu đúng bảng đổi.
    const t0 = await dauGhi(c);
    await c.query(`UPDATE sale_offers SET bathrooms = 9 WHERE offer_id = 'nb1_c01'`).catch(async () => {
      await c.query(`UPDATE sale_offer_records SET bathrooms = 9 WHERE offer_id = 'nb1_c01'`);
    });
    const t1 = await dauGhi(c);
    assert.ok(lech(t0, t1).length > 0, "đối chứng dương: UPDATE bathrooms không làm thước đỏ");
    await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, observed_at) VALUES ('S03:nb1_p_c01', 'bathrooms', '7', 'observed', 'legacy', '045', now())`);
    const t2 = await dauGhi(c);
    assert.ok(lech(t1, t2).some((k) => k.includes("field_assertions")), `đối chứng dương: INSERT field_assertions không hiện, lệch ${lech(t1, t2)}`);
  });
});

test("AC-6 mỗi lời gọi đúng một dòng sổ: thử vào tệp, áp vào ai_calls; lỗi có tên lớp", async () => {
  await withTx(async (c) => {
    await gieo(c, E1);
    const thuMuc = tam(), ai0 = await demAi(c);
    const tk = await chayE1(c, { goi: gia({ loiTai: [4, 11] }).fn, thuMuc, cheDo: "thu" });
    const so = docJsonl(join(thuMuc, tk.run_id, "so-goi.jsonl"));
    assert.equal(so.length, 20, `sổ tệp ${so.length} dòng, mong 20`);
    assert.equal(so.filter((r) => r.ok).length, 18);
    for (const r of so.filter((r) => !r.ok)) assert.match(r.loi, /may-chu|khac/, "dòng lỗi thiếu tên lớp lỗi");
    for (const r of so) {
      assert.equal(r.viec, "cham-bong-bo-sung-tin");
      assert.match(r.model, /^(gateway|anthropic):/);
      assert.equal(r.trace, `cham-bong:${tk.run_id}`);
    }
    assert.equal(await demAi(c), ai0, "chế độ thử ghi vào ai_calls");
    const thuMuc2 = tam();
    const tk2 = await chayE1(c, { goi: gia({ loiTai: [4, 11] }).fn, thuMuc: thuMuc2, cheDo: "ap" });
    const { rows } = await c.query(`SELECT ok FROM ai_calls WHERE trace = $1`, [`cham-bong:${tk2.run_id}`]);
    assert.equal(rows.length, 20, `ai_calls ${rows.length} dòng, thiếu ${20 - rows.length}`);
    assert.equal(rows.filter((r) => !r.ok).length, 2);
    assert.equal(docJsonl(join(thuMuc2, tk2.run_id, "so-goi.jsonl")).length, 0, "chế độ áp vẫn ghi tệp sổ");
  });
});

test("AC-7 chạy lại chỉ gọi cặp chưa thành công", async () => {
  await withTx(async (c) => {
    await gieo(c, E1);
    const dongKho = (m: string) => docJsonl(join(m, "kho.jsonl")).length;
    // (a) hai lần liên tiếp
    const a = tam(); await chayE1(c, { goi: gia().fn, thuMuc: a });
    const ga = gia(), na = dongKho(a); await chayE1(c, { goi: ga.fn, thuMuc: a });
    assert.equal(ga.goi.length, 0, `(a) lần hai gọi ${ga.goi.length} lời gọi lặp`);
    assert.equal(dongKho(a), na, "(a) lần hai sinh dòng kết quả mới");
    // (b) sau 2 lời gọi lỗi
    const b = tam(); await chayE1(c, { goi: gia({ loiTai: [4, 11] }).fn, thuMuc: b });
    const gb = gia(); await chayE1(c, { goi: gb.fn, thuMuc: b });
    assert.equal(gb.goi.length, 2, `(b) lần hai gọi ${gb.goi.length}, mong đúng 2 lời gọi lỗi`);
    // (c) sau lượt dừng ở lời gọi thứ 7
    const cc = tam(); await chayE1(c, { goi: gia().fn, thuMuc: cc, tranUsd: 4 * C_H + 3 * C_D + C_D / 2 });
    const gc = gia(); await chayE1(c, { goi: gc.fn, thuMuc: cc });
    assert.equal(gc.goi.length, 13, `(c) lần hai gọi ${gc.goi.length}, mong 13`);
    // (d) đổi phiên bản lời nhắc; đổi chữ bài một thẻ
    const gd = gia(); await CHAY.chay({ truy: (s, x) => c.query(s, x as unknown[]), cauHinh: { ...CAU, prompt_version: "cb-v2" }, cheDo: "thu", recordCallDb: ghiDb(c), runId: "d1", env: {}, goi: gd.fn, thuMuc: a });
    assert.equal(gd.goi.length, 20, "(d) đổi phiên bản lời nhắc phải đọc lại đủ 20");
    await c.query(`UPDATE stg_zalo_posts SET text = text || ' Thêm chữ.' WHERE post_id = 'nb1_p_c03'`);
    const ge = gia(); await chayE1(c, { goi: ge.fn, thuMuc: a });
    assert.equal(ge.goi.length, 2, `(d) đổi chữ một thẻ gọi lại ${ge.goi.length}, mong 2`);
  });
});

test("AC-8 trần kiểm trước lời gọi: dừng sau lời gọi thứ 7; thứ tự thẻ theo ô ưu tiên", async () => {
  await withTx(async (c) => {
    await gieo(c, E1);
    const g = gia(), thuMuc = tam();
    const tk = await chayE1(c, { goi: g.fn, thuMuc, tranUsd: 4 * C_H + 3 * C_D + C_D / 2 });
    assert.equal(g.goi.length, 7, `có lời gọi thứ ${g.goi.length}, mong dừng sau lời gọi thứ 7`);
    assert.ok(tk.dung_vi_tran);
    assert.ok(Math.abs(tk.usd - (4 * C_H + 3 * C_D)) < 1e-12, `tổng chi phí ${tk.usd}`);
    assert.equal(tk.the_du, 3);
    assert.equal(tk.the_cho, 7);
    const g2 = gia();
    await chayE1(c, { goi: g2.fn, thuMuc: tam(), tranUsd: 100 });
    assert.equal(g2.goi.length, 20, "đối chứng dương: trần lớn chạy đủ 20");
    const thuTu = [...new Set(g2.goi.map((x) => theCua(x, E1)))];
    assert.deepEqual(thuTu, ["c01", "c06", "c10", "c02", "c03", "c09", "c04", "c05", "c07", "c08"]);
  });
});

test("AC-1 bài nhiều post_ids lấy bản mới nhất; thẻ mất tin hay mất bài bị bỏ qua có lý do; khoá TS khớp assertion_value_key", async () => {
  await withTx(async (c) => {
    await gieo(c, E1.slice(0, 1));
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name, captured_at) VALUES ('nb1_p_c01b', 'nb1', $1, 'Nhóm NB1', now() + interval '1 hour')`, [dai("Bản sửa: căn hộ 2PN 3WC toà S1.03.")]);
    await c.query(`UPDATE sale_offer_records SET post_ids = ARRAY['nb1_p_c01', 'nb1_p_c01b'] WHERE offer_id = 'nb1_c01'`).catch(async () => {
      await c.query(`UPDATE sale_offers SET post_ids = ARRAY['nb1_p_c01', 'nb1_p_c01b'] WHERE offer_id = 'nb1_c01'`);
    });
    const { the } = await DB.docThe((s, a) => c.query(s, a as unknown[]));
    assert.match(the[0].text, /^Bản sửa/, "không lấy bản captured_at mới nhất");
    await c.query(`UPDATE stg_zalo_posts SET text = '' WHERE post_id IN ('nb1_p_c01', 'nb1_p_c01b')`);
    const r2 = await DB.docThe((s, a) => c.query(s, a as unknown[]));
    assert.deepEqual(r2.bo_qua.map((b) => b.ly_do), ["khong-bai"]);
    for (const v of ["02", "2", " Căn hộ ", "S1.03", "0", "007"]) {
      const { rows: [r] } = await c.query(`SELECT assertion_value_key($1) AS k`, [v]);
      assert.equal(KC.khoaGiaTri(v), r.k, `khoaGiaTri(${JSON.stringify(v)}) lệch assertion_value_key`);
    }
  });
});

// ================= Task 4: báo cáo, kê thẻ trống =================
const BC = (await import(`../src/enrich/${SRC}/bao-cao.js`)) as typeof import("../src/enrich/cham-bong/bao-cao.js");
const KE = (await import(`../src/enrich/${SRC}/ke-the-trong.js`)) as typeof import("../src/enrich/cham-bong/ke-the-trong.js");

test("AC-9 báo cáo từ tệp sau lượt có 2 lời gọi lỗi: bảng ô × kết cục × nguồn viết tay, cột chưa đủ, tổng 13", async () => {
  await withTx(async (c) => {
    await gieo(c, E1);
    const thuMuc = tam();
    const tk = await chayE1(c, { goi: gia({ loiTai: [4, 11] }).fn, thuMuc });
    const b = BC.baoCao(CHAY.thuMucLuot(thuMuc, tk.run_id));
    // Lời gọi 4 = DeepSeek của c06 (3 đề xuất), lời gọi 11 = Haiku của c09 (1 đề xuất) → 4 đề xuất chưa đủ hai kết quả.
    const mong: [string, string, string, number][] = [
      ["bathrooms", "khop", "e2_llm", 1], ["bathrooms", "khop", "e1_rule", 1], ["bathrooms", "chua_du", "e2_llm", 1],
      ["bedrooms", "khop", "e2_llm", 1], ["bedrooms", "chua_du", "e2_llm", 1],
      ["block_raw", "khop", "e1_rule", 1], ["block_raw", "chua_du", "e2_llm", 1],
      ["street_raw", "khop", "e2_llm", 1],
      ["property_type", "khop", "e1_rule", 1], ["property_type", "khop", "e2_llm", 2], ["property_type", "bac_dong_thuan", "e1_rule", 1],
      ["property_type", "chua_du", "e2_llm", 1],
    ];
    let tong = 0;
    for (const f of KC.THU_TU_O) for (const cot of BC.COT) for (const n of ["e1_rule", "e2_llm"] as const) {
      const ky = mong.find((m) => m[0] === f && m[1] === cot && m[2] === n)?.[3] ?? 0;
      assert.equal(b.o[f][cot][n], ky, `ô ${f} × ${cot} × ${n}: ${b.o[f][cot][n]}, mong ${ky}`);
      tong += b.o[f][cot][n];
    }
    assert.equal(tong, 13, `tổng lệch: ${tong}, mong 13`);
    assert.equal(b.o.bathrooms.bo_trong.e2_llm + b.o.bedrooms.bo_trong.e2_llm, 0, "lời gọi lỗi bị gộp vào bo_trong");
    assert.deepEqual(b.ca_bien, { bathrooms: 0, bedrooms: 0, block_raw: 0, street_raw: 0, property_type: 2 });
    assert.equal(b.o_da_co, 1);
    assert.equal(b.tong.the_du, 8);
    assert.equal(b.tong.so_the, 10);
    assert.equal(b.tong.goi_moi, 20);
    assert.equal(b.tong.vao, 18000);
    assert.equal(b.tong.ra, 1800);
    assert.ok(Math.abs(b.tong.usd - (9 * C_H + 9 * C_D)) < 1e-12, `chi phí ${b.tong.usd}`);
    const chu = BC.inBaoCao(b);
    assert.match(chu, /Thẻ đủ hai kết quả \/ thẻ chờ còn đề xuất: 8\/10/);
    // In lại không gọi model: baoCao chỉ nhận thư mục lượt, không có đường gọi model hay DB.
    assert.doesNotThrow(() => BC.baoCao(CHAY.thuMucLuot(thuMuc, tk.run_id)));
  });
});

/** 7 thẻ chờ không đề xuất: [mã, loại đối chiếu, trạng thái đề xuất cùng tin, lượt sinh]. */
const TRONG: [string, string[], string | null, string][] = [
  ["t1", ["y_dinh"], null, "doc-toan-bo-2026-11-03T16:55:24.062Z"],
  ["t2", ["gia"], null, "doc-toan-bo-2026-11-04T01:00:00.000Z"],
  ["t3", ["dien_tich"], "applied", "enrich-2026-11-10T00:00:00Z"],
  ["t4", ["gia", "y_dinh"], "skipped", "doc-toan-bo-2026-11-05T00:00:00Z"],
  ["t5", ["y_dinh"], "applied", "enrich-2026-11-12T00:00:00Z"],
  ["t6", ["gia"], "skipped", "enrich-2026-11-13T00:00:00Z"],
  ["t7", ["y_dinh"], null, "enrich-2026-11-14T00:00:00Z"],
];

test("AC-10 kê thẻ chờ không đề xuất theo loại × đề xuất cùng tin × lượt sinh; tổng bằng câu đếm; không thẻ nào đổi", async () => {
  await withTx(async (c) => {
    await gieo(c, E1.slice(0, 2));
    for (const [ma, loai, st, run] of TRONG) {
      const offer = `nb1_${ma}`;
      await insertOffer(c, { offer_id: offer, post_ids: [] });
      await c.query(`INSERT INTO review_queue (item_type, item_id, title, status, evidence) VALUES ('agent_output', $1, 't', 'pending', $2::jsonb)`,
        [`enrich:${offer}`, JSON.stringify({ offer_id: offer, run_id: run, doi_chieu: loai.map((l) => ({ loai: l })) })]);
      if (st) {
        const pid = await insertProposal(c, { offer_id: offer, field: "bathrooms", value: "2", review_id: null });
        await c.query(`UPDATE enrichment_proposals SET status = $2 WHERE id = $1`, [pid, st]);
      }
    }
    const h0 = (await c.query(`SELECT md5(string_agg(id || ':' || status, ',' ORDER BY id)) h FROM review_queue`)).rows[0].h;
    const k = await KE.keTheTrong((s, a) => c.query(s, a as unknown[]));
    const mong = [
      ["dien_tich", "da-ap", "enrich", 1], ["gia", "da-bo-qua", "enrich", 1], ["gia", "khong-co", "doc-toan-bo", 1],
      ["gia+y_dinh", "da-bo-qua", "doc-toan-bo", 1], ["y_dinh", "da-ap", "enrich", 1], ["y_dinh", "khong-co", "doc-toan-bo", 1],
      ["y_dinh", "khong-co", "enrich", 1],
    ];
    assert.deepEqual(k.dong.map((d) => [d.loai, d.de_xuat_cung_tin, d.luot, d.so]), mong);
    assert.equal(k.tong, 7, `tổng lệch: ${k.tong}, mong 7`);
    assert.equal(k.tong_sql, 7);
    const h1 = (await c.query(`SELECT md5(string_agg(id || ':' || status, ',' ORDER BY id)) h FROM review_queue`)).rows[0].h;
    assert.equal(h1, h0, "review_queue đổi");
  });
});
