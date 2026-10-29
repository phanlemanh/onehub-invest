// ai-calls-queries.ts — PL29 `so-cuoc-goi-ai`: số cho trang /ops/ai-calls «Cuộc gọi AI».
// Máy thu đọc thẳng bảng ai_calls + ai_model_prices (migration 052); máy chủ (VERCEL=1) đọc khối `aiCalls` của bản tin
// (ops_heartbeat, do pipeline/push-ops-facts.mjs đẩy). Hai bên cùng một phép tính: AI_CALLS_SQL dưới đây là BẢN CHÉP
// NGUYÊN VĂN của pipeline/lib/ai-calls.mjs (app không import pipeline) — app/tests/ai-calls.test.tsx so hai chuỗi.
import { pool } from "./db"
import { readOpsFacts, type FactsState } from "./ops-facts"

export const AI_CALLS_SQL = `
with g as (
  select (c.at at time zone 'Asia/Ho_Chi_Minh')::date::text as ngay, c.viec, c.model,
         count(*)::int as cuoc,
         count(*) filter (where not c.ok)::int as loi,
         coalesce(sum(c.input_tokens), 0)::bigint as token_vao,
         coalesce(sum(c.output_tokens), 0)::bigint as token_ra,
         percentile_cont(0.5) within group (order by c.latency_ms) as p50,
         percentile_cont(0.95) within group (order by c.latency_ms) as p95
  from ai_calls c
  where c.at >= now() - make_interval(days => $1::int)
  group by 1, 2, 3
)
select g.ngay, g.viec, g.model, g.cuoc, g.loi, g.token_vao::text, g.token_ra::text,
       case when p.model is null then null
            else round((g.token_vao * p.gia_vao + g.token_ra * p.gia_ra) / 1000000.0, 2)::text end as chi_phi,
       round(g.p50::numeric)::int as p50_ms, round(g.p95::numeric)::int as p95_ms
from g left join ai_model_prices p on p.model = g.model
order by g.ngay desc, g.viec, g.model`

export const AI_CALLS_DAYS = 30

export type AiCallGroup = {
  ngay: string
  viec: string
  model: string
  cuoc: number
  loi: number
  tokenVao: number
  tokenRa: number
  /** Đồng; null = model chưa có dòng giá (không phải 0). */
  chiPhi: number | null
  p50Ms: number | null
  p95Ms: number | null
}

export type AiCallTotals = {
  cuoc: number
  loi: number
  tokenVao: number
  tokenRa: number
  chiPhi: number | null
  nhomChuaCoGia: number
}

export type AiCalls = {
  mode: "local" | "cloud"
  /** none: chưa có số (máy chủ chưa nhận khối) · error: không đo được · fresh/stale theo mốc đo (ADR-0014). */
  state: FactsState | "error"
  measuredAt: string | null
  error: string | null
  nhom: AiCallGroup[]
  tong: AiCallTotals
}

type Row = Record<string, unknown>

/** Chuẩn một dòng của AI_CALLS_SQL (bigint/numeric về dạng chuỗi) thành nhóm số. */
export function dongNhom(r: Row): AiCallGroup {
  const so = (x: unknown) => (x == null ? null : Number(x))
  return {
    ngay: String(r.ngay),
    viec: String(r.viec),
    model: String(r.model),
    cuoc: Number(r.cuoc),
    loi: Number(r.loi),
    tokenVao: Number(r.token_vao),
    tokenRa: Number(r.token_ra),
    chiPhi: so(r.chi_phi),
    p50Ms: so(r.p50_ms),
    p95Ms: so(r.p95_ms),
  }
}

const lam2 = (x: number) => Math.round(x * 100) / 100

export function tomTat(nhom: AiCallGroup[]): AiCallTotals {
  const coGia = nhom.filter((n) => n.chiPhi != null)
  return {
    cuoc: nhom.reduce((a, n) => a + n.cuoc, 0),
    loi: nhom.reduce((a, n) => a + n.loi, 0),
    tokenVao: nhom.reduce((a, n) => a + n.tokenVao, 0),
    tokenRa: nhom.reduce((a, n) => a + n.tokenRa, 0),
    chiPhi: coGia.length ? lam2(coGia.reduce((a, n) => a + (n.chiPhi ?? 0), 0)) : null,
    nhomChuaCoGia: nhom.length - coGia.length,
  }
}

const RONG: AiCallTotals = { cuoc: 0, loi: 0, tokenVao: 0, tokenRa: 0, chiPhi: null, nhomChuaCoGia: 0 }

type QueryFn = (text: string, values: unknown[]) => Promise<{ rows: Row[] }>

/** Số trang «Cuộc gọi AI». `mode`/`query`/`readFacts` tiêm được cho phép đo; mặc định nơi chạy theo VERCEL. */
export async function getAiCalls(
  opts: {
    mode?: "local" | "cloud"
    query?: QueryFn
    readFacts?: typeof readOpsFacts
    now?: Date
  } = {},
): Promise<AiCalls> {
  const mode = opts.mode ?? (process.env.VERCEL === "1" ? "cloud" : "local")
  if (mode === "local") {
    const q: QueryFn = opts.query ?? ((text, values) => pool.query(text, values))
    try {
      const nhom = (await q(AI_CALLS_SQL, [AI_CALLS_DAYS])).rows.map(dongNhom)
      return { mode, state: "fresh", measuredAt: null, error: null, nhom, tong: tomTat(nhom) }
    } catch (err) {
      // Bảng 052 chưa áp ở máy thu: nói rõ, không vẽ 0.
      if ((err as { code?: string }).code === "42P01")
        return { mode, state: "error", measuredAt: null, error: "máy thu chưa có bảng ai_calls (migration 052 chưa áp)", nhom: [], tong: RONG }
      throw err
    }
  }
  const facts = await (opts.readFacts ?? readOpsFacts)({ now: opts.now })
  const b = facts.blocks.aiCalls
  if (!b) return { mode, state: "none", measuredAt: null, error: null, nhom: [], tong: RONG }
  if (b.state === "error") return { mode, state: "error", measuredAt: b.measuredAt, error: b.error, nhom: [], tong: RONG }
  const raw = Array.isArray(b.data?.nhom) ? (b.data.nhom as Row[]) : []
  // Khối đã ở dạng nhóm (camelCase) do bên ghi tính — đọc theo khoá của AiCallGroup.
  const nhom: AiCallGroup[] = raw.map((r) => ({
    ngay: String(r.ngay),
    viec: String(r.viec),
    model: String(r.model),
    cuoc: Number(r.cuoc),
    loi: Number(r.loi),
    tokenVao: Number(r.tokenVao),
    tokenRa: Number(r.tokenRa),
    chiPhi: r.chiPhi == null ? null : Number(r.chiPhi),
    p50Ms: r.p50Ms == null ? null : Number(r.p50Ms),
    p95Ms: r.p95Ms == null ? null : Number(r.p95Ms),
  }))
  return { mode, state: b.state, measuredAt: b.measuredAt, error: null, nhom, tong: tomTat(nhom) }
}
