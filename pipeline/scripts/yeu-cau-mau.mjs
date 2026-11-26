// yeu-cau-mau.mjs — ma trận bài viết trước của YC0 (bang-yeu-cau-noi-lai), dùng chung cho thước thuần (yeu-cau.test.mjs, AC-3) và
// thước DB (yeu-cau.itest.mjs, AC-4). Chữ là chữ dựng, không phải bài thật. Nhãn dựng đúng các cột của bảng silver_labels (065);
// itest đối chiếu COT_NHAN với information_schema của bảng thật (round-trip khuôn bảng) rồi chèn bằng câu ghi của bộ gắn nhãn thật.

/** Cột của silver_labels theo thứ tự bảng (065). */
export const COT_NHAN = ["label_id", "source_code", "post_id", "text_hash", "model", "prompt_version", "listing_intent", "kind",
  "probability", "probabilities", "quote", "quote_ok", "json_ok", "error_kind", "latency_ms", "cost_usd", "run_id", "labeled_at"];

/** Tên model Haiku mà bộ gắn nhãn ghi (agent/src/agents/nhan-bac-s03.ts TEN_MODEL.haiku). */
export const MODEL_HAIKU = "gateway:anthropic/claude-haiku-5.5";
export const MODEL_KHAC = "mtplx:qwen3.8-27b-local";

/**
 * Một dòng nhãn đủ cột silver_labels.
 * @param {string} post_id
 * @param {{ id: number, intent: string|null, json_ok?: boolean, at: string, model?: string, prompt?: string, p?: number|null }} o
 */
export function nhan(post_id, o) {
  return {
    label_id: o.id, source_code: "S03", post_id, text_hash: `bam-${post_id}-${o.prompt ?? "v2"}`, model: o.model ?? MODEL_HAIKU,
    prompt_version: o.prompt ?? "nb-s03-v2", listing_intent: o.intent, kind: null, probability: o.p ?? 0.8, probabilities: null,
    quote: null, quote_ok: null, json_ok: o.json_ok ?? true, error_kind: o.json_ok === false ? "JsonHong" : null, latency_ms: 900,
    cost_usd: 0.0001, run_id: "yc0-mau", labeled_at: o.at,
  };
}

const L = (value) => ({ value, tier: "observed", method: "parser", rule_id: "yeu-cau-luat", label_id: null });
const N = (value, label_id) => ({ value, tier: "inferred", method: "e2_llm", rule_id: "yeu-cau-nhan-haiku", label_id });

/**
 * Ma trận AC-3: [mã ca, chữ bài, nhãn của bài, tập dòng phát biểu mong, trạng thái dòng Yêu cầu mong (null = không dòng)].
 * Mã ca là đuôi post_id. `nhom` là tên nhóm (bài thử mang nhóm «TEST»).
 */
export const MA_TRAN = [
  { ca: "luat-va-nhan", chu: "Cần thuê căn hộ 2PN tầm 12 triệu", nhan: [{ id: 1, intent: "inquiry", at: "2026-11-20T01:00:00Z" }],
    mong: [L("inquiry"), N("inquiry", 1)], trang_thai: "song" },
  { ca: "luat-chua-nhan", chu: "Cần mua căn hộ 2PN tầm 3 tỷ quanh khu này", nhan: [], mong: [L("inquiry")], trang_thai: "song" },
  { ca: "luat-nhan-offer", chu: "Khách em cần căn 1PN full đồ, ai có căn gửi em", nhan: [{ id: 3, intent: "offer", at: "2026-11-20T01:00:00Z" }],
    mong: [L("inquiry"), N("offer", 3)], trang_thai: "song" },
  { ca: "chi-nhan-khong-loai", chu: "Studio full đồ quanh khu này gửi em với ạ", nhan: [{ id: 4, intent: "inquiry", at: "2026-11-20T01:00:00Z" }],
    mong: [N("inquiry", 4)], trang_thai: "cho-duyet" },
  { ca: "chi-nhan-loai-tin", chu: "Bán gấp căn hộ 2PN 68m2 giá 3,2 tỷ sổ hồng", nhan: [{ id: 5, intent: "inquiry", at: "2026-11-20T01:00:00Z" }],
    mong: [], trang_thai: null },
  { ca: "tin-rao-khong-nhan", chu: "Cho thuê căn hộ 1PN 45m2 giá 8 triệu/tháng", nhan: [], mong: [], trang_thai: null },
  { ca: "bai-thu", chu: "Cần thuê căn hộ 3PN tầm 20 triệu", nhom: "TEST", nhan: [{ id: 7, intent: "inquiry", at: "2026-11-20T01:00:00Z" }],
    mong: [], trang_thai: null },
  { ca: "nhan-hong-de", chu: "Nhà mình còn mấy căn đẹp lắm, ib em nhé", nhan: [
    { id: 8, intent: "offer", at: "2026-11-20T01:00:00Z" },
    { id: 9, intent: "inquiry", json_ok: false, at: "2026-11-21T01:00:00Z", prompt: "nb-s03-v3" },
  ], mong: [N("offer", 8)], trang_thai: null },
  { ca: "nhan-moi-doi-y", chu: "Căn góc view hồ, inbox em để biết thêm", nhan: [
    { id: 10, intent: "inquiry", at: "2026-11-20T01:00:00Z" },
    { id: 11, intent: "offer", at: "2026-11-21T01:00:00Z", prompt: "nb-s03-v3" },
  ], mong: [N("offer", 11)], trang_thai: null },
  { ca: "nhan-khong-phai-haiku", chu: "Có ai biết chỗ gửi xe gần đây không", nhan: [{ id: 12, intent: "inquiry", at: "2026-11-20T01:00:00Z", model: MODEL_KHAC }],
    mong: [], trang_thai: null },
];

/** Dòng phát biểu rút gọn để so (bỏ khoá chủ thể, giữ trường so của AC-3), sắp ổn định. */
export function rutGon(dong) {
  return dong.map((d) => ({
    value: d.value, tier: d.evidence_tier, method: d.method, rule_id: d.rule_id ?? null,
    label_id: d.evidence?.label_id == null ? null : Number(d.evidence.label_id),
  })).sort((a, b) => `${a.rule_id}|${a.value}`.localeCompare(`${b.rule_id}|${b.value}`));
}
