import type { User } from "./auth";
import { pool } from "./db";
import { vnDayKey, vnDayStart } from "./format";
import { ageState, readOpsFacts, type OpsFacts } from "./ops-facts";
import { isAdmin } from "./ops-access";
import { buildOfferImages, type PostMediaRow, type ReviewImage } from "./ops/review-media";

/**
 * Số cho /ops/data-flow «Dòng chảy dữ liệu»: một tin đi từ bài nhận → đọc được → tin rao → gắn căn, theo nguồn, theo
 * ngày và theo nhóm thu. CHỈ ĐỌC.
 *
 * DF1 (luật 10, ADR-0014): phần TỔNG HỢP (`FlowFacts`) tính sẵn ở pipeline/sql/600_data_flow.sql vào bảng
 * `data_flow_snapshot` (migration 051, chỉ ở máy thu) — MỘT định nghĩa. Máy thu đọc bảng; máy chủ đọc khối `dataFlow`
 * mà push-ops-facts chở lên (`readOpsFacts`). Trang không còn câu tổng hợp nào. «Tin mới nhất» đọc `sale_offers` ở cả
 * hai nơi; bài gốc chỉ có ở máy thu (TV9).
 *
 * Hai đồng hồ, một luật (định nghĩa ở 600): bài tính theo ngày đăng (`posted_at`, S06 `list_time`), tin theo
 * `first_seen`. Bài «đọc được» = bài nằm trong `post_ids` của một tin cùng nguồn; S06 chưa có khoá nối ngược bài → tin
 * (TV10), nên chặng đọc được của S06 là ước lượng bằng số tin (`approx`).
 */

export type FlowWindow = "7d" | "30d" | "all";
export const FLOW_WINDOWS: readonly FlowWindow[] = ["7d", "30d", "all"];
export type FlowSource = "S03" | "S05" | "S06";
export const FLOW_SOURCES: readonly FlowSource[] = ["S03", "S05", "S06"];

/** Số các chặng của một nguồn (hoặc một ngày, một nhóm thu). */
export type StageCounts = {
  /** Bài thật vào bảng nạp (đã gạt bài thử). */
  received: number;
  /** Bài thành (một phần của) tin rao. */
  readable: number;
  /** Tin rao mới (sau gộp trùng). */
  offers: number;
  /** Tin đã gắn về một căn. */
  linked: number;
};

export type SourceFlow = StageCounts & {
  source: FlowSource;
  testRejected: number;
  withWard: number;
  withType: number;
  withPriceArea: number;
  /** Tin đủ năm trường lõi (= bậc B1 trở lên, lib/data-level.ts). */
  complete: number;
  highConfidence: number;
  latestAt: string | null;
  approx: boolean;
};

export type FlowDay = StageCounts & { day: string; source: FlowSource };

export type GroupFlow = {
  /** Tên nhóm thu S03/S05 — tầng C (ADR-0007 sửa đổi 24/10), hiện được ở /ops. */
  group: string;
  source: FlowSource;
  received: number;
  readable: number;
  offers: number;
  latestAt: string | null;
};

export type ShortStay = { received: number; stored: number; withWard: number; latestAt: string | null };

export type KindMix = { sale: number; rentLt: number; shortStay: number };

export type FlowRecord = {
  offerId: string;
  source: string;
  kind: string;
  propertyType: string;
  priceVnd: number | null;
  areaM2: number | null;
  bedrooms: number | null;
  ward: string | null;
  market: string | null;
  confidence: string;
  nPosts: number;
  linked: boolean;
  firstSeen: string;
  lastSeen: string;
  /** Bài gốc sớm nhất (cắt 600 ký tự) — chỉ có ở S03/S05. */
  postText: string | null;
  postGroup: string | null;
};

/** Phần tổng hợp của DataFlow — đúng các khoá 600_data_flow.sql ghi vào `facts` (danh sách đóng, khối lên cloud). */
export const FLOW_FACT_KEYS = ["sources", "days", "groups", "shortStay", "mix", "enrichPending"] as const;
export type FlowFacts = {
  sources: SourceFlow[];
  days: FlowDay[];
  groups: GroupFlow[];
  shortStay: ShortStay;
  mix: KindMix;
  enrichPending: number;
};

/** Trạng thái số tổng hợp: máy thu theo `computed_at` cũ nhất của bảng tính sẵn (`fresh`/`stale`/`none`); máy chủ theo
 * khối (ADR-0014). */
export type FlowFactsState = "fresh" | "stale" | "none" | "error";

export type DataFlow = FlowFacts & {
  window: FlowWindow;
  since: string | null;
  records: FlowRecord[];
  /** Thẻ chờ duyệt — máy chủ lấy từ khối `reviewQueue`; null = không có số. */
  reviewPending: number | null;
  /** «local» = máy thu (bảng tính sẵn), «cloud» = máy chủ (khối bản tin). */
  mode: "local" | "cloud";
  /** `computed_at` cũ nhất của bảng tính sẵn — máy thu đọc thẳng, máy chủ qua `measured_at` của khối. */
  computedAt: string | null;
  factsState: FlowFactsState;
  factsError: string | null;
};

const WINDOW_DAYS: Record<FlowWindow, number | null> = { "7d": 7, "30d": 30, all: null };

/** Ngày VN bắt đầu cửa sổ `n` ngày tính tới `now` (gồm hôm nay). */
function windowStart(n: number, now: number): Date {
  return vnDayStart(vnDayKey(now - (n - 1) * 86400000));
}

const num = (v: unknown) => Number(v ?? 0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hàng pg trả về động; mỗi chỗ đọc ép kiểu tường minh
type FlowQueryFn = (text: string, values?: unknown[]) => Promise<{ rows: any[] }>;

const EMPTY_FACTS: FlowFacts = {
  sources: [],
  days: [],
  groups: [],
  shortStay: { received: 0, stored: 0, withWard: 0, latestAt: null },
  mix: { sale: 0, rentLt: 0, shortStay: 0 },
  enrichPending: 0,
};

/** «Tin mới nhất»: mỗi nguồn tối đa 150 tin (S06 ~500 tin/ngày không đẩy tin nhóm khép ra khỏi bảng). Máy thu kèm bài
 * gốc sớm nhất (cắt 600 ký tự); máy chủ không có bảng bài nên `postText`/`postGroup` null (Hỏi-1 DF1). */
const recordsSql = (withPost: boolean) => `
  SELECT o.offer_id, o.source, o.kind, o.property_type, o.price_vnd, o.area_m2, o.bedrooms, o.confidence,
         o.n_reposts, o.first_seen::text, o.last_seen::text,
         a.name AS ward, m.name AS market,
         EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id) AS linked,
         ${withPost ? "z.text AS post_text, z.group_name AS post_group" : "NULL::text AS post_text, NULL::text AS post_group"}
  FROM (
    SELECT *, row_number() OVER (PARTITION BY source ORDER BY first_seen DESC) AS rn
    FROM sale_offers WHERE first_seen >= $1 AND source IN ('S03', 'S05', 'S06')
  ) o
  LEFT JOIN areas a ON a.id = o.area_id
  LEFT JOIN areas m ON m.id = a.parent_id
  ${
    withPost
      ? `LEFT JOIN LATERAL (
    SELECT left(s.text, 600) AS text, s.group_name FROM stg_zalo_posts s
    WHERE s.post_id = ANY (o.post_ids) ORDER BY s.posted_at LIMIT 1
  ) z ON TRUE`
      : ""
  }
  WHERE o.rn <= 150
  ORDER BY o.first_seen DESC`;

/** Kết quả đọc phần tổng hợp của một cửa sổ (máy thu hay máy chủ). */
type FactsRead = { state: FlowFactsState; at: string | null; facts: FlowFacts | null; error: string | null };

/** Số tổng hợp của một cửa sổ ở máy thu: dòng `data_flow_snapshot` (bảng vắng hay chưa làm tươi → `none`). Tuổi số
 * theo `computed_at` CŨ NHẤT của bảng — cùng luật `measured_at` của khối cloud (DF1 AC-4) — so bằng `ageState` của
 * ops-facts (một ngưỡng FACTS_STALE_MS cho hai nơi): bước làm tươi gãy quá 45′ thì `stale`. */
async function localFacts(q: FlowQueryFn, window: FlowWindow, now: number): Promise<FactsRead> {
  try {
    // Mốc ISO UTC (ms) — cùng dạng `measured_at` mà push-ops-facts ghi cho khối `dataFlow`.
    const { rows } = await q(
      `SELECT facts,
              (SELECT to_char(min(computed_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') FROM data_flow_snapshot) AS oldest_at
       FROM data_flow_snapshot WHERE time_window = $1`,
      [window],
    );
    const r = rows[0];
    if (!r) return { state: "none", at: null, facts: null, error: null };
    const at = r.oldest_at as string;
    return { state: ageState(at, new Date(now)), at, facts: r.facts as FlowFacts, error: null };
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") return { state: "none", at: null, facts: null, error: null };
    throw err;
  }
}

/** Số tổng hợp của một cửa sổ ở máy chủ: khối `dataFlow` của bản tin (trạng thái theo `measured_at` = computed_at). */
function cloudFacts(facts: OpsFacts, window: FlowWindow): FactsRead {
  const b = facts.blocks.dataFlow;
  if (!b) return { state: "none", at: null, facts: null, error: null };
  if (b.state === "error") return { state: "error", at: b.measuredAt, facts: null, error: b.error };
  const windows = (b.data?.windows ?? {}) as Partial<Record<FlowWindow, FlowFacts>>;
  const f = windows[window];
  if (!f) return { state: "error", at: b.measuredAt, facts: null, error: `khối không có cửa sổ ${window}` };
  return { state: b.state, at: b.measuredAt, facts: f, error: null };
}

export async function getDataFlow(
  window: FlowWindow,
  opts: {
    now?: number;
    query?: FlowQueryFn;
    /** Bỏ trống → theo nơi chạy: `VERCEL=1` → máy chủ, còn lại → máy thu (cùng quy ước collections-queries/audit).
     * Không nhận theo bảng có mặt: cloud có thể giữ bảng `stg_*` RỖNG (leak gate chỉ đòi 0 dòng) — sự cố prod 27/10. */
    mode?: "local" | "cloud";
    /** Máy chủ: đọc bản tin (mặc định readOpsFacts). */
    readFacts?: (o: { now: Date }) => Promise<OpsFacts>;
  } = {},
): Promise<DataFlow> {
  const q: FlowQueryFn = opts.query ?? ((text, values) => pool.query(text, values));
  // Chạy ở server; trang truyền mốc request (requestTime) để mọi vùng cùng một «bây giờ».
  const now = opts.now ?? Date.now();
  const mode = opts.mode ?? (process.env.VERCEL === "1" ? "cloud" : "local");
  const n = WINDOW_DAYS[window];
  const since = n ? windowStart(n, now) : null;
  const totalsStart = since ?? new Date(0);

  let reviewPending: number | null = null;
  let f: FactsRead;
  if (mode === "local") {
    const [lf, pending] = await Promise.all([
      localFacts(q, window, now),
      q(`SELECT count(*) AS review FROM review_queue WHERE status = 'pending'`),
    ]);
    f = lf;
    reviewPending = num(pending.rows[0]?.review);
  } else {
    const facts = await (opts.readFacts ?? readOpsFacts)({ now: new Date(now) });
    f = cloudFacts(facts, window);
    const rq = facts.blocks.reviewQueue;
    if (rq && rq.state !== "error" && rq.data) reviewPending = num((rq.data as { total?: unknown }).total);
  }
  const records = await q(recordsSql(mode === "local"), [totalsStart]);

  return {
    ...(f.facts ?? EMPTY_FACTS),
    window,
    since: since ? since.toISOString() : null,
    records: records.rows.map((r) => ({
      offerId: r.offer_id,
      source: r.source,
      kind: r.kind,
      propertyType: r.property_type ?? "unknown",
      priceVnd: r.price_vnd == null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 == null ? null : Number(r.area_m2),
      bedrooms: r.bedrooms == null ? null : Number(r.bedrooms),
      ward: r.ward ?? null,
      market: r.market ?? null,
      confidence: r.confidence,
      nPosts: num(r.n_reposts),
      linked: Boolean(r.linked),
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      postText: r.post_text ?? null,
      postGroup: r.post_group ?? null,
    })),
    reviewPending,
    mode,
    computedAt: f.at,
    factsState: f.state,
    factsError: f.error,
  };
}

export function parseFlowWindow(v: string | string[] | undefined): FlowWindow {
  const s = Array.isArray(v) ? v[0] : v;
  return (FLOW_WINDOWS as readonly string[]).includes(s ?? "") ? (s as FlowWindow) : "7d";
}

// ---- Ảnh tin của hồ sơ tin (AC-10, Mạnh sửa ở Cổng Phạm vi 26/10) ----
// Cùng luật với Hàng duyệt: ảnh tin chỉ cho admin, chỉ ở máy thu; ghép bằng chính buildOfferImages (ảnh đã tải trước,
// rồi URL gốc, không trùng, tối đa 12). Không sửa lib/ops/review-media.ts — tệp nằm trong hồ sơ đã ký của Hàng duyệt.
// S06 chưa có khoá nối tin → quảng cáo (TV10) nên không truy vấn ảnh cho S06.

const MEDIA_SQL = `
  SELECT o.offer_id, p.snapshot_id, p.media, p.media_files
  FROM sale_offers o
  CROSS JOIN LATERAL unnest(o.post_ids) WITH ORDINALITY AS u(post_id, ord)
  JOIN stg_zalo_posts p ON p.post_id = u.post_id
  WHERE o.offer_id = ANY($1::text[])
  ORDER BY o.offer_id, u.ord`;

export type MediaQuery = (text: string, values: unknown[]) => Promise<{ rows: PostMediaRow[] }>;
const defaultMediaQuery: MediaQuery = (text, values) => pool.query<PostMediaRow>(text, values);

/** Ảnh từng tin S03/S05, khoá theo offer_id. Không phải admin → `{}` không chạm DB; cloud (42P01) → `{}`. */
export async function loadFlowMedia(
  records: Pick<FlowRecord, "offerId" | "source">[],
  user: User | null,
  query: MediaQuery = defaultMediaQuery,
): Promise<Record<string, ReviewImage[]>> {
  if (!isAdmin(user)) return {};
  const ids = [...new Set(records.filter((r) => r.source === "S03" || r.source === "S05").map((r) => r.offerId))];
  if (ids.length === 0) return {};
  let rows: PostMediaRow[];
  try {
    ({ rows } = await query(MEDIA_SQL, [ids]));
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") return {};
    throw err;
  }
  const posts = new Map<string, PostMediaRow[]>();
  for (const r of rows) posts.set(r.offer_id, [...(posts.get(r.offer_id) ?? []), r]);
  return Object.fromEntries(ids.map((id) => [id, buildOfferImages(posts.get(id) ?? [])]));
}
