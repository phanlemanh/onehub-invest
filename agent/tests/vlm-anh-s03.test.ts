// vlm-anh-s03.test.ts — hồ sơ _acceptance/vlm-anh-tin-s03, phần không cần DB: thân yêu cầu thật của ba model (VLM-AC-3), bài hết ảnh
// (VLM-AC-2b), đọc trả lời, gộp nhãn, trần chi phí. Máy chủ HTTP giả thay Gateway và MTPLX, không gọi mạng, không cần khoá.
// Chữ bài viết tay, số điện thoại là số giả, ảnh là byte tự sinh trong thư mục tạm.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Phan = { text?: string; status?: number; cost?: string };
const yeuCau: { url: string; model: string | undefined; than: string; json: any }[] = [];
let traLoi: () => Phan = () => ({ text: "{}" });
const sv = createServer((req, res) => {
  let s = "";
  req.on("data", (d) => (s += d));
  req.on("end", () => {
    yeuCau.push({ url: req.url ?? "", model: req.headers["ai-language-model-id"] as string | undefined, than: s, json: JSON.parse(s) });
    const p = traLoi();
    res.setHeader("content-type", "application/json");
    if (p.status) { res.writeHead(p.status); res.end(JSON.stringify({ error: { message: "canh-thong-diep-loi", type: "internal_server_error" } })); return; }
    if ((req.url ?? "").includes("/language-model")) {
      res.end(JSON.stringify({ content: [{ type: "text", text: p.text }], finishReason: { unified: "stop", raw: "stop" }, usage: { inputTokens: { total: 1600, noCache: 1600 }, outputTokens: { total: 200, text: 200 } }, warnings: [], ...(p.cost ? { providerMetadata: { gateway: { cost: p.cost } } } : {}) }));
    } else {
      res.end(JSON.stringify({ id: "x", object: "chat.completion", created: 1, model: "m", choices: [{ index: 0, message: { role: "assistant", content: p.text }, finish_reason: "stop" }], usage: { prompt_tokens: 1600, completion_tokens: 200, total_tokens: 1800 } }));
    }
  });
});
await new Promise<void>((r) => sv.listen(0, "127.0.0.1", r));
const CONG = (sv.address() as AddressInfo).port;
process.env.AI_GATEWAY_BASE_URL = `http://127.0.0.1:${CONG}/gw`;
process.env.AI_GATEWAY_API_KEY = "khoa-gia";
process.env.MTPLX_URL = `http://127.0.0.1:${CONG}/v1`;
(globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;
const { CAU_HOI, chayLo, coUrl, DEEPSEEK_MODEL, docTraLoi, gopNhan, hoiAnh, hoiTuTep, PROMPT_SHA, TEN_MODEL, tuyChonGateway, uocMotAnh, VLM_MODELS } = await import("../src/agents/vlm-anh-s03.js");
const { docCo } = await import("../scripts/vlm-anh-run.js");
after(() => sv.close());

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const khongGhi = async () => {};
const TRA_TOT = JSON.stringify({ loai_anh: "bang-gia", lo_nguon: false, price_vnd: 3200000000, property_type: "apartment", quote: "Giá 3,2 tỷ" });

// Giá trị canh cho từng trường cấm — có trong dòng stg mồi, không được có trong thân yêu cầu.
const SNAP_CANH = "hanoi__zalo-agent__snapshot-canh";
const TEP_CANH = "ten-tep-canh.jpg";
const DONG_STG = {
  post_id: "bai-canh-01", snapshot_id: SNAP_CANH, agent_id: "agent-canh", group_name: "Nhóm-canh-01", sender_name: "Người-canh-01", sender_id: "sender-canh-01", conversation_id: "conv-canh-01",
  text: "chữ-bài-canh-01 https://f1.zdn.vn/canh/anh.jpg gọi 0912345678",
};
const CANH = ["chữ-bài-canh-01", "zdn.vn", "0912345678", "Nhóm-canh-01", "Người-canh-01", "sender-canh-01", "conv-canh-01", "agent-canh", SNAP_CANH, TEP_CANH, "bai-canh-01"];

/** Thân yêu cầu không được chứa giá trị canh nào, không URL, không SĐT. */
function kiemKhongLo(than: string) {
  for (const c of CANH) if (than.includes(c)) assert.fail(`VLM-AC-3 lộ khỏi máy: «${c}» có trong thân yêu cầu`);
  if (/https?:\/\//.test(than)) assert.fail("VLM-AC-3 lộ khỏi máy: có URL trong thân yêu cầu");
  if (/(?:\+84|\b0)\d{9}\b/.test(than)) assert.fail("VLM-AC-3 lộ khỏi máy: có SĐT trong thân yêu cầu");
}

/** Mọi phần ảnh trong thân yêu cầu, chuẩn hoá về base64 trần. */
function anhTrongThan(j: any): string[] {
  const goBo = (s: string) => s.replace(/^data:[^,]*,/, "");
  // Gateway gửi tệp dạng { type: "data", data: <base64> } của giao diện model v4.
  const gw = (j.prompt ?? []).flatMap((m: any) => (Array.isArray(m.content) ? m.content : [])).filter((p: any) => p.type === "file").map((p: any) => goBo(String(p.data?.data ?? p.data)));
  const chat = (j.messages ?? []).flatMap((m: any) => (Array.isArray(m.content) ? m.content : [])).filter((p: any) => p.type === "image_url").map((p: any) => goBo(String(p.image_url.url)));
  return [...gw, ...chat];
}

function dungAnh(t: { after: (f: () => void) => void }) {
  const goc = mkdtempSync(join(tmpdir(), "vlm-agent-"));
  t.after(() => rmSync(goc, { recursive: true, force: true }));
  const bytes = Buffer.concat([JPEG, Buffer.from("anh-canh")]);
  const dir = join(goc, "hanoi", SNAP_CANH, "media");
  mkdirSync(dir, { recursive: true });
  const tep = join(dir, TEP_CANH);
  writeFileSync(tep, bytes);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { goc, bytes, tep, sha256 };
}

test("VLM-AC-3 ba model: mỗi thân một ảnh đúng byte cộng câu hỏi cố định, cờ Gateway đúng, không lộ trường nào", async (t) => {
  const { bytes, tep, sha256 } = dungAnh(t);
  const bai = { ...DONG_STG, text_hash: "h", ly_do: ["thieu_gia"], anh: [{ sha256, tep, mime: "image/jpeg", nguon: "ghep", so_bai_dung_chung: 1 }] };
  // Đối chứng dương: dòng mồi chứa đủ giá trị canh, nên «không lộ» dưới đây là thước thật.
  const goc = JSON.stringify(bai);
  for (const c of CANH) assert.ok(goc.includes(c), `VLM-AC-3 fixture thiếu giá trị canh ${c}`);

  const MA_TRAN = [
    { m: "haiku", gw: true, id: "anthropic/claude-haiku-5.5", only: undefined },
    { m: "deepseek", gw: true, id: DEEPSEEK_MODEL, only: ["baseten"] },
    { m: "qwen", gw: false, id: undefined, only: undefined },
  ] as const;
  assert.equal(MA_TRAN.length, VLM_MODELS.length);
  assert.equal(DEEPSEEK_MODEL, "deepseek/deepseek-v4.1-flash-1017");
  traLoi = () => ({ text: TRA_TOT });
  const b64 = bytes.toString("base64");
  for (const x of MA_TRAN) {
    yeuCau.length = 0;
    const kq = await chayLo({ model: x.m, bai: [bai], runId: "r", tranUsd: 1, hoi: hoiTuTep(x.m, { recordCall: khongGhi }), ghi: null });
    assert.equal(yeuCau.length, 1, `VLM-AC-3 ${x.m} phải đúng một yêu cầu`);
    assert.equal(kq.dong[0].error_kind, null, `VLM-AC-3 ${x.m} đọc không thành công`);
    const y = yeuCau[0];
    assert.deepEqual(anhTrongThan(y.json), [b64], `VLM-AC-3 ${x.m} ảnh trong thân sai byte hoặc sai số lượng`);
    assert.ok(y.than.includes(JSON.stringify(CAU_HOI).slice(1, -1)), `VLM-AC-3 ${x.m} thiếu câu hỏi cố định`);
    kiemKhongLo(y.than);
    if (x.gw) {
      assert.equal(y.model, x.id, "VLM-AC-3 model Gateway sai");
      const go = y.json.providerOptions?.gateway;
      assert.equal(go?.zeroDataRetention, true, "VLM-AC-3 thiếu cờ không giữ dữ liệu");
      assert.equal(go?.disallowPromptTraining, true, "VLM-AC-3 thiếu cờ không huấn luyện");
      assert.deepEqual(go?.only, x.only, "VLM-AC-3 danh sách nhà cung cấp sai");
    } else {
      assert.ok(y.url.endsWith("/chat/completions"), "VLM-AC-3 Qwen không đi MTPLX");
      assert.equal(y.json.chat_template_kwargs?.enable_thinking, false, "VLM-AC-3 Qwen còn bật suy nghĩ");
    }
  }
});

test("chiều đỏ VLM-AC-3: thân mang giá trị canh, URL hoặc SĐT → thước đỏ ghim «VLM-AC-3 lộ khỏi máy»", () => {
  for (const c of [...CANH, "https://x.test/a", "gọi 0987654321 nhé"]) assert.throws(() => kiemKhongLo(`{"a":"${c}"}`), /VLM-AC-3 lộ khỏi máy/);
  assert.doesNotThrow(() => kiemKhongLo(`{"a":"data:image/jpeg;base64,/9j/4AAQ"}`));
});

test("VLM-AC-3 phần chữ còn URL: 0 yêu cầu, error_kind lo-url; câu hỏi cố định sạch URL", async (t) => {
  const { tep, sha256 } = dungAnh(t);
  assert.equal(coUrl(CAU_HOI), false, "VLM-AC-3 câu hỏi cố định có URL");
  yeuCau.length = 0;
  for (const m of VLM_MODELS) {
    const kq = await chayLo({
      model: m, bai: [{ post_id: "p", text_hash: "h", ly_do: [], anh: [{ sha256, tep, mime: "image/jpeg", nguon: "rieng", so_bai_dung_chung: 1 }] }], runId: "r", tranUsd: 1, ghi: null,
      hoi: hoiTuTep(m, { recordCall: khongGhi, cauHoi: "Đọc ảnh https://f1.zdn.vn/x.jpg" }),
    });
    assert.equal(kq.dong[0].error_kind, "lo-url", "VLM-AC-3 thiếu error_kind lo-url");
  }
  assert.equal(yeuCau.length, 0, "VLM-AC-3 có yêu cầu đi khi chữ còn URL");
  // Đối chứng: cùng ảnh, câu hỏi sạch thì có yêu cầu đi.
  traLoi = () => ({ text: TRA_TOT });
  await hoiTuTep("qwen", { recordCall: khongGhi })({ tep, mime: "image/jpeg" });
  assert.equal(yeuCau.length, 1);
});

const lib = await (async () => {
  try {
    // @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
    return await import("../../pipeline/lib/vlm-anh.mjs");
  } catch {
    return null; // job CI agent không cài `pg` của pipeline
  }
})();

test("VLM-AC-2b bài hết ảnh: 0 yêu cầu, không có dòng nhãn", { skip: lib ? false : "thiếu phụ thuộc pipeline" }, async (t) => {
  const { goc, tep, sha256 } = dungAnh(t);
  const post = { post_id: "het-anh", text: "Bán căn hộ 2PN 70m2", snapshot_id: SNAP_CANH, posted_at: "2099-01-01T00:00:00Z" };
  const media = (media_files: unknown[]) => new Map([[post.post_id, { snapshot_id: SNAP_CANH, media_files }]]);
  const { tap, loai } = lib.chonTapDoc([post], media([{ file: "media/khong-co.jpg", sha256: "a".repeat(64) }, { file: "media/x.jpg", error: "hong" }]), { goc });
  assert.equal(tap.length, 0, "VLM-AC-2b bài hết ảnh vẫn vào tập đọc");
  assert.equal(loai[0].ly_do, "het-anh");
  yeuCau.length = 0;
  const kq = await chayLo({ model: "qwen", bai: tap, runId: "r", tranUsd: 1, hoi: hoiTuTep("qwen", { recordCall: khongGhi }), ghi: null });
  assert.equal(yeuCau.length, 0, "VLM-AC-2b có yêu cầu tới model");
  assert.equal(kq.dong.length, 0, "VLM-AC-2b có dòng nhãn");
  // Đối chứng: cùng bài, entry trỏ tệp thật thì có ảnh và có yêu cầu.
  const { tap: co } = lib.chonTapDoc([post], media([{ file: `media/${TEP_CANH}`, sha256 }]), { goc });
  assert.equal(co[0].anh[0].tep, tep);
  traLoi = () => ({ text: TRA_TOT });
  await chayLo({ model: "qwen", bai: co, runId: "r", tranUsd: 1, hoi: hoiTuTep("qwen", { recordCall: khongGhi }), ghi: null });
  assert.equal(yeuCau.length, 1);
});

test("VLM-AC-6 đọc trả lời: JSON hỏng; giá trị lạ làm rỗng đúng trường, các trường khác giữ; quote đã gạt SĐT", () => {
  assert.equal(docTraLoi("không phải json").json_ok, false, "VLM-AC-6 JSON hỏng không nhận ra");
  const la = docTraLoi(JSON.stringify({ loai_anh: "bia-mo", property_type: "lau-dai", price_vnd: "3 tỷ", bedrooms_total: 2.5, living_area_m2: 70, unit_number: 12, building_name: "S2", quote: "LH 0912345678" }));
  assert.equal(la.json_ok, true);
  assert.deepEqual(la.truong_la.sort(), ["bedrooms_total", "loai_anh", "price_vnd", "property_type", "unit_number"]);
  assert.deepEqual([la.price_vnd, la.property_type, la.bedrooms_total, la.loai_anh, la.unit_number], [null, null, null, null, null]);
  assert.equal(la.living_area_m2, 70);
  assert.equal(la.building_name, "S2");
  assert.ok(!la.quote!.includes("0912345678"), "VLM-AC-4 quote còn SĐT");
  assert.equal(docTraLoi(JSON.stringify({ property_type: "unknown" })).truong_la.length, 0, "unknown thuộc sổ, chỉ là không thể hiện");
  assert.equal(docTraLoi("```json\n" + TRA_TOT + "\n```").price_vnd, 3200000000);
});

const kq = (x: Record<string, unknown>) => ({ ...docTraLoi(JSON.stringify(x)), error_kind: null, latency_ms: 1, cost_usd: null, chi_usd: 0 });
const baiHai = { post_id: "p", text_hash: "h", ly_do: ["thieu_gia"], anh: [{ sha256: "a", tep: "", mime: "", nguon: "rieng", so_bai_dung_chung: 3 }, { sha256: "b", tep: "", mime: "", nguon: "ghep", so_bai_dung_chung: 1 }] };

test("VLM-AC-10 gộp nhãn: một giá trị thì lấy, hai giá trị khác nhau thì rỗng kèm xung_dot, rỗng không tính xung đột", () => {
  const trai = gopNhan(baiHai, [kq({ price_vnd: 1e9, bedrooms_total: 2 }), kq({ price_vnd: 2e9, bedrooms_total: 2 })], { sha: PROMPT_SHA }).probabilities;
  assert.equal(trai.price_vnd, null, "VLM-AC-10 hai giá khác nhau phải rỗng");
  assert.deepEqual(trai.xung_dot, ["price_vnd"]);
  assert.equal(trai.bedrooms_total, 2);
  const mot = gopNhan(baiHai, [kq({ price_vnd: 1e9 }), kq({})], { sha: PROMPT_SHA }).probabilities;
  assert.equal(mot.price_vnd, 1e9, "VLM-AC-10 giá + rỗng phải ra giá");
  assert.deepEqual(mot.xung_dot, []);
  assert.deepEqual([mot.so_anh, mot.so_anh_ghep], [1, 1]);
  assert.equal(mot.nguon, "anh");
  assert.equal(mot.prompt_sha, PROMPT_SHA);
});

test("VLM-AC-6 trần: dừng trước ảnh vượt, trả lời không kèm chi phí tính theo đơn giá; ảnh chưa xử thì bài không có dòng", async () => {
  traLoi = () => ({ text: TRA_TOT });
  const bai = ["a", "b", "c"].map((s) => ({ post_id: s, text_hash: "h", ly_do: [], anh: [{ sha256: s, tep: "", mime: "image/jpeg", nguon: "rieng", so_bai_dung_chung: 1 }] }));
  let goi = 0;
  const hoi = async () => { goi += 1; return { ...docTraLoi(TRA_TOT), error_kind: null, latency_ms: 1, cost_usd: null, chi_usd: uocMotAnh("haiku") }; };
  const dung = await chayLo({ model: "haiku", bai, runId: "r", tranUsd: uocMotAnh("haiku") * 1.5, hoi, ghi: null });
  assert.equal(goi, 1, "VLM-AC-6 trần không dừng trước ảnh vượt");
  assert.equal(dung.dungTran, true);
  assert.equal(dung.dong.length, 1);
  goi = 0;
  const du = await chayLo({ model: "haiku", bai, runId: "r", tranUsd: 1, hoi, ghi: null });
  assert.equal(goi, 3, "VLM-AC-6 đối chứng: trần rộng phải chạy hết");
  assert.equal(du.dungTran, false);
  // Qwen miễn phí: trần 0 vẫn chạy.
  goi = 0;
  await chayLo({ model: "qwen", bai, runId: "r", tranUsd: 0, hoi: async () => { goi += 1; return { ...docTraLoi(TRA_TOT), error_kind: null, latency_ms: 1, cost_usd: null, chi_usd: 0 }; }, ghi: null });
  assert.equal(goi, 3);
});

test("VLM-AC-6 lỗi 500 qua Gateway: error_kind là tên lớp, không chép thông điệp; một yêu cầu, không thử lại ngầm; ai_calls có dòng", async () => {
  const so: { ok: boolean; loi: string | null }[] = [];
  traLoi = () => ({ status: 500 });
  yeuCau.length = 0;
  const k = await hoiAnh("haiku", { bytes: JPEG, mime: "image/jpeg" }, { recordCall: async (r) => { so.push(r); } });
  assert.equal(yeuCau.length, 1, "VLM-AC-6 SDK thử lại ngầm");
  assert.ok(k.error_kind && !k.error_kind.includes("canh-thong-diep-loi"), "VLM-AC-6 error_kind chép thông điệp");
  assert.deepEqual(so.map((r) => r.ok), [false]);
  assert.equal(so[0].loi, k.error_kind);
  assert.equal(k.chi_usd, 0);
});

test("VLM-AC-6 cờ: thiếu --model hoặc ngoài ba model thì lỗi; tên model ghi sổ phân biệt ba model; Qwen không có cờ Gateway", () => {
  assert.throws(() => docCo([]), /--model/);
  assert.throws(() => docCo(["--model", "decisions"]), /--model/);
  assert.equal(docCo(["--model", "deepseek"]).model, "deepseek");
  assert.equal(docCo(["--model", "qwen", "--gold", "x"]).thu, true);
  assert.equal(new Set(Object.values(TEN_MODEL)).size, 3);
  assert.equal(tuyChonGateway("qwen"), undefined);
});
