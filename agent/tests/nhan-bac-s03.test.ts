// nhan-bac-s03.test.ts — hồ sơ _acceptance/nhan-bac-model-lon-s03 (KC1), phần không cần DB: gạt tầng A (NB-AC-4), câu trích
// (NB-AC-5), lỗi không dừng lượt (NB-AC-6), ba backend qua lớp model có sẵn (NB-AC-7). Model giả của AI SDK
// (MockLanguageModelV4) và model decision giả cùng giao diện EvaluationModelV4 — không gọi mạng, không cần khoá.
// Chữ bài là câu viết tay theo dạng tin thật, không chép bài thật; số điện thoại là số giả.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MockLanguageModelV4 } from "ai/test";
import { getDecisionModel, getModel, GATEWAY_MODEL } from "../src/runtime/models.js";
import { CAU_HOI_DECISIONS, hoiBai, parseReply, stripPII, TEN_MODEL, type Nhan } from "../src/agents/nhan-bac-s03.js";
import type { AiCallRecord } from "../src/runtime/ai-call-log.js";

const usage = (vao: number, ra: number) => ({
  inputTokens: { total: vao, noCache: vao, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: ra, text: ra, reasoning: undefined },
});

/** Model chữ giả: ghi lại prompt nhận được, trả `tra` (chuỗi) hoặc ném `loi`. */
function modelChu(tra: string | Error, nhan: string[] = [], cost?: string) {
  return new MockLanguageModelV4({
    modelId: "mock-chu",
    doGenerate: async (o: { prompt: unknown }) => {
      nhan.push(JSON.stringify(o.prompt));
      if (tra instanceof Error) throw tra;
      return {
        content: [{ type: "text", text: tra }],
        finishReason: { unified: "stop", raw: "stop" },
        usage: usage(300, 40),
        warnings: [],
        providerMetadata: cost ? { gateway: { cost } } : undefined,
      };
    },
  } as never);
}

/** Model decision giả theo giao diện EvaluationModelV4; trả lời theo hình tài liệu Vercel Decision (07/10/2026):
 *  answers.<tên> = { type: 'choice', choice, probabilities: { <giá trị>: xác suất } }, usage, providerMetadata.gateway.cost. */
function modelDecision(answers: Record<string, unknown> | Error, nhan: unknown[] = []) {
  return {
    specificationVersion: "v4",
    provider: "gateway",
    modelId: GATEWAY_MODEL.luna,
    supportedQuestionTypes: ["choice", "score", "boolean"],
    doEvaluate: async (o: unknown) => {
      nhan.push(o);
      if (answers instanceof Error) throw answers;
      return { answers, usage: { inputTokens: 280, outputTokens: 0 }, warnings: [], providerMetadata: { gateway: { cost: "0.00002800" } } };
    },
  } as never;
}

const ghiSo = (so: AiCallRecord[]) => async (r: AiCallRecord) => { so.push(r); };

// ---------- NB-AC-4: tầng A không rời máy ----------
const BAI_PII = [
  { text: "Bán căn 2PN 70m2 3,2 tỷ LH 0912345678", pii: "0912345678" },
  { text: "Cho thuê studio 6tr gọi +84 912 345 678", pii: "912 345 678" },
  { text: "Căn 3PN 95m2 5 tỷ, liên hệ 0912.345.678", pii: "0912.345.678" },
  { text: "Bán gấp 2PN 2,9 tỷ email abc.nha@gmail.com", pii: "abc.nha@gmail.com" },
  { text: "1PN 45m2 7tr zalo.me/0912345678 inbox", pii: "zalo.me/0912345678" },
];
/** Thân yêu cầu không được chứa chuỗi tầng A nào của bài. */
function kiemKhongPII(than: string, bai: (typeof BAI_PII)[number]) {
  if (than.includes(bai.pii)) assert.fail(`NB-AC-4 tầng A rời máy: «${bai.pii}» có trong thân yêu cầu`);
}

test("NB-AC-4 Haiku và Decisions: thân yêu cầu đã gạt SĐT/email/link; chữ trung tính đi nguyên văn", async () => {
  for (const bai of BAI_PII) {
    const nhanChu: string[] = [];
    await hoiBai("haiku", bai.text, { languageModel: modelChu('{"intent":"offer","kind":"sale","confidence":0.9,"quote":"2PN"}', nhanChu), recordCall: async () => {} });
    kiemKhongPII(nhanChu.join(""), bai);
    const nhanDec: unknown[] = [];
    await hoiBai("decisions", bai.text, {
      decisionModel: modelDecision({ intent: { type: "choice", choice: "offer", probabilities: { offer: 0.9 } }, kind: { type: "choice", choice: "sale" } }, nhanDec),
      recordCall: async () => {},
    });
    kiemKhongPII(JSON.stringify(nhanDec), bai);
  }
  // đối chứng dương: chữ không có tầng A đi nguyên văn
  const nhan: string[] = [];
  await hoiBai("haiku", "Căn 2PN view hồ 3,2 tỷ", { languageModel: modelChu("{}", nhan), recordCall: async () => {} });
  assert.ok(nhan.join("").includes("Căn 2PN view hồ 3,2 tỷ"), "NB-AC-4 đối chứng: chữ trung tính không tới model");
});

test("chiều đỏ NB-AC-4: thân chứa chữ chưa gạt → đỏ ghim «NB-AC-4 tầng A rời máy»", () => {
  assert.throws(() => kiemKhongPII(JSON.stringify(BAI_PII[0].text), BAI_PII[0]), /NB-AC-4 tầng A rời máy/);
});

test("NB-AC-4 chỉ chữ bài được gửi: hoiBai không nhận group_name/sender_name/conversation_id", () => {
  // Giao diện hoiBai(backend, text, opts) chỉ có chữ; trường nhóm/người không có đường vào thân yêu cầu.
  assert.equal(hoiBai.length, 2);
  assert.equal(stripPII("Nhóm A · Anh Tuấn 0912345678"), "Nhóm A · Anh Tuấn [phone]");
});

// ---------- NB-AC-5: câu trích ----------
function kiemTrich(p: ReturnType<typeof parseReply>, can: boolean | null, o: string) {
  if (p.quote_ok !== can) assert.fail(`NB-AC-5 trích giả lọt: ô «${o}» quote_ok ${p.quote_ok}, cần ${can}`);
}
test("NB-AC-5 trích có thật → true; trích bịa → false; trích khớp sau khi gạt SĐT → so trên bản gạt; Decisions → rỗng", async () => {
  const bai = "Bán căn 2PN 70m2 giá 3,2 tỷ LH 0912345678";
  kiemTrich(parseReply('{"intent":"offer","kind":"sale","quote":"giá 3,2 tỷ"}', bai), true, "có thật");
  kiemTrich(parseReply('{"intent":"offer","kind":"sale","quote":"giá 4 tỷ thu về"}', bai), false, "bịa");
  kiemTrich(parseReply('{"intent":"offer","kind":"sale","quote":"LH [phone]"}', bai), true, "khớp bản gạt");
  kiemTrich(parseReply('{"intent":"offer","kind":"sale","quote":"LH 0912345678"}', bai), false, "SĐT gốc không có trong bản gạt");
  const n = await hoiBai("decisions", bai, {
    decisionModel: modelDecision({ intent: { type: "choice", choice: "offer" }, kind: { type: "choice", choice: "sale" } }),
    recordCall: async () => {},
  });
  assert.equal(n.quote, null, "NB-AC-5 Decisions có câu trích");
  assert.equal(n.quote_ok, null, "NB-AC-5 Decisions có quote_ok");
});
test("chiều đỏ NB-AC-5: bản đột biến coi mọi trích là đúng → ô «bịa» đỏ ghim «NB-AC-5 trích giả lọt»", () => {
  const dotBien = { ...parseReply('{"intent":"offer","kind":"sale","quote":"giá 4 tỷ thu về"}', "Bán 2PN 3,2 tỷ"), quote_ok: true };
  assert.throws(() => kiemTrich(dotBien, false, "bịa"), /NB-AC-5 trích giả lọt/);
});

// ---------- NB-AC-6: lỗi không dừng lượt ----------
class APICallError extends Error { name = "AI_APICallError"; }
class TimeoutError extends Error { name = "TimeoutError"; }
const O_LOI: { o: string; model: () => MockLanguageModelV4; can: (n: Nhan) => boolean }[] = [
  { o: "JSON hỏng", model: () => modelChu("không phải JSON"), can: (n) => n.listing_intent === "unknown" && n.json_ok === false && n.error_kind === "json-hong" },
  { o: "intent lạ", model: () => modelChu('{"intent":"wanted","kind":"sale"}'), can: (n) => n.listing_intent === "unknown" && n.json_ok === true },
  { o: "từ chối", model: () => modelChu("Tôi không thể phân loại bài này."), can: (n) => n.listing_intent === "unknown" && n.error_kind === "json-hong" },
  { o: "lỗi mạng 500", model: () => modelChu(new APICallError("500")), can: (n) => n.listing_intent === "unknown" && n.error_kind === "AI_APICallError" },
  { o: "quá giờ", model: () => modelChu(new TimeoutError("timeout")), can: (n) => n.listing_intent === "unknown" && n.error_kind === "TimeoutError" },
];
test("NB-AC-6 năm kết cục lỗi → unknown + loại lỗi đúng; hoiBai không ném, mỗi lần một dòng ai_calls", async () => {
  const so: AiCallRecord[] = [];
  for (const x of O_LOI) {
    const n = await hoiBai("haiku", "Căn 2PN 3 tỷ", { languageModel: x.model(), recordCall: ghiSo(so) });
    assert.ok(x.can(n), `NB-AC-6 ô «${x.o}» → ${JSON.stringify({ i: n.listing_intent, j: n.json_ok, e: n.error_kind })}`);
  }
  assert.equal(so.length, O_LOI.length, "NB-AC-6 mỗi lần gọi phải ghi đúng một dòng ai_calls");
  assert.deepEqual(so.map((r) => r.ok), [false, true, false, false, false]);
  assert.ok(so.every((r) => r.viec === "nhan-bac-s03" && r.khach === "pipeline"));
});
test("chiều đỏ NB-AC-6: gọi model không qua hoiBai (không bắt lỗi) → ném, ghim «NB-AC-6 một lỗi dừng cả lượt»", async () => {
  const { generateText } = await import("ai");
  await assert.rejects(
    generateText({ model: modelChu(new APICallError("500")), prompt: "x" }).catch((e) => { throw new Error(`NB-AC-6 một lỗi dừng cả lượt: ${e.name}`); }),
    /NB-AC-6 một lỗi dừng cả lượt/,
  );
});

// ---------- NB-AC-7: ba backend qua lớp model có sẵn ----------
test("NB-AC-7 getModel/getDecisionModel trả model Gateway đúng tên; Qwen giữ MTPLX", () => {
  const h = getModel("haiku") as { modelId: string; provider: string };
  assert.equal(h.modelId, "anthropic/claude-haiku-5.5");
  assert.match(h.provider, /gateway/);
  const d = getDecisionModel() as unknown as { modelId: string; provider: string };
  assert.equal(d.modelId, "openai/gpt-6-luna");
  assert.match(d.provider, /gateway/);
  const q = getModel("qwen27b") as { modelId: string };
  assert.equal(q.modelId, "qwen3.8-27b-local");
  assert.equal(TEN_MODEL.haiku, "gateway:anthropic/claude-haiku-5.5");
});

/** Đọc trả lời Decisions về một hình nhãn. */
async function docDecisions(answers: Record<string, unknown>) {
  const nhan: unknown[] = [];
  const n = await hoiBai("decisions", "Căn 2PN 70m2 14tr", { decisionModel: modelDecision(answers, nhan), recordCall: async () => {} });
  return { n, nhan };
}
test("NB-AC-7 Decisions: hai câu choice intent, kind; trả lời theo hình tài liệu đọc ra cùng hình nhãn, chi phí thật", async () => {
  const { n, nhan } = await docDecisions({
    intent: { type: "choice", choice: "offer", probabilities: { offer: 0.94, inquiry: 0.04, not_listing: 0.02 } },
    kind: { type: "choice", choice: "rent_lt", probabilities: { sale: 0.1, rent_lt: 0.88, none: 0.02 } },
  });
  const goi = nhan[0] as { questions: Record<string, { type: string; criteria: Record<string, unknown> }> };
  assert.deepEqual(Object.keys(goi.questions), ["intent", "kind"]);
  assert.equal(goi.questions.intent.type, "choice");
  assert.deepEqual(Object.keys(goi.questions.intent.criteria), Object.keys(CAU_HOI_DECISIONS.intent.criteria));
  assert.deepEqual([n.listing_intent, n.kind, n.probability, n.cost_usd], ["offer", "rent_lt", 0.94, 0.000028]);
  const k = await docDecisions({ intent: { type: "choice", choice: "inquiry" }, kind: { type: "choice", choice: "sale" } });
  assert.deepEqual([k.n.listing_intent, k.n.kind], ["inquiry", null], "NB-AC-7 Yêu cầu không được mang kind");
});
test("chiều đỏ NB-AC-7: trả lời đổi tên câu hỏi intent → đỏ ghim «NB-AC-7 đọc sai trả lời Decisions»", async () => {
  const { n } = await docDecisions({ y_dinh: { type: "choice", choice: "offer" }, kind: { type: "choice", choice: "sale" } });
  assert.throws(() => { if (n.listing_intent !== "offer") assert.fail(`NB-AC-7 đọc sai trả lời Decisions: ${n.listing_intent}/${n.error_kind}`); },
    /NB-AC-7 đọc sai trả lời Decisions/);
});
test("NB-AC-7 Qwen và Haiku đọc ra cùng hình nhãn; Haiku mang chi phí Gateway, Qwen không", async () => {
  const tra = '{"intent":"offer","kind":"sale","confidence":0.8,"quote":"3,2 tỷ"}';
  const q = await hoiBai("qwen", "Bán 2PN 3,2 tỷ", { languageModel: modelChu(tra), recordCall: async () => {} });
  const h = await hoiBai("haiku", "Bán 2PN 3,2 tỷ", { languageModel: modelChu(tra, [], "0.00004100"), recordCall: async () => {} });
  const hinh = (x: Nhan) => [x.listing_intent, x.kind, x.probability, x.quote, x.quote_ok, x.json_ok];
  assert.deepEqual(hinh(q), hinh(h));
  assert.deepEqual([q.model, q.cost_usd, h.model, h.cost_usd], [TEN_MODEL.qwen, null, TEN_MODEL.haiku, 0.000041]);
});

// ---------- NB-AC-8: đo trên tập vàng ----------
import { chayLo, doTapVang, type DongNhan, type Vang } from "../src/agents/nhan-bac-s03.js";
const VANG: Vang[] = [
  ...["v1", "v2", "v3", "v4"].map((id) => ({ post_id: id, listing_intent: "offer", kind: "sale" })),
  ...["v5", "v6"].map((id) => ({ post_id: id, listing_intent: "offer", kind: "rent_lt" })),
  ...["v7", "v8", "v9"].map((id) => ({ post_id: id, listing_intent: "inquiry", kind: null })),
  ...["v10", "v11", "v12"].map((id) => ({ post_id: id, listing_intent: "not_listing", kind: null })),
];
const du = (post_id: string, listing_intent: string, kind: string | null, x: Partial<DongNhan> = {}) =>
  ({ post_id, listing_intent, kind, json_ok: true, quote_ok: true, latency_ms: 100, cost_usd: 0.001, ...x }) as DongNhan;
const DU = [
  du("v1", "offer", "sale"), du("v2", "offer", "sale"), du("v3", "offer", "sale"), du("v4", "offer", "sale", { quote_ok: false }),
  du("v5", "offer", "rent_lt"), du("v6", "offer", "sale"),                       // v6: đúng ý định, sai bán/thuê
  du("v7", "inquiry", null), du("v8", "inquiry", null), du("v9", "inquiry", null),
  du("v10", "not_listing", null), du("v11", "unknown", null, { json_ok: false }), du("v12", "offer", "sale"),
];
/** Đếm độc lập từ cùng mảng kết quả — không gọi doTapVang. */
const demTay = () => ({
  yDinhDung: DU.filter((d) => VANG.find((v) => v.post_id === d.post_id)!.listing_intent === d.listing_intent).length,
  banThueDung: VANG.filter((v) => v.listing_intent === "offer").filter((v) => { const d = DU.find((x) => x.post_id === v.post_id)!; return d.listing_intent === "offer" && d.kind === v.kind; }).length,
});
function kiemBangDo(b: ReturnType<typeof doTapVang>) {
  const tay = demTay();
  const sai = [];
  if (b.yDinhDung !== 10 || b.yDinhDung !== tay.yDinhDung) sai.push(`ý định ${b.yDinhDung}/12`);
  if (b.banThueDung !== 5 || b.offer !== 6 || b.banThueDung !== tay.banThueDung) sai.push(`bán/thuê ${b.banThueDung}/${b.offer}`);
  if (b.yeuCauBat !== 3 || b.yeuCau !== 3) sai.push(`Yêu cầu ${b.yeuCauBat}/${b.yeuCau}`);
  if (b.jsonHong !== 1 || b.trichGia !== 1) sai.push(`JSON hỏng ${b.jsonHong} · trích giả ${b.trichGia}`);
  if (sai.length) assert.fail(`NB-AC-8 bán/thuê đo sai mẫu số hoặc số lệch: ${sai.join(" · ")}`);
}
test("NB-AC-8 tập vàng 12 bài: ý định 10/12, bán/thuê trên offer 5/6, Yêu cầu 3/3, JSON hỏng 1, trích giả 1 — khớp đếm tay", () => {
  const b = doTapVang(DU, VANG);
  kiemBangDo(b);
  assert.equal(b.n, 12);
  assert.ok(!JSON.stringify(b).includes("Căn"), "NB-AC-8 bảng đo có chữ bài");
});
test("chiều đỏ NB-AC-8: bản đột biến tính bán/thuê trên mọi bài → đỏ ghim «NB-AC-8 bán/thuê đo sai mẫu số»", () => {
  const b = doTapVang(DU, VANG);
  const dotBien = { ...b, offer: 12, banThueDung: DU.filter((d) => d.kind === VANG.find((v) => v.post_id === d.post_id)!.kind).length };
  assert.throws(() => kiemBangDo(dotBien), /NB-AC-8 bán\/thuê đo sai mẫu số/);
});

// ---------- NB-AC-9: trần chi phí ----------
const LO10 = Array.from({ length: 10 }, (_, i) => ({ post_id: `t${i}`, text: `Căn 2PN ${60 + i}m2 3 tỷ`, text_hash: `h${i}` }));
const hoiGia = (dem: { n: number }) => async (): Promise<Nhan> => {
  dem.n++;
  return { model: "gia", listing_intent: "offer", kind: "sale", probability: 0.9, probabilities: null, quote: null, quote_ok: null,
    json_ok: true, error_kind: null, latency_ms: 1, cost_usd: 0.01 };
};
function kiemTran(soYeuCau: number, dungTran: boolean) {
  if (soYeuCau > 3 || !dungTran) assert.fail(`NB-AC-9 vượt trần chi phí: backend nhận ${soYeuCau} yêu cầu`);
}
test("NB-AC-9 trần 0,035 USD, mỗi bài 0,01 → đúng 3 yêu cầu, dừng trước bài thứ 4, đã dùng 0,03", async () => {
  const dem = { n: 0 };
  const kq = await chayLo({ backend: "haiku", bai: LO10, runId: "r", tranUsd: 0.035, hoi: hoiGia(dem), ghi: null });
  kiemTran(dem.n, kq.dungTran);
  assert.equal(dem.n, 3);
  assert.equal(Number(kq.tongUsd.toFixed(4)), 0.03);
});
test("chiều đỏ NB-AC-9: bản đột biến kiểm trần SAU khi gửi → backend nhận 4 yêu cầu, ghim «NB-AC-9 vượt trần chi phí»", async () => {
  const dem = { n: 0 };
  let tong = 0;
  const hoi = hoiGia(dem);
  for (const _ of LO10) { const n = await hoi(); tong += n.cost_usd ?? 0; if (tong > 0.035) break; }
  assert.throws(() => kiemTran(dem.n, true), /NB-AC-9 vượt trần chi phí/);
});

// ---------- NB-AC-7 (bổ sung S4 tập vàng): Qwen nhãn bạc tắt suy nghĩ như classify-s03 ----------
import { generateText as goiThat } from "ai";
import { getModel as layModel } from "../src/runtime/models.js";
async function thanGui(ten: "qwen27b" | "qwen27b-khong-nghi") {
  const cu = globalThis.fetch;
  let than: Record<string, unknown> = {};
  globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
    than = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ id: "x", object: "chat.completion", created: 0, model: "m",
      choices: [{ index: 0, message: { role: "assistant", content: "{}" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), { headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try { await goiThat({ model: layModel(ten), prompt: "p", temperature: 0 }); } finally { globalThis.fetch = cu; }
  return than;
}
test("NB-AC-7 Qwen nhãn bạc gửi chat_template_kwargs.enable_thinking=false; bản qwen27b thường không đổi", async () => {
  const t = await thanGui("qwen27b-khong-nghi");
  assert.deepEqual(t.chat_template_kwargs, { enable_thinking: false }, "NB-AC-7 Qwen nhãn bạc còn bật suy nghĩ");
  assert.equal(t.temperature, 0);
  const thuong = await thanGui("qwen27b");
  assert.equal(thuong.chat_template_kwargs, undefined, "NB-AC-7 bản qwen27b thường bị đổi theo");
});
test("chiều đỏ NB-AC-7: thân của bản qwen27b thường → bộ kiểm tắt-suy-nghĩ đỏ", async () => {
  const t = await thanGui("qwen27b");
  assert.throws(() => assert.deepEqual(t.chat_template_kwargs, { enable_thinking: false }, "NB-AC-7 Qwen nhãn bạc còn bật suy nghĩ"), /NB-AC-7 Qwen nhãn bạc còn bật suy nghĩ/);
});
