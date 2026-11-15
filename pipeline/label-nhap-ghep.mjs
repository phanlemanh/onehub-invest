#!/usr/bin/env node
// label-nhap-ghep.mjs — PL35 tap-nhan-ghep-tin-hai-khu (AC-5, AC-6, AC-7): nháp nhãn toà, trục, căn cho bài của lát
// `hai-khu-ghep`, ghi vào eval_label_items.draft theo khuôn màn /ops/labels đọc (app/src/lib/labels-cuon-chieu.ts nhapTuDraft).
//   node --env-file=.env pipeline/label-nhap-ghep.mjs --lat hai-khu-ghep [--gioi-han N] [--lam-lai] [--thu]
// Tác tử (model mặc định của agent/config/doc-gop-s03.json, đi theo `duong` của model đó: "anthropic" gọi thẳng API Anthropic bằng
// SDK chính chủ mượn từ agent/node_modules, khoá ANTHROPIC_API_KEY; "gateway" qua Vercel AI Gateway, khoá AI_GATEWAY_API_KEY —
// goi-thang-anthropic 15/11). Hết tiền (HTTP 402) ở một lời gọi: lát dừng ngay, in `JOB FAIL [label-nhap-ghep] het-tien`, thoát 4.
// Tác tử chỉ nhận chữ bài và danh sách toà/trục của
// khu đọc từ danh bạ — không nhận, không đọc phát biểu hay kết quả gắn của PL20. Mỗi ô kèm câu trích nguyên văn; câu trích
// không có trong chữ bài thì ô đó để trống. Bài đã có nhãn người: không đổi draft. Lệnh không ghi eval_labels (Luật 7: nháp
// chờ người duyệt). Bài đã có nháp thì bỏ qua, trừ khi --lam-lai. --thu: gọi tác tử, in, không ghi.
import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { khuCuaNhom } from "./lib/eval-labels.mjs";
import { docDanhBaKhu, KHU_SLUG } from "./lib/mau-hai-khu.mjs";

export const CACH_DOC = "ghep";
export const O_GHEP = Object.freeze(["building", "stack", "unit_number"]);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Chuẩn hoá để so câu trích: NFC, chữ thường, gộp khoảng trắng. */
const chuanTrich = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
/** Câu trích có nguyên văn trong chữ bài (sau chuẩn hoá khoảng trắng và hoa thường). */
export const trichCo = (trich, chu) => { const q = chuanTrich(trich); return q.length > 0 && chuanTrich(chu).includes(q); };

/**
 * Trả lời của tác tử → draft khuôn màn. Ô chỉ có mặt khi có giá trị VÀ câu trích có trong chữ bài; còn lại để trống
 * (không có khoá — màn hiện ô rỗng, người tự điền).
 * @param {Record<string, { v?: unknown, trich?: string } | null | undefined>} traLoi
 * @param {string} chu chữ bài
 */
export function draftTuTraLoi(traLoi, chu) {
  const o = {}, can_cu = {}, bo = [];
  for (const f of O_GHEP) {
    const x = traLoi?.[f];
    const v = x?.v === null || x?.v === undefined ? "" : String(x.v).trim();
    if (!v) continue;
    if (!trichCo(x.trich, chu)) { bo.push(f); continue; }
    o[f] = v;
    can_cu[f] = { trich: String(x.trich), basis: "chu_bai" };
  }
  return { draft: { hien: CACH_DOC, o_nguoi: [], cach_doc: { [CACH_DOC]: { trang_thai: "co", o, can_cu } } }, bo };
}

const HUONG_DAN = `Bạn đọc một bài rao bất động sản trong nhóm cư dân và điền ba ô vị trí của căn được rao:
- building: tên toà, chọn đúng một tên trong danh sách toà cho sẵn; bài nêu toà không có trong danh sách hoặc nêu nhiều toà thì để null.
- stack: mã trục (hai chữ số cuối của mã căn, ví dụ căn 1210 thì trục 10); chỉ điền khi bài nêu mã căn hoặc trục.
- unit_number: mã căn đúng như bài viết (ví dụ S1.01-1210); chỉ điền khi bài nêu.
Mỗi ô kèm "trich": câu trích NGUYÊN VĂN, ngắn, chép từ bài làm căn cứ. Không suy đoán; không có căn cứ trong bài thì v = null.
Chỉ trả về một object JSON: {"building":{"v":...,"trich":...},"stack":{"v":...,"trich":...},"unit_number":{"v":...,"trich":...}}`;

/** Model mặc định của agent/config (cùng bảng chọn với đọc gộp S03, PL30 — một chỗ đổi model) và đường gọi của nó. */
export function cauHinhMacDinh(root = ROOT) {
  const cau = JSON.parse(readFileSync(path.join(root, "agent/config/doc-gop-s03.json"), "utf8"));
  const m = cau?.model?.[cau?.mac_dinh];
  const gw = m?.gateway;
  if (typeof gw !== "string" || !MODEL_DUYET.includes(gw)) {
    throw new Error(`label-nhap-ghep: agent/config/doc-gop-s03.json — mac_dinh «${cau?.mac_dinh}» không trỏ model có gateway trong ba mã đã duyệt`);
  }
  const ds = m.duong === undefined ? ["gateway"] : Array.isArray(m.duong) ? m.duong : [m.duong];
  for (const d of ds) {
    if (d !== "gateway" && !(d === "anthropic" && DUONG_ANTHROPIC[gw])) {
      throw new Error(`label-nhap-ghep: agent/config/doc-gop-s03.json — model ${gw} không có đường «${d}»`);
    }
  }
  return { model: gw, duong: ds, tuLui: cau.tu_lui === true };
}
export const modelMacDinh = (root = ROOT) => cauHinhMacDinh(root).model;

/** Ba model đã duyệt cho việc đọc tin (AGENTS.md luật 6) và bảng đường anthropic — chép từ agent/src/enrich/doc-gop-s03/cau-hinh.ts
 * (MODEL_DUYET, DUONG_ANTHROPIC); test PL35 canh hai bản khớp. */
export const MODEL_DUYET = Object.freeze(["anthropic/claude-haiku-5.5", "zai/glm-5.3-flash", "deepseek/deepseek-v4.1-flash-1017"]);
export const DUONG_ANTHROPIC = Object.freeze({ "anthropic/claude-haiku-5.5": "claude-haiku-5-5" });

/** Lỗi hết tiền nhà cung cấp (HTTP 402 hay kiểu billing_error / insufficient_funds): nhapLat dừng cả lát. */
export class LoiHetTien extends Error {
  constructor(nguon, http, kieu) { super(`label-nhap-ghep: ${nguon} hết tiền (${http ?? "-"} ${kieu ?? "-"})`); this.het_tien = true; }
}
/** Hết tiền: 402, kiểu billing_error / insufficient_funds, hay 400 «credit balance is too low» của API Anthropic (cùng luật
 * agent/src/runtime/loi-nha-cung-cap.ts; message chỉ để so mẫu, không chép ra). */
const laHetTien = (http, kieu, msg = "") =>
  http === 402 || kieu === "billing_error" || kieu === "insufficient_funds" || (http === 400 && /credit balance is too low/i.test(msg));

/** Cờ gửi kèm lời gọi, theo mã Gateway — cùng luật tuyChonGui của agent (DeepSeek chỉ đi nhà cung cấp đã ghim). */
export function tuyChonGui(gateway) {
  const chung = { zeroDataRetention: true, disallowPromptTraining: true };
  return { gateway: gateway.startsWith("deepseek/") ? { ...chung, only: ["baseten"] } : chung };
}

/** Tác tử thật: một lời gọi Gateway (API kiểu OpenAI), không giữ dữ liệu, không dùng huấn luyện. */
export function tacTuGateway({ model = modelMacDinh(), fetchFn = fetch } = {}) {
  if (!MODEL_DUYET.includes(model)) throw new Error(`label-nhap-ghep: model «${model}» ngoài ba mã đã duyệt`);
  const base = process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";
  return async ({ chu, toa, truc }) => {
    if (!process.env.AI_GATEWAY_API_KEY) throw new Error("label-nhap-ghep: thiếu AI_GATEWAY_API_KEY — chạy với --env-file=.env");
    const res = await fetchFn(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
      body: JSON.stringify({
        model, max_tokens: 600, temperature: 0,
        messages: [
          { role: "system", content: HUONG_DAN },
          { role: "user", content: `Danh sách toà: ${toa.join(", ") || "(trống)"}\nTrục đã biết: ${truc.join(", ") || "(trống)"}\n\nBài:\n${chu}` },
        ],
        providerOptions: tuyChonGui(model),
      }),
    });
    if (!res.ok) {
      let kieu = null;
      let msg = "";
      try { const j = await res.json(); kieu = j?.error?.type ?? null; msg = String(j?.error?.message ?? ""); } catch { kieu = null; }
      if (laHetTien(res.status, kieu, msg)) throw new LoiHetTien("Gateway", res.status, kieu);
      throw new Error(`label-nhap-ghep: Gateway trả ${res.status}`);
    }
    return docTraLoi((await res.json())?.choices?.[0]?.message?.content ?? "");
  };
}

/** Chữ model trả về → object JSON; không đọc được là LỖI (đếm vào loi, không ghi nháp rỗng — nháp rỗng làm lần sau bỏ qua bài). */
function docTraLoi(raw) {
  {
    const s = String(raw).replace(/```(?:json)?/g, "");
    const a = s.indexOf("{"), b = s.lastIndexOf("}");
    let o = null;
    try { o = a >= 0 && b > a ? JSON.parse(s.slice(a, b + 1)) : null; } catch { o = null; }
    if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("label-nhap-ghep: trả lời của model không phải object JSON");
    return o;
  }
}

/** SDK chính chủ @anthropic-ai/sdk, mượn từ agent/node_modules (pipeline không mang phụ thuộc này). */
export function napSdkAnthropic(root = ROOT) {
  const m = createRequire(path.join(root, "agent/package.json"))("@anthropic-ai/sdk");
  return m.default ?? m.Anthropic ?? m;
}

/** Tác tử thật đường anthropic: một lời gọi API Anthropic (SDK chính chủ). Khoá ANTHROPIC_API_KEY đọc lúc gọi, truyền tường minh
 * (không rơi về hồ sơ đăng nhập trên đĩa). Không gửi temperature (Haiku 5.5 trả 400 với giá trị lấy mẫu khác mặc định). */
export function tacTuAnthropic({ model = modelMacDinh(), taoClient } = {}) {
  const ma = DUONG_ANTHROPIC[model];
  if (!ma) throw new Error(`label-nhap-ghep: model «${model}» không có đường anthropic`);
  return async ({ chu, toa, truc }) => {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("label-nhap-ghep: thiếu ANTHROPIC_API_KEY — chạy với --env-file=.env");
    const client = taoClient ? taoClient() : new (napSdkAnthropic())({ apiKey: process.env.ANTHROPIC_API_KEY, authToken: null, maxRetries: 2, timeout: 120_000 });
    let r;
    try {
      r = await client.messages.create({
        model: ma, max_tokens: 600, system: HUONG_DAN,
        messages: [{ role: "user", content: `Danh sách toà: ${toa.join(", ") || "(trống)"}\nTrục đã biết: ${truc.join(", ") || "(trống)"}\n\nBài:\n${chu}` }],
      });
    } catch (e) {
      const kieu = typeof e?.type === "string" ? e.type : e?.error?.error?.type ?? null;
      if (laHetTien(e?.status, kieu, String(e?.message ?? ""))) throw new LoiHetTien("Anthropic", e.status, kieu);
      throw new Error(`label-nhap-ghep: Anthropic trả ${e?.status ?? e?.name ?? "lỗi"}${kieu ? ` ${kieu}` : ""}`);
    }
    return docTraLoi((r.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join(""));
  };
}

const KHOA_DUONG = Object.freeze({ gateway: "AI_GATEWAY_API_KEY", anthropic: "ANTHROPIC_API_KEY" });

/** Tác tử theo bảng chọn: các đường của model mặc định theo thứ tự. Không tự lùi: đường đầu. Tự lùi (`tu_lui`): bỏ đường thiếu
 * khoá, và khi đường đang dùng hết tiền thì lùi sang đường kế, thử lại bài đó, in dòng `chuyen-duong` (cùng luật agent). */
export function tacTuMacDinh(root = ROOT, { log = console.error, tao = { anthropic: tacTuAnthropic, gateway: tacTuGateway } } = {}) {
  const { model, duong, tuLui } = cauHinhMacDinh(root);
  const ds = tuLui ? duong.filter((d) => process.env[KHOA_DUONG[d]]) : [duong[0]];
  if (!ds.length) ds.push(duong[0]); // không đường nào có khoá: lời gọi tự báo thiếu khoá
  if (ds[0] !== duong[0]) log(`JOB WARN [label-nhap-ghep] chuyen-duong: ${model} ${duong[0]} -> ${ds[0]} (thieu-khoa ${KHOA_DUONG[duong[0]]})`);
  const tacTu = new Map(ds.map((d) => [d, tao[d]({ model })]));
  return async (vao) => {
    for (;;) {
      try {
        return await tacTu.get(ds[0])(vao);
      } catch (e) {
        if (!(e?.het_tien && tuLui && ds.length > 1)) throw e;
        log(`JOB WARN [label-nhap-ghep] chuyen-duong: ${model} ${ds[0]} -> ${ds[1]} (het-tien)`);
        ds.shift();
      }
    }
  };
}

/**
 * Nháp cả lát. Đọc: eval_label_items, eval_labels (chỉ để biết bài đã có nhãn người), stg_zalo_posts (chữ, tên nhóm), danh bạ
 * khu (buildings, stacks, asset_nodes, registry_aliases). Ghi: eval_label_items.draft của bài chưa có nhãn người.
 * @param {import("pg").Client} c
 * @param {{ lat: string, tacTu: (vao: {chu: string, toa: string[], truc: string[]}) => Promise<object|null>, gioiHan?: number, lamLai?: boolean, thu?: boolean }} o
 */
export async function nhapLat(c, { lat, tacTu, gioiHan = Infinity, lamLai = false, thu = false }) {
  const danhBa = {};
  for (const [khu, slug] of Object.entries(KHU_SLUG)) {
    const d = await docDanhBaKhu(c, slug);
    const tenToa = new Map(d.toa.map((t) => [t.key, t.ten[0] ?? t.key]));
    danhBa[khu] = { toa: d.toa.flatMap((t) => t.ten), truc: d.truc.map((s) => `${tenToa.get(s.toa_key)}/${s.truc}`) };
  }
  const { rows } = await c.query(
    `SELECT i.item_id::int, i.ref_id, i.draft IS NOT NULL AS co_nhap, p.text, p.group_name,
            EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = i.item_id) AS co_nguoi
       FROM eval_label_items i
       JOIN LATERAL (SELECT text, group_name FROM stg_zalo_posts WHERE post_id = i.ref_id ORDER BY captured_at DESC LIMIT 1) p ON true
      WHERE i.lat = $1 AND (i.ghep->>'trung_voi') IS NULL
      ORDER BY i.item_id`, [lat]);
  const kq = { lat, tong: rows.length, bo_co_nguoi: 0, bo_co_nhap: 0, bo_khu: 0, goi: 0, ghi: 0, o_bo_trich: 0, loi: 0, mau: [] };
  for (const r of rows) {
    if (r.co_nguoi) { kq.bo_co_nguoi++; continue; }
    if (r.co_nhap && !lamLai) { kq.bo_co_nhap++; continue; }
    const khu = khuCuaNhom(r.group_name);
    if (!khu) { kq.bo_khu++; continue; }
    if (kq.goi >= gioiHan) break;
    kq.goi++;
    let traLoi;
    try { traLoi = await tacTu({ chu: r.text ?? "", ...danhBa[khu] }); } catch (e) {
      kq.loi++; kq.loi_cuoi = String(e.message ?? e);
      if (e?.het_tien) { kq.het_tien = true; break; } // hết tiền: mọi lời gọi sau cũng hỏng — dừng cả lát
      continue;
    }
    const { draft, bo } = draftTuTraLoi(traLoi, r.text ?? "");
    kq.o_bo_trich += bo.length;
    if (kq.mau.length < 3) kq.mau.push({ item_id: r.item_id, o: draft.cach_doc[CACH_DOC].o, bo });
    if (thu) continue;
    // Điều kiện lặp lại ngay ở câu ghi: người có thể vừa gắn trong lúc tác tử đọc.
    const res = await c.query(
      `UPDATE eval_label_items SET draft = $2::jsonb
        WHERE item_id = $1 AND NOT EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = $1)`, [r.item_id, JSON.stringify(draft)]);
    kq.ghi += res.rowCount;
  }
  return kq;
}

function docCo(argv) {
  const co = { lamLai: false, thu: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--lam-lai") co.lamLai = true;
    else if (a === "--thu") co.thu = true;
    else if (a === "--lat") co.lat = argv[++i];
    else if (a === "--gioi-han") co.gioiHan = Number(argv[++i]);
    else throw new Error(`label-nhap-ghep: cờ lạ «${a}»`);
  }
  if (!co.lat) throw new Error("label-nhap-ghep: thiếu --lat");
  if (co.gioiHan !== undefined && !(Number.isInteger(co.gioiHan) && co.gioiHan > 0)) throw new Error("label-nhap-ghep: --gioi-han phải là số nguyên dương");
  return co;
}

async function main() {
  const co = docCo(process.argv.slice(2));
  const c = new pg.Client({ connectionString: DATABASE_URL });
  await c.connect();
  try {
    const kq = await nhapLat(c, { ...co, tacTu: tacTuMacDinh() });
    console.log(`label-nhap-ghep: lát ${kq.lat} · ${kq.tong} bài · gọi ${kq.goi} · ghi ${kq.ghi}${co.thu ? " (--thu: không ghi)" : ""}`);
    console.log(`bỏ: có nhãn người ${kq.bo_co_nguoi} · đã có nháp ${kq.bo_co_nhap} · nhóm không khớp khu ${kq.bo_khu} · ô bỏ vì câu trích không có trong bài ${kq.o_bo_trich} · lỗi gọi ${kq.loi}`);
    for (const m of kq.mau) console.log(`mẫu item ${m.item_id}: ${JSON.stringify(m.o)}${m.bo.length ? ` · bỏ ${m.bo.join(",")}` : ""}`);
    if (kq.het_tien) { console.error(`lỗi gọi cuối: ${kq.loi_cuoi}`); console.error("JOB FAIL [label-nhap-ghep] het-tien"); process.exitCode = 4; }
    else if (kq.loi) { console.error(`lỗi gọi cuối: ${kq.loi_cuoi}`); process.exitCode = 1; }
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
