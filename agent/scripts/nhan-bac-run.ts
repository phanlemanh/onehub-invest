// nhan-bac-run.ts — KC1 `nhan-bac-model-lon-s03`: lệnh nhãn bạc S03. Đọc bài stg_zalo_posts (gạt bài thử bằng
// loadStgPosts của pipeline), hỏi một backend (Qwen local · Haiku 5.5 / Decisions qua Vercel AI Gateway), ghi nhãn vào
// silver_labels — không ghi canonical (luật 7). Logic ở src/agents/nhan-bac-s03.ts — script này chỉ nối CLI + DB.
// Khoá cloud: AI_GATEWAY_API_KEY (người chạy nạp .env). Mỗi lần gọi một dòng ai_calls; trace JSONL ở agent/traces/.
//
// Chạy:
//   npx tsx scripts/nhan-bac-run.ts --model qwen --limit 200            # nhãn 200 bài chưa có nhãn của model
//   npx tsx scripts/nhan-bac-run.ts --model haiku --since 2026-10-01 --tran-usd 5
//   npx tsx scripts/nhan-bac-run.ts --model decisions --gold research-local/s03-gold-61.jsonl   # đo, không ghi
//   --thu: không ghi DB. --gold <tệp JSONL {post_id, listing_intent, kind}>: đo trên tập vàng (ngầm --thu).
// Mã thoát: 0 xong · 1 hỏng ngoài vòng bài · 2 cờ sai · 4 dừng vì trần chi phí.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { BACKENDS, chayLo, doTapVang, PROMPT_VERSION, SQL_GHI, TEN_MODEL, thamSoGhi, type Backend, type Bai, type Vang } from "../src/agents/nhan-bac-s03.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { loadStgPosts } from "../../pipeline/lib/test-posts.mjs";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { textHash } from "../../pipeline/lib/eval-labels.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const TRACES = join(import.meta.dirname, "../traces");

export type Co = { model: Backend; limit: number; since: string | null; thu: boolean; tranUsd: number; gold: string | null };
export function docCo(argv: string[]): Co {
  const lay = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const model = lay("model") as Backend;
  if (!BACKENDS.includes(model)) throw new Error(`nhan-bac-run: --model phải là ${BACKENDS.join(" | ")}`);
  const limit = Number(lay("limit") ?? 200);
  const tranUsd = Number(lay("tran-usd") ?? 5);
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("nhan-bac-run: --limit phải là số nguyên dương");
  if (!Number.isFinite(tranUsd) || tranUsd < 0) throw new Error("nhan-bac-run: --tran-usd phải là số không âm");
  const gold = lay("gold") ?? null;
  return { model, limit, since: lay("since") ?? null, thu: argv.includes("--thu") || gold !== null, tranUsd, gold };
}

/** Bài cần nhãn: bài S03 thật (đã gạt bài thử), chưa có nhãn cùng chữ + model + prompt, lọc --since / tập vàng. */
export async function chonBai(c: pg.Client, co: Co, vang: Vang[] | null): Promise<Bai[]> {
  const { posts } = await loadStgPosts(c, "zalo");
  const da = new Set((await c.query(
    `SELECT post_id || '|' || text_hash AS k FROM silver_labels WHERE source_code = 'S03' AND model = $1 AND prompt_version = $2`,
    [TEN_MODEL[co.model], PROMPT_VERSION])).rows.map((r) => r.k));
  const trongVang = vang ? new Set(vang.map((v) => v.post_id)) : null;
  const out: Bai[] = [];
  for (const p of posts as { post_id: string; text: string; posted_at?: string }[]) {
    if (trongVang && !trongVang.has(p.post_id)) continue;
    if (co.since && p.posted_at && String(p.posted_at) < co.since) continue;
    const h = textHash(p.text);
    if (!trongVang && da.has(`${p.post_id}|${h}`)) continue;
    out.push({ post_id: p.post_id, text: p.text, text_hash: h });
    if (out.length >= co.limit) break;
  }
  return out;
}

async function main() {
  let co: Co;
  try { co = docCo(process.argv.slice(2)); } catch (e) { console.error((e as Error).message); process.exit(2); }
  const vang: Vang[] | null = co.gold
    ? (await readFile(co.gold, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : null;
  const c = new pg.Client({ connectionString: DB_URL, application_name: "nhan-bac-run" });
  await c.connect();
  const runId = `nhan-bac-${co.model}-${new Date().toISOString()}`;
  try {
    const bai = await chonBai(c, co, vang);
    console.log(`═══ NHÃN BẠC ${co.model} (${TEN_MODEL[co.model]}) · ${bai.length} bài · trần ${co.tranUsd} USD${co.thu ? " · --thu" : ""} ═══`);
    const kq = await chayLo({
      backend: co.model, bai, runId, tranUsd: co.tranUsd,
      ghi: co.thu ? null : async (d) => (await c.query(SQL_GHI, thamSoGhi(d))).rowCount ?? 0,
    });
    await mkdir(TRACES, { recursive: true });
    await writeFile(join(TRACES, `${runId.replace(/[:.]/g, "-")}.jsonl`), kq.nhan.map((d) => JSON.stringify({
      post_id: d.post_id, model: d.model, listing_intent: d.listing_intent, kind: d.kind, json_ok: d.json_ok,
      quote_ok: d.quote_ok, error_kind: d.error_kind, latency_ms: d.latency_ms, cost_usd: d.cost_usd,
    })).join("\n") + "\n");
    console.log(`đã hỏi ${kq.nhan.length} · ghi ${kq.daGhi} · ý định ${JSON.stringify(kq.yDinh)} · lỗi ${JSON.stringify(kq.loi)} · đã dùng ${kq.tongUsd.toFixed(4)} USD`);
    if (vang) console.log(`đo tập vàng: ${JSON.stringify(doTapVang(kq.nhan, vang))}`);
    if (kq.dungTran) { console.log(`dừng: bài kế sẽ vượt trần ${co.tranUsd} USD`); process.exitCode = 4; }
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e instanceof Error ? e.name : e); process.exit(1); });
