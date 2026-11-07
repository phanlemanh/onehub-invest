// doc-gop-s03.test.ts — PL30 `chon-model-theo-o`: bảng chọn model theo ô, gọi + gộp, trần tiền, tóm tắt chấm.
// Gateway giả (MockLanguageModelV4), không DB. Ca DB ở doc-gop-s03-db.itest.ts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";
import { test } from "node:test";
import { keHoach, kiemCauHinh, napCauHinh, NGUOI, tuyChonGui, type CauHinh } from "../src/enrich/doc-gop-s03/cau-hinh.js";

const GOC = join(import.meta.dirname, "../..");
const MODEL = {
  haiku: { gateway: "anthropic/claude-haiku-5.5", gia_vao: 0.1, gia_ra: 0.5 },
  glm: { gateway: "zai/glm-5.3-flash", gia_vao: 0.15, gia_ra: 0.5 },
  deepseek: { gateway: "deepseek/deepseek-v4.1-flash-1017", gia_vao: 0.3, gia_ra: 1.2 },
};
const bang = (o: Record<string, string>, them: Record<string, unknown> = {}) => ({ phien_ban: 1, mac_dinh: "haiku", model: MODEL, o, ...them });

// ---------- AC-2: bảng của kho ----------
test("DGS-AC-2 bảng chọn của kho: mọi ô dùng Haiku 5.5, riêng WC người duyệt", () => {
  const { cauHinh, sha } = napCauHinh();
  assert.match(sha, /^[0-9a-f]{64}$/);
  const kh = keHoach(cauHinh);
  assert.equal(kh.nhom.length, 1);
  assert.equal(kh.nhom[0].gateway, "anthropic/claude-haiku-5.5");
  assert.equal(kh.nhom[0].o.length, 16);
  assert.deepEqual(kh.nguoi, ["bathrooms"], "WC PHAI LA NGUOI DUYET");
});

test("DGS-AC-2 chiều đỏ: bảng thiếu o.bathrooms thì WC rơi về model", () => {
  const kh = keHoach(kiemCauHinh(bang({})));
  assert.deepEqual(kh.nguoi, []);
  assert.ok(kh.nhom[0].o.includes("bathrooms"), "thước WC phân biệt được bảng thiếu ô người duyệt");
});

// ---------- AC-3: bảng sai dừng trước lời gọi đầu ----------
const BANG_SAI: [string, unknown, RegExp][] = [
  ["ô lạ", bang({ tang_hamm: "haiku" }), /tang_hamm/],
  ["khoá model không khai", bang({ price_min_vnd: "qwen" }), /qwen/],
  ["model thiếu gateway", bang({}, { model: { ...MODEL, glm: { gia_vao: 0.15, gia_ra: 0.5 } } }), /glm thiếu gateway/],
  ["model thiếu gia_ra", bang({}, { model: { ...MODEL, glm: { gateway: "zai/glm-5.3-flash", gia_vao: 0.15 } } }), /gia_ra/],
  ["gateway ngoài ba mã", bang({}, { model: { ...MODEL, glm: { gateway: "openai/gpt-6", gia_vao: 1, gia_ra: 1 } } }), /openai\/gpt-6/],
  ["ô giao cho giá trị lạ", bang({ kind: "ai-do" }), /ai-do/],
];
for (const [ten, x, mau] of BANG_SAI) {
  test(`DGS-AC-3 bảng sai (${ten}) ném lỗi gọi tên chỗ sai`, () => {
    assert.throws(() => kiemCauHinh(x), mau);
  });
}
test("DGS-AC-3 đối chứng: bảng đúng nạp được, ô người duyệt nhận được", () => {
  const c: CauHinh = kiemCauHinh(bang({ bathrooms: NGUOI, price_min_vnd: "glm" }));
  assert.deepEqual(keHoach(c).nhom.map((n) => n.khoa), ["glm", "haiku"]);
});

// ---------- AC-1 (phần tệp bảng là đường T1) ----------
function t1Globs(): string[] {
  const dong = readFileSync(join(GOC, "_acceptance/config.yaml"), "utf8").split("\n");
  const dau = dong.findIndex((l) => /^\s*t1_skip_globs:\s*$/.test(l));
  const ra: string[] = [];
  for (const l of dong.slice(dau + 1)) {
    const m = /^\s*-\s*"([^"]+)"/.exec(l);
    if (m) ra.push(m[1]);
    else if (/^\s*[a-z_0-9]+:/.test(l)) break;
  }
  return ra;
}
test("DGS-AC-1-T1 tệp bảng chọn nằm trong t1_skip_globs, mã bộ đọc thì không", () => {
  const g = t1Globs();
  assert.ok(g.length > 0, "đọc được t1_skip_globs");
  assert.ok(g.some((x) => matchesGlob("agent/config/doc-gop-s03.json", x)), "BANG CHON CAN HO SO");
  assert.ok(!g.some((x) => matchesGlob("agent/src/enrich/doc-gop-s03/doc.ts", x)), "mã bộ đọc không được miễn hồ sơ");
});

// ---------- cờ gửi theo mã Gateway (AC-4, phần thuần) ----------
test("DGS-AC-4-CO tuyChonGui: ZDR + không huấn luyện cho cả ba mã, DeepSeek chỉ Baseten", () => {
  for (const m of Object.values(MODEL)) {
    const g = tuyChonGui(m.gateway).gateway;
    assert.equal(g.zeroDataRetention, true, "THIEU ZDR");
    assert.equal(g.disallowPromptTraining, true, "THIEU ZDR");
    if (m.gateway.startsWith("deepseek/")) assert.deepEqual(g.only, ["baseten"], "DEEPSEEK KHONG QUA BASETEN");
    else assert.equal(g.only, undefined);
  }
});

// ---------- gọi + gộp (AC-1, AC-4 cờ gửi, AC-6) ----------
import { MockLanguageModelV4 } from "ai/test";
import { FIELDS, type Field } from "../src/enrich/doc-gop-s03/o.js";
import { gop, hoiGop, type KetQuaGoi, type TaoModel } from "../src/enrich/doc-gop-s03/doc.js";
import type { The } from "../src/enrich/doc-gop-s03/the.js";

type Ghi = { gateway: string; providerOptions: unknown; prompt: string };
/** 17 ô đủ khuôn, đè vài ô theo `de`. */
function json17(de: Partial<Record<Field, unknown>> = {}): string {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS) o[f] = { v: null, cc: null, trich: "" };
  for (const [f, v] of Object.entries(de)) o[f] = v;
  return JSON.stringify(o);
}
/** Gateway giả: theo mã Gateway trả chữ dựng sẵn (hoặc ném), ghi mã + providerOptions + prompt mỗi lời gọi. */
function gatewayGia(tra: Record<string, string | Error>, ghi: Ghi[], cost = "0.002"): TaoModel {
  return (gateway) => new MockLanguageModelV4({
    modelId: gateway,
    doGenerate: async (o: { providerOptions?: unknown; prompt: unknown }) => {
      ghi.push({ gateway, providerOptions: o.providerOptions, prompt: JSON.stringify(o.prompt) });
      const t = tra[gateway];
      if (t instanceof Error) throw t;
      if (t === undefined) throw new Error(`gateway giả không có ${gateway}`);
      return {
        content: [{ type: "text", text: t }], finishReason: { unified: "stop", raw: "stop" },
        usage: { inputTokens: { total: 5000, noCache: 5000, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 900, text: 900, reasoning: undefined } },
        warnings: [], providerMetadata: { gateway: { cost } },
      };
    },
  } as never) as never;
}
const THE: The = { post_id: "p1", text_hash: "h1", group_name: "Nhóm A", group_note: "[OCP] thẻ nhóm", text: "Bán căn 2PN giá 3,4 tỷ, 62m2", anh: [], anh_thieu: 0 };
const HAI = "anthropic/claude-haiku-5.5", GLM = "zai/glm-5.3-flash", DS = "deepseek/deepseek-v4.1-flash-1017";
const TRA = {
  [HAI]: json17({ price_min_vnd: { v: 3400000000, cc: "chu_bai", trich: "3,4 tỷ" }, area_m2: { v: 62, cc: "chu_bai", trich: "62m2" }, bathrooms: { v: 2, cc: "kien_thuc_nghe", trich: "" } }),
  [GLM]: json17({ price_min_vnd: { v: 1111, cc: "chu_bai", trich: "3,4 tỷ" } }),
  [DS]: json17(),
};
async function docTheo(c: CauHinh, ghi: Ghi[], tra: Record<string, string | Error> = TRA) {
  const kh = keHoach(c);
  const kq = new Map<string, KetQuaGoi>();
  for (const n of kh.nhom) kq.set(n.gateway, await hoiGop({ gateway: n.gateway, gia: n.gia, the: THE, taoModel: gatewayGia(tra, ghi), recordCall: async () => {} }));
  return gop(kq, kh, THE.text);
}

test("DGS-AC-1 cùng mã, hai bảng: ô lấy từ đúng model được giao", async () => {
  const ghiA: Ghi[] = [];
  const a = await docTheo(kiemCauHinh(bang({ price_min_vnd: "glm", bathrooms: NGUOI })), ghiA);
  assert.deepEqual(ghiA.map((g) => g.gateway).sort(), [HAI, GLM], "bảng A gọi đúng hai model, mỗi model một lần");
  assert.equal((a.price_min_vnd as { v: unknown }).v, 1111, "O KHONG LAY TU MODEL DUOC GIAO");
  assert.equal((a.area_m2 as { v: unknown }).v, 62);
  const ghiB: Ghi[] = [];
  const b = await docTheo(kiemCauHinh(bang({ bathrooms: NGUOI })), ghiB);
  assert.deepEqual(ghiB.map((g) => g.gateway), [HAI]);
  assert.equal((b.price_min_vnd as { v: unknown }).v, 3400000000);
});

test("DGS-AC-2 giá trị WC model trả không vào kết quả gộp khi ô giao người", async () => {
  const r = await docTheo(napCauHinh().cauHinh, []);
  assert.deepEqual(r.bathrooms, { nguoi: true }, "WC PHAI LA NGUOI DUYET");
});

test("DGS-AC-4-CO lời gọi thật mang cờ ZDR, DeepSeek chỉ qua Baseten (ma trận ba mã)", async () => {
  const ghi: Ghi[] = [];
  await docTheo(kiemCauHinh(bang({ price_min_vnd: "glm", area_m2: "deepseek" })), ghi);
  assert.equal(ghi.length, 3);
  for (const g of ghi) {
    const gw = (g.providerOptions as { gateway?: Record<string, unknown> }).gateway ?? {};
    assert.equal(gw.zeroDataRetention, true, "THIEU ZDR");
    assert.equal(gw.disallowPromptTraining, true, "THIEU ZDR");
    if (g.gateway === DS) assert.deepEqual(gw.only, ["baseten"], "DEEPSEEK KHONG QUA BASETEN");
    else assert.equal(gw.only, undefined);
  }
});

test("DGS-AC-6 câu trích chữ bài không có thật thì trich_ok false, giá trị vẫn giữ", async () => {
  const t = json17({
    price_min_vnd: { v: 3400000000, cc: "chu_bai", trich: "3,4 tỷ" },
    area_m2: { v: 62, cc: "chu_bai", trich: "65m2" },
    building: { v: "PR2", cc: "anh", trich: "ảnh 1: PR2" },
  });
  const r = await docTheo(kiemCauHinh(bang({})), [], { [HAI]: t });
  const o = (f: Field) => r[f] as { v: unknown; trich_ok: unknown };
  assert.equal(o("price_min_vnd").trich_ok, true);
  assert.equal(o("area_m2").trich_ok, false, "TRICH BIA KHONG BI DANH DAU");
  assert.equal(o("area_m2").v, 62);
  assert.equal(o("building").trich_ok, null);
});

test("DGS-RF JSON thiếu ô: json_ok false, ô thiếu null, không ném", async () => {
  const thieu = JSON.parse(json17({ kind: { v: "sale", cc: "chu_bai", trich: "Bán" } }));
  delete thieu.seller_phone;
  const k = await hoiGop({ gateway: HAI, gia: { vao: 0.1, ra: 0.5 }, the: THE, taoModel: gatewayGia({ [HAI]: JSON.stringify(thieu) }, []), recordCall: async () => {} });
  assert.equal(k.json_ok, false);
  assert.equal(k.error_kind, "json-hong");
  assert.equal(k.json?.seller_phone, undefined);
  assert.equal(k.usd, 0.002, "chi phí của lời gọi hỏng vẫn tính");
});

test("DGS-RF một model lỗi: ô của nó null, ô model kia giữ; ai_calls ghi lỗi tên lớp", async () => {
  const calls: { ok: boolean; loi: string | null }[] = [];
  const kh = keHoach(kiemCauHinh(bang({ price_min_vnd: "glm" })));
  const tm = gatewayGia({ [HAI]: TRA[HAI], [GLM]: new TypeError("mang") }, []);
  const kq = new Map<string, KetQuaGoi>();
  for (const n of kh.nhom) kq.set(n.gateway, await hoiGop({ gateway: n.gateway, gia: n.gia, the: THE, taoModel: tm, recordCall: async (r) => { calls.push({ ok: r.ok, loi: r.loi }); } }));
  assert.equal(kq.get(GLM)!.error_kind, "TypeError");
  const r = gop(kq, kh, THE.text);
  assert.equal((r.price_min_vnd as { v: unknown }).v, null);
  assert.equal((r.area_m2 as { v: unknown }).v, 62);
  assert.deepEqual(calls.map((c) => c.ok).sort(), [false, true]);
});

test("DGS-AC-4 tin nhắn không mang tên tệp ảnh hay khoá ngoài nhóm, thẻ nhóm, chữ", async () => {
  const ghi: Ghi[] = [];
  await docTheo(kiemCauHinh(bang({})), ghi);
  assert.match(ghi[0].prompt, /Nhóm A/);
  assert.match(ghi[0].prompt, /\[OCP\] thẻ nhóm/);
  assert.match(ghi[0].prompt, /Bán căn 2PN giá 3,4 tỷ, 62m2/);
});

// ---------- lệnh chay: trần tiền, cờ (AC-8, AC-3 dòng lệnh) ----------
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { chayLuot, docCo } from "../src/enrich/doc-gop-s03/chay.js";

const muoiThe = (): The[] => Array.from({ length: 10 }, (_, i) => ({ ...THE, post_id: `p${i}`, text_hash: `h${i}` }));
const clientGia = { query: async () => ({ rows: [], rowCount: 1 }) } as never;

test("DGS-AC-8 ước vượt trần thì dừng với 0 lời gọi", async () => {
  const ghi: Ghi[] = [], log: string[] = [];
  const kq = await chayLuot({ client: clientGia, co: { lat: "x", tranUsd: 0.01, thu: true }, the: muoiThe(), uoc: () => 0.003, taoModel: gatewayGia(TRA, ghi), recordCall: async () => {}, log: (s) => log.push(s) });
  assert.equal(kq.goi, 0);
  assert.equal(ghi.length, 0);
  assert.ok(log.some((l) => l.includes("uoc vuot tran")));
});

test("DGS-AC-8 chạm trần giữa lượt: trước mỗi lời gọi, đã chi + ước > trần thì dừng (đúng 3 lời gọi, còn 7)", async () => {
  const log: string[] = [];
  const kq = await chayLuot({ client: clientGia, co: { lat: "x", tranUsd: 0.05, thu: true }, the: muoiThe(), uoc: () => 0.003, taoModel: gatewayGia(TRA, [], "0.02"), recordCall: async () => {}, log: (s) => log.push(s) });
  assert.equal(kq.goi, 3);
  assert.equal(kq.conLai, 7);
  assert.equal(kq.dungTran, true);
  assert.ok(log.some((l) => l.includes("con lai 7")));
});

test("DGS-AC-8 không có đường chạy toàn S03: --toan-bo, --all bị từ chối; cần đúng một tập", () => {
  assert.throws(() => docCo(["--toan-bo", "--tran-usd", "1"]), /--toan-bo/);
  assert.throws(() => docCo(["--all", "--tran-usd", "1"]), /--all/);
  assert.throws(() => docCo(["--tran-usd", "1"]), /--lat hoặc --post/);
  assert.deepEqual(docCo(["--lat", "s03-theo-nhom", "--split", "test", "--tran-usd", "0.2"]).split, "test");
});

test("DGS-RF bài không chữ không ảnh không gọi model", async () => {
  const ghi: Ghi[] = [];
  const kq = await chayLuot({ client: clientGia, co: { lat: "x", tranUsd: 1, thu: true }, the: [{ ...THE, text: "  ", anh: [] }, THE], taoModel: gatewayGia(TRA, ghi), recordCall: async () => {}, log: () => {} });
  assert.equal(kq.bo, 1);
  assert.equal(ghi.length, 1);
});

test("DGS-AC-3 dòng lệnh: bảng sai thoát 2 gọi tên chỗ sai, chưa gọi model", () => {
  const d = mkdtempSync(join(tmpdir(), "dgs-"));
  const tep = join(d, "bang.json");
  writeFileSync(tep, JSON.stringify(bang({ price_min_vnd: "qwen" })));
  const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/doc-gop-s03.ts", "chay", "--lat", "x", "--tran-usd", "0", "--cau-hinh", tep],
    { cwd: join(import.meta.dirname, ".."), encoding: "utf8", env: { ...process.env, AI_GATEWAY_API_KEY: "" } });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /qwen/);
});

// ---------- số thật trên test (AC-10) ----------
import { existsSync } from "node:fs";
import { maSha } from "../src/enrich/doc-gop-s03/cham.js";
import { PROMPT_SHA } from "../src/enrich/doc-gop-s03/prompt.js";

/** Kiểm một tóm tắt chấm thật; ném với thông điệp ghim. Tách hàm để chiều đỏ chạy trên cùng khuôn. */
export function kiemTomTat(t: Record<string, unknown>, hien: { prompt: string; bang: string; ma: string; so_o: number }): void {
  assert.equal(t.split, "test");
  assert.equal(t.so_the, 23);
  assert.ok((t.model as string[]).includes("anthropic/claude-haiku-5.5"));
  assert.equal(t.prompt_sha, hien.prompt, "TOM TAT KHONG KHOP PROMPT");
  assert.equal(t.cau_hinh_sha, hien.bang, "TOM TAT KHONG KHOP BANG CHON");
  assert.equal(t.ma_sha, hien.ma, "TOM TAT KHONG KHOP MA");
  // Quan hệ, không phải giá trị chép sẵn (S4-r1 t9): mẫu số = số thẻ × số ô giao model của bảng hiện tại; tỉ lệ tính lại.
  assert.equal(t.mau_so, (t.so_the as number) * hien.so_o, "MAU SO KHONG BANG SO THE x SO O GIAO");
  assert.ok(typeof t.anh_thieu === "object" && "dung_gop_bo_9991" in t);
  const d = (t.dung as number) / (t.mau_so as number);
  assert.ok(Math.abs(d - (t.dung_gop as number)) < 1e-9, `DUNG GOP KHONG KHOP DUNG/MAU SO (${t.dung}/${t.mau_so} ≠ ${t.dung_gop})`);
  assert.ok(d >= 0.9, `CHET DUOI 90 (${d})`);
  assert.ok(d >= 0.92, `VUNG XAM — MANH PHAN (${d})`);
  assert.ok((t.usd_the as number) <= 0.0025, `chi phí ${t.usd_the} > 0,0025 USD/thẻ`);
}
const TOM_TAT = join(GOC, "_acceptance/chon-model-theo-o/evidence/cham-test.json");

// Chỉ chạy qua executor dgs_so_that (DGS_SO_THAT=1): mã đọc gộp đổi thì băm đổi và cần chấm thật lại (tốn tiền) — không
// để bộ test chung của agent đỏ vì thế. Có cờ mà thiếu tệp là đỏ, không bỏ qua.
test("DGS-AC-10 tóm tắt chấm Haiku thật trên 23 thẻ test khớp mã hiện tại và đạt ngưỡng", { skip: process.env.DGS_SO_THAT !== "1" && "chạy qua executor dgs_so_that" }, () => {
  assert.ok(existsSync(TOM_TAT), "THIEU TOM TAT CHAM THAT");
  const cau = napCauHinh();
  const soO = FIELDS.length - keHoach(cau.cauHinh).nguoi.length; // 16 với bảng mặc định (17 ô, WC người duyệt)
  kiemTomTat(JSON.parse(readFileSync(TOM_TAT, "utf8")), { prompt: PROMPT_SHA, bang: cau.sha, ma: maSha(), so_o: soO });
});

test("DGS-AC-10 chiều đỏ: tóm tắt cũ hay dưới ngưỡng bị bắt đúng thông điệp", () => {
  const hien = { prompt: "p", bang: "b", ma: "m", so_o: 16 };
  const tot = { split: "test", so_the: 23, model: ["anthropic/claude-haiku-5.5"], prompt_sha: "p", cau_hinh_sha: "b", ma_sha: "m", dung: 350, mau_so: 368, anh_thieu: {}, dung_gop_bo_9991: 0.95, dung_gop: 350 / 368, usd_the: 0.0017 };
  const voi = (dung: number) => ({ ...tot, dung, dung_gop: dung / 368 });
  kiemTomTat(tot, hien);
  assert.throws(() => kiemTomTat({ ...tot, dung: 300 }, hien), /DUNG GOP KHONG KHOP DUNG\/MAU SO/);
  assert.throws(() => kiemTomTat({ ...tot, mau_so: 300 }, hien), /MAU SO KHONG BANG SO THE x SO O GIAO/);
  assert.throws(() => kiemTomTat({ ...tot, prompt_sha: "cu" }, hien), /TOM TAT KHONG KHOP PROMPT/);
  assert.throws(() => kiemTomTat({ ...tot, ma_sha: "cu" }, hien), /TOM TAT KHONG KHOP MA/);
  assert.throws(() => kiemTomTat(voi(335), hien), /VUNG XAM — MANH PHAN/); // 335/368 = 0,910
  assert.throws(() => kiemTomTat(voi(313), hien), /CHET DUOI 90/); // 313/368 = 0,851
});

test("DGS-RF ô trống trả gọn `null` (bài không phải tin rao) vẫn là JSON đọc được", async () => {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS) o[f] = null;
  o.listing_intent = { v: "not_listing", cc: "chu_bai", trich: "Ngân hàng" };
  o.multi_unit = { v: "no", cc: "chu_bai", trich: "" };
  const k = await hoiGop({ gateway: HAI, gia: { vao: 0.1, ra: 0.5 }, the: THE, taoModel: gatewayGia({ [HAI]: JSON.stringify(o) }, []), recordCall: async () => {} });
  assert.equal(k.json_ok, true, "O TRONG NULL BI COI LA JSON HONG");
  assert.equal(k.json?.listing_intent?.v, "not_listing");
  assert.equal(k.json?.price_min_vnd?.v, null);
});

test("DGS-RF bảng chọn hai khoá cùng một mã Gateway bị từ chối trước mọi lời gọi", () => {
  const x = { phien_ban: 1, mac_dinh: "haiku", model: {
    haiku: { gateway: HAI, gia_vao: 1, gia_ra: 5 }, haiku2: { gateway: HAI, gia_vao: 1, gia_ra: 5 } }, o: { bathrooms: "nguoi" } };
  assert.throws(() => kiemCauHinh(x), /haiku và haiku2 trùng gateway/);
});
