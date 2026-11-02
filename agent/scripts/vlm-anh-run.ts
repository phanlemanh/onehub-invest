// vlm-anh-run.ts — KC3 `vlm-anh-tin-s03`: lệnh đọc ảnh tin S03. Chọn bài bằng thư viện pipeline, hỏi một model, ghi nhãn nguồn ảnh vào
// silver_labels — không ghi canonical (luật 7). Logic ở src/agents/vlm-anh-s03.ts — script này chỉ nối CLI + DB.
// Khoá cloud: AI_GATEWAY_API_KEY (người chạy nạp .env). Mỗi lần gọi một dòng ai_calls; trace JSONL ở agent/traces/.
//
// Chạy:
//   npx tsx scripts/vlm-anh-run.ts --model qwen --limit 100
//   npx tsx --env-file=<.env> scripts/vlm-anh-run.ts --model haiku --gold research-local/vlm-anh/phieu.jsonl --tran-usd 0.5
//   --thu: không ghi DB. --gold <phiếu>: chấm phiếu gắn tay, không ghi silver_labels. --since <ngày>: chỉ bài từ ngày đó.
// Mã thoát: 0 xong · 1 hỏng ngoài vòng ảnh · 2 cờ sai hoặc nội dung prompt đổi mà giữ bản · 4 dừng vì trần chi phí.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  CAU_HOI, chamPhieu, chayLo, daDocTuDong, hoiTuTep, PROMPT_SHA, PROMPT_VERSION, SQL_GHI_ANH, TEN_MODEL, thamSoGhiAnh, VLM_MODELS,
  type BaiDoc, type BangCham, type DongAnh, type HangPhieu, type HoiOpts, type VlmModel,
} from "../src/agents/vlm-anh-s03.js";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const TRACES = join(import.meta.dirname, "../traces");

export type Co = { model: VlmModel; limit: number; since: string | null; thu: boolean; tranUsd: number; gold: string | null; runId: string | null };
export function docCo(argv: string[]): Co {
  const lay = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const model = lay("model") as VlmModel;
  if (!VLM_MODELS.includes(model)) throw new Error(`vlm-anh-run: --model phải là ${VLM_MODELS.join(" | ")}`);
  const limit = Number(lay("limit") ?? 100);
  const tranUsd = Number(lay("tran-usd") ?? 1);
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("vlm-anh-run: --limit phải là số nguyên dương");
  if (!Number.isFinite(tranUsd) || tranUsd < 0) throw new Error("vlm-anh-run: --tran-usd phải là số không âm");
  const gold = lay("gold") ?? null;
  return { model, limit, since: lay("since") ?? null, thu: argv.includes("--thu") || gold !== null, tranUsd, gold, runId: lay("run-id") ?? null };
}

/** Một dòng trace — chỉ khoá bài và số đo; không quote, không đường tệp. */
export function dongTrace(d: DongAnh): string {
  return JSON.stringify({ post_id: d.post_id, model: d.model, json_ok: d.json_ok, error_kind: d.error_kind, latency_ms: d.latency_ms, cost_usd: d.cost_usd, so_anh_goi: d.probabilities.so_anh_goi });
}

/** Thư viện pipeline nạp lúc chạy: nó kéo `pg` của pipeline, mà job CI agent chỉ cài phụ thuộc của agent/. */
const layLib = async () =>
  // @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
  (await import("../../pipeline/lib/vlm-anh.mjs")) as { napTapDoc: (c: pg.Client, o?: unknown) => Promise<{ tap: (BaiDoc & { posted_at?: unknown })[] }> };

/** Dòng nhãn ảnh đã có của một model và bản prompt. */
export async function docDongCo(c: pg.Client, model: VlmModel, version: string) {
  return (await c.query(
    `SELECT post_id, text_hash, error_kind, probabilities FROM silver_labels
     WHERE source_code = 'S03' AND model = $1 AND prompt_version = $2 AND probabilities->>'nguon' = 'anh'`, [TEN_MODEL[model], version])).rows;
}

/** Bài của lô: chưa có dòng tốt cùng chữ, theo --since và --limit. */
export function chonBaiLo<T extends BaiDoc & { posted_at?: unknown }>(tap: T[], dong: { post_id: string; text_hash: string; error_kind: string | null }[], co: Pick<Co, "limit" | "since">): T[] {
  const tot = new Set(dong.filter((d) => !d.error_kind).map((d) => `${d.post_id}|${d.text_hash}`));
  const out: T[] = [];
  for (const b of tap) {
    if (tot.has(`${b.post_id}|${b.text_hash}`)) continue;
    if (co.since && b.posted_at && new Date(b.posted_at as string).getTime() < new Date(co.since).getTime()) continue;
    out.push(b);
    if (out.length >= co.limit) break;
  }
  return out;
}

/** Cùng bản mà khác băm nội dung → nhãn cũ và mới không so được với nhau, lệnh không chạy. */
export async function bamPromptLech(c: pg.Client, version: string, sha: string): Promise<boolean> {
  const { rows } = await c.query(
    `SELECT 1 FROM silver_labels WHERE source_code = 'S03' AND prompt_version = $1 AND probabilities->>'nguon' = 'anh' AND probabilities->>'prompt_sha' IS DISTINCT FROM $2 LIMIT 1`, [version, sha]);
  return rows.length > 0;
}

const phanTram = (t: { tile: number | null }) => (t.tile === null ? "không có mẫu" : `${(t.tile * 100).toFixed(1)}%`);
const dongThuoc = (ten: string, t: { n: number; dung: number; tile: number | null; tileTrongSo: number | null }) =>
  `${ten}: ${t.dung}/${t.n} = ${phanTram(t)} · có trọng số ${t.tileTrongSo === null ? "không có mẫu" : `${(t.tileTrongSo * 100).toFixed(1)}%`}`;

/** Bảng chấm dạng dòng chữ — chỉ số, không chữ bài. */
export function inCham(m: VlmModel, b: BangCham): string {
  const nhan = (k: string) => (k === "dat" ? "đạt" : k === "khong-dat" ? "không đạt" : "chưa đủ mẫu");
  return [
    `═══ CHẤM PHIẾU ${m} (${TEN_MODEL[m]}) · ${b.daGan} ảnh đã gắn · ${b.soGoi} lần gọi · ${b.tongUsd.toFixed(4)} USD ═══`,
    `KẾT LUẬN: ${nhan(b.ketLuan)} (cần ≥ 90% cả hai thước, mỗi thước ≥ 30 ảnh)`,
    `${dongThuoc("giá", b.gia)} · ${nhan(b.gia.ketLuan)} · ${b.gia.khongCoGia} ảnh không có giá, đọc ra giá ${b.gia.khongGiaMaDocRa} · loại khỏi mẫu ${b.gia.khongCoMotGia} ảnh không có một giá`,
    `${dongThuoc("loại hình", b.loaiHinh)} · ${nhan(b.loaiHinh.ketLuan)} · loại khỏi mẫu ${b.loaiHinh.khongTheHien} ảnh không thể hiện`,
    `số báo, không xét đạt:`,
    ...Object.entries(b.them).map(([k, t]) => `  ${dongThuoc(k, t)}`),
    `lộ nguồn: người đánh ${b.loNguon.nguoiDanh} ảnh, model gắn đúng ${b.loNguon.modelGanDung}`,
    `ảnh riêng ${b.nhom.rieng.n}: ${dongThuoc("giá", b.nhom.rieng.gia)} · ${dongThuoc("loại hình", b.nhom.rieng.loaiHinh)}`,
    `ảnh ghép ${b.nhom.ghep.n}${b.nhom.ghep.ketLuan === "chua-du-mau" ? " (chưa đủ mẫu, cần ≥ 15)" : ""}: ${dongThuoc("giá", b.nhom.ghep.gia)} · ${dongThuoc("loại hình", b.nhom.ghep.loaiHinh)}`,
    `ô trống ${b.oTrong} · không thuộc bài ${b.khongThuocBai} · lỗi ${JSON.stringify(b.loi)}`,
  ].join("\n");
}

export type Dep = { client?: pg.Client; hoiOpts?: HoiOpts; prompt?: { version: string; cauHoi: string; sha: string }; log?: (s: string) => void; napOpts?: unknown; ghiTrace?: boolean };

/** Thân lệnh: trả mã thoát. Test truyền client trong giao dịch và bản prompt khác. */
export async function chayLenh(argv: string[], dep: Dep = {}): Promise<number> {
  const log = dep.log ?? console.log;
  let co: Co;
  try { co = docCo(argv); } catch (e) { console.error((e as Error).message); return 2; }
  const prompt = dep.prompt ?? { version: PROMPT_VERSION, cauHoi: CAU_HOI, sha: PROMPT_SHA };
  const runId = co.runId ?? `vlm-anh-${co.model}-${new Date().toISOString()}`;
  const hoi = hoiTuTep(co.model, { trace: runId, cauHoi: prompt.cauHoi, ...dep.hoiOpts });
  if (co.gold) {
    const hang: HangPhieu[] = (await readFile(co.gold, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const b = await chamPhieu({ model: co.model, hang, tranUsd: co.tranUsd, hoi });
    log(inCham(co.model, b));
    if (b.dungTran) { log(`dừng: ảnh kế sẽ vượt trần ${co.tranUsd} USD`); return 4; }
    return 0;
  }
  const c = dep.client ?? new pg.Client({ connectionString: DB_URL, application_name: "vlm-anh-run" });
  if (!dep.client) await c.connect();
  try {
    if (await bamPromptLech(c, prompt.version, prompt.sha)) {
      console.error(`vlm-anh-run: nội dung prompt đổi mà giữ bản ${prompt.version}; tăng bản rồi chạy lại`);
      return 2;
    }
    const { tap } = await (await layLib()).napTapDoc(c, dep.napOpts);
    const dong = await docDongCo(c, co.model, prompt.version);
    const bai = chonBaiLo(tap, dong, co);
    log(`═══ ĐỌC ẢNH ${co.model} (${TEN_MODEL[co.model]}) · tập đọc ${tap.length} · lô ${bai.length} bài · trần ${co.tranUsd} USD${co.thu ? " · --thu" : ""} ═══`);
    const t0 = Date.now();
    const kq = await chayLo({
      model: co.model, bai, runId, tranUsd: co.tranUsd, daDoc: daDocTuDong(dong), hoi, prompt,
      ghi: co.thu ? null : async (d) => (await c.query(SQL_GHI_ANH, thamSoGhiAnh(d))).rowCount ?? 0,
    });
    if (dep.ghiTrace !== false) {
      await mkdir(TRACES, { recursive: true });
      await writeFile(join(TRACES, `${runId.replace(/[:.]/g, "-")}.jsonl`), kq.dong.map(dongTrace).join("\n") + "\n");
    }
    log(`đã xử ${kq.dong.length} bài · ${kq.soGoi} lần gọi · ghi ${kq.daGhi} · lỗi ${JSON.stringify(kq.loi)} · ${kq.tongUsd.toFixed(4)} USD · ${((Date.now() - t0) / 1000).toFixed(1)} giây`);
    if (kq.dungTran) { log(`dừng: ảnh kế sẽ vượt trần ${co.tranUsd} USD`); return 4; }
    return 0;
  } finally {
    if (!dep.client) await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) (globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;
if (isMain) chayLenh(process.argv.slice(2)).then((m) => { process.exitCode = m; }).catch((e) => { console.error(e instanceof Error ? e.name : e); process.exit(1); });
