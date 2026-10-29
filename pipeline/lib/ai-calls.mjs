// ai-calls.mjs — PL29 `so-cuoc-goi-ai`: tổng hợp sổ cuộc gọi AI (bảng ai_calls + ai_model_prices, migration 052) theo
// ngày (giờ Việt Nam) × việc × model: số cuộc, số lỗi, token vào/ra, chi phí (đồng), độ trễ p50/p95.
// Hai bên dùng: push-ops-facts (khối `aiCalls` lên cloud) và trang /ops/ai-calls ở máy thu — app CHÉP NGUYÊN VĂN
// AI_CALLS_SQL vào app/src/lib/ai-calls-queries.ts (app không import pipeline); test so hai chuỗi.
// Chi phí = Σ token vào × gia_vao / 1e6 + Σ token ra × gia_ra / 1e6; model không có dòng giá → NULL (không phải 0).
// `tongHopDong` là bản thuần cùng phép tính, để test ma trận không cần DB và để đầu dò đối chiếu với câu SQL.

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

/** Ngày giờ Việt Nam (UTC+7, không đổi giờ) của một mốc. */
export function ngayVN(at) {
  return new Date(new Date(at).getTime() + 7 * 3600_000).toISOString().slice(0, 10)
}

/** Phân vị nội suy tuyến tính — cùng định nghĩa percentile_cont của Postgres. */
export function phanVi(xs, p) {
  const s = [...xs].sort((a, b) => a - b)
  if (!s.length) return null
  const k = (s.length - 1) * p
  const lo = Math.floor(k)
  const hi = Math.ceil(k)
  return s[lo] + (s[hi] - s[lo]) * (k - lo)
}

const lam2 = (x) => Math.round(x * 100) / 100

/** Chuẩn một dòng kết quả của AI_CALLS_SQL thành nhóm (số thay cho chuỗi bigint/numeric). */
export function dongNhom(r) {
  return {
    ngay: r.ngay,
    viec: r.viec,
    model: r.model,
    cuoc: Number(r.cuoc),
    loi: Number(r.loi),
    tokenVao: Number(r.token_vao),
    tokenRa: Number(r.token_ra),
    chiPhi: r.chi_phi == null ? null : Number(r.chi_phi),
    p50Ms: r.p50_ms == null ? null : Number(r.p50_ms),
    p95Ms: r.p95_ms == null ? null : Number(r.p95_ms),
  }
}

/** Bản thuần của AI_CALLS_SQL: `calls` = [{at, viec, model, input_tokens, output_tokens, latency_ms, ok}],
 * `gia` = {model: {gia_vao, gia_ra}}. Trả nhóm cùng khuôn `dongNhom`, cùng thứ tự (ngày giảm, việc, model). */
export function tongHopDong(calls, gia) {
  const m = new Map()
  for (const c of calls) {
    const k = `${ngayVN(c.at)}\u0000${c.viec}\u0000${c.model}`
    if (!m.has(k)) m.set(k, { ngay: ngayVN(c.at), viec: c.viec, model: c.model, ds: [] })
    m.get(k).ds.push(c)
  }
  const nhom = [...m.values()].map(({ ngay, viec, model, ds }) => {
    const tokenVao = ds.reduce((a, c) => a + (c.input_tokens ?? 0), 0)
    const tokenRa = ds.reduce((a, c) => a + (c.output_tokens ?? 0), 0)
    const p = gia[model]
    return {
      ngay, viec, model,
      cuoc: ds.length,
      loi: ds.filter((c) => !c.ok).length,
      tokenVao, tokenRa,
      chiPhi: p ? lam2((tokenVao * p.gia_vao + tokenRa * p.gia_ra) / 1e6) : null,
      p50Ms: Math.round(phanVi(ds.map((c) => c.latency_ms), 0.5)),
      p95Ms: Math.round(phanVi(ds.map((c) => c.latency_ms), 0.95)),
    }
  })
  return nhom.sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : a.viec.localeCompare(b.viec) || a.model.localeCompare(b.model)))
}

/** Tóm tắt cả cửa sổ: tổng cuộc, token, chi phí (cộng nhóm có giá), số nhóm chưa có giá. */
export function tomTat(nhom) {
  const coGia = nhom.filter((n) => n.chiPhi != null)
  return {
    cuoc: nhom.reduce((a, n) => a + n.cuoc, 0),
    loi: nhom.reduce((a, n) => a + n.loi, 0),
    tokenVao: nhom.reduce((a, n) => a + n.tokenVao, 0),
    tokenRa: nhom.reduce((a, n) => a + n.tokenRa, 0),
    chiPhi: coGia.length ? lam2(coGia.reduce((a, n) => a + n.chiPhi, 0)) : null,
    nhomChuaCoGia: nhom.length - coGia.length,
  }
}

/** Đọc sổ qua client pg (máy thu): { days, nhom, tong }. */
export async function readAiCalls(client, days = 30) {
  const { rows } = await client.query(AI_CALLS_SQL, [days])
  const nhom = rows.map(dongNhom)
  return { days, nhom, tong: tomTat(nhom) }
}
