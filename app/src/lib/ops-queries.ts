import { pool } from "./db";
import { shortAreaName } from "./market-names";
import { bySource as freshnessBySource, readFreshness, type FreshnessRow, type FreshnessStatus, type QueryClient } from "./freshness";

/**
 * Queries vận hành dùng chung bởi /ops (GUI) và /api/v1/ops/* (máy) —
 * cùng một nguồn dữ liệu, hai bề mặt (ADR-0007 DCA).
 * Danh tính nguồn trả về MÃ tầng B (S01…), không bao giờ tên thật.
 */

export type CoverageRow = {
  code: string; // SPL tầng B
  /** Thành phố có dữ liệu của mã; null khi mã chưa có dữ liệu ở bảng nạp. */
  city: string | null;
  lastSnapshotAt: string | null;
  ageHours: number | null;
  sloHours: number;
  /** Cho máy đọc cũ của /api/v1/ops/coverage — suy từ giờ: floor(ageHours/24), sloHours/24. */
  ageDays: number | null;
  sloDays: number;
  status: "fresh" | "stale" | "none";
};

/** pg Pool qua khuôn client tối thiểu của lib/freshness. */
const freshnessClient: QueryClient = {
  query: (sql, args) => pool.query(sql, args as unknown[] | undefined),
};

/** Độ tươi chỉ đo được ở máy local: cloud KHÔNG có source_registry và bảng nạp (tầng A — leak gate, drop
 * 2026-10-21; cùng lý do với getMarketFreshness ở lib/queries). Khi vắng, hai hàm độ tươi trả rỗng thay vì 500
 * (sự cố prod 24/10) và trang nói rõ «Độ tươi chỉ đo ở máy local». */
export async function freshnessLocalOnly(): Promise<boolean> {
  return localOnlyTable("source_registry");
}

/** Bảng tầng A (source_registry, review_queue, stg_*…) chỉ có ở máy local — leak gate giữ nó khỏi cloud. True khi
 * bảng vắng ở DB đang nối: trang dùng nó dừng sớm bằng LocalOnlyAlert thay vì ném 42P01 (sự cố prod 24/10). */
export async function localOnlyTable(table: string): Promise<boolean> {
  const { rows } = await pool.query<{ r: string | null }>(`SELECT to_regclass($1)::text AS r`, [table]);
  return rows[0]?.r == null;
}

/** Tên ngắn của quốc gia và thị trường (`areas.name` bỏ tiền tố «Thành phố »/«Tỉnh ») theo mã khu vực — mọi trang Ops
 * dùng chung để hiện tên thay mã thô (ON12). `areas` là dữ liệu công khai, có cả ở cloud; lỗi đọc → bảng rỗng (nơi
 * hiện in «(chưa có tên Việt)»). */
export async function getAreaNames(): Promise<Record<string, string>> {
  try {
    const { rows } = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM areas WHERE region_type IN ('country', 'market')`,
    );
    return Object.fromEntries(rows.map((r) => [r.id, shortAreaName(r.name)]));
  } catch {
    return {};
  }
}

/** /ops (+ /api/v1/ops/coverage): từng ô nguồn × thành phố theo định nghĩa chung (lib/freshness, AU6).
 * Mã active chưa khai SLO không có ô — nó hiện ở /ops/collections là «Chưa khai SLO». */
export async function getCoverageOverview(): Promise<CoverageRow[]> {
  if (await freshnessLocalOnly()) return [];
  const rows = await readFreshness(freshnessClient);
  return rows
    .filter((r): r is FreshnessRow & { sloHours: number; status: CoverageRow["status"] } => r.status !== "no-slo")
    .map((r) => ({
      code: r.code,
      city: r.city,
      lastSnapshotAt: r.last,
      ageHours: r.ageHours,
      sloHours: r.sloHours,
      ageDays: r.ageHours === null ? null : Math.floor(r.ageHours / 24),
      sloDays: r.sloHours / 24,
      status: r.status,
    }));
}

// ═══ H3 (2026-10-21): Sức khoẻ nguồn + Lockdown + Thước ═══

export type SourceFeedHealth = {
  code: string;
  labelVi: string;
  status: string;
  note: string | null;
  lastRunAt: string | null;
  lastRunSource: string | null;
  items24h: number;
  stgRows: number;
  offers: number | null;
  /** Tuổi lớn nhất trong các thành phố của nguồn, theo giờ thu (lib/freshness). */
  freshnessHrs: number | null;
  sloHours: number | null;
  /** Độ tươi gộp của nguồn; null khi nguồn không active (không đo). */
  freshness: FreshnessStatus | null;
};

/** Sức khoẻ từng nguồn S01–S06: lần chạy + bản ghi 24h derive từ airbnb_snapshots (mọi lần chạy
 * ghi snapshot) + stg/offers; ĐỘ TƯƠI và SLO lấy từ định nghĩa chung lib/freshness (AU6) — cùng số với /ops.
 * Không cần fact mới — đúng nguyên tắc precompute/derive, React chỉ đọc. */
export async function getSourceFeedHealth(): Promise<SourceFeedHealth[]> {
  if (await freshnessLocalOnly()) return [];
  const { rows: reg } = await pool.query(
    `SELECT code, label_vi, status, note FROM source_registry ORDER BY code`,
  );
  const { rows: snaps } = await pool.query(
    `SELECT source, max(collected_at) AS last, count(*) FILTER (
       WHERE collected_at >= now() - interval '24 hours') AS n24
     FROM airbnb_snapshots WHERE source IS NOT NULL GROUP BY source`,
  );
  // snapshot city__SOURCE__ts → source vào airbnb_snapshots.source đã gọn
  const bySource = new Map(
    snaps.map((s: { source: string; last: Date; n24: string }) => [s.source, s]),
  );
  const { rows: stg } = await pool.query(`
    SELECT 'S03' code, count(*)::int n FROM stg_zalo_posts
    UNION ALL SELECT 'S06', count(*)::int FROM stg_chotot_ads
    UNION ALL SELECT 'S01', (SELECT count(*)::int FROM stg_abnb_listings)
    UNION ALL SELECT 'S02', (SELECT count(*)::int FROM stg_abnb_listings)`);
  const stgBy = new Map(stg.map((r: { code: string; n: number }) => [r.code, r.n]));
  const { rows: offers } = await pool.query(
    `SELECT source, count(*)::int n FROM sale_offers GROUP BY source`,
  );
  const offersBy = new Map(offers.map((r: { source: string; n: number }) => [r.source, r.n]));

  const fresh = new Map(freshnessBySource(await readFreshness(freshnessClient)).map((f) => [f.code, f]));
  const SNAP_OF: Record<string, string[]> = {
    S01: ["airbnb-discovery", "airbnb-listing"],
    S02: ["airdna-research"],
    S03: ["zalo-agent"],
    S05: ["zalo-agent"], // FB qua cùng collector (agent_id phân biệt trong stg)
    S06: ["chotot-ads"],
  };

  return reg.map((r: { code: string; label_vi: string; status: string; note: string | null }) => {
    const srcs = SNAP_OF[r.code] ?? [];
    let last: Date | null = null;
    let lastSrc: string | null = null;
    let n24 = 0;
    for (const s of srcs) {
      const x = bySource.get(s);
      if (x) {
        n24 += Number(x.n24);
        if (!last || new Date(x.last) > last) {
          last = new Date(x.last);
          lastSrc = s;
        }
      }
    }
    const f = fresh.get(r.code);
    return {
      code: r.code,
      labelVi: r.label_vi,
      status: r.status,
      note: r.note,
      lastRunAt: last ? last.toISOString() : null,
      lastRunSource: lastSrc,
      items24h: n24,
      stgRows: stgBy.get(r.code) ?? 0,
      offers: offersBy.get(r.code) ?? null,
      freshnessHrs: f?.ageHours ?? null,
      sloHours: f?.sloHours ?? null,
      freshness: f?.status ?? null,
    };
  });
}

export type LockdownLayer = { layer: string; desc: string; ok: boolean | null };

/** Watchdog ghi `<ISO> ok — …` mỗi 5′ (launchd StartInterval 300) và KHÔNG ghi `ok` khi thấy sự cố; dòng `ok` cũ hơn
 * 3 chu kỳ = watchdog đã dừng hoặc đang báo sự cố (ON2 Hỏi-1 = A, Mạnh 24/10). */
const WATCHDOG_FRESH_MS = 15 * 60_000;

/** Trạng thái 7 lớp lockdown Zalo + hạ tầng thu (H3-P2). Đọc watchdog log
 * (đã có cấu trúc) + check sống thực tại chỗ. null = không kiểm được — không bao giờ «Ổn» cho lớp không kiểm (ON2).
 * `root`/`agentLogDir`/`now` chỉ để phép đo trỏ thư mục tạm; mặc định suy từ cwd như collections-queries. */
export async function getLockdownStatus(
  opts: { root?: string; agentLogDir?: string; now?: Date } = {},
): Promise<{
  layers: LockdownLayer[];
  lastWatchdogAt: string | null;
  agentTurnsToday: number | null;
  openClawUp: boolean;
  kevUp: boolean;
  collectorUp: boolean;
}> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const { execFile } = await import("node:child_process");
  const promisify = (await import("node:util")).promisify;
  const run = promisify(execFile);
  const now = opts.now ?? new Date();
  // Next chạy ở app/ — log nằm ở gốc kho (cùng cách suy ROOT với collections-queries), suy mỗi lần gọi.
  const root = opts.root ?? (process.cwd().endsWith("/app") ? path.resolve(process.cwd(), "..") : process.cwd());

  let lastWd: string | null = null;
  let wdFresh = false; // tệp vắng, dòng cuối không ok, hoặc ok cũ → watchdog không chứng được nó đang canh
  try {
    const log = await readFile(path.join(root, "pipeline/logs/zalo-watchdog.log"), "utf8");
    const lines = log.trim().split("\n");
    const last = lines[lines.length - 1] ?? "";
    lastWd = last.slice(0, 25);
    const at = Date.parse(lastWd);
    wdFresh = last.includes(" ok ") && Number.isFinite(at) && now.getTime() - at <= WATCHDOG_FRESH_MS;
  } catch {
    /* chưa có log — watchdog không chạy */
  }

  // L4b: tệp log gateway của NGÀY GIỜ MÁY (gateway và watchdog đặt tên bằng `date +%Y-%m-%d`). Đọc được → đếm dấu;
  // không đọc được → null («Chưa kiểm được»), KHÔNG coi là 0.
  const p2 = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  let turns: number | null = null;
  try {
    const text = await readFile(path.join(opts.agentLogDir ?? "/tmp/openclaw", `openclaw-${day}.log`), "utf8");
    turns = text.split("\n").filter((l) => l.includes("auto-reply/agent-turn-timing")).length;
  } catch {
    /* tệp vắng hoặc không đọc được */
  }

  const probe = async (url: string) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2500) });
      return r.status > 0 && r.status < 500;
    } catch {
      return false;
    }
  };
  const [openClawUp, kevUp, collectorUp] = await Promise.all([
    run("pgrep", ["-f", "openclaw"]).then(() => true).catch(() => false),
    probe("http://127.0.0.1:8009/v1/models"),
    probe("http://127.0.0.1:9210/agent-report"),
  ]);

  const layers: LockdownLayer[] = [
    { layer: "L1", desc: "Chỉ đọc — không có API gửi tin", ok: wdFresh ? true : null },
    { layer: "L2", desc: "Không gắn máy trả lời vào kênh nào", ok: wdFresh ? true : null },
    { layer: "L3", desc: "Tắt kênh tài khoản chính thức, nhóm phải nhắc tên mới trả lời", ok: wdFresh ? true : null },
    { layer: "L4", desc: "Bộ canh 5′ đang chạy", ok: wdFresh },
    { layer: "L4b", desc: "Lượt máy tự trả lời hôm nay = 0", ok: turns === null ? null : turns === 0 },
    { layer: "Hạ tầng", desc: "OpenClaw đang chạy", ok: openClawUp },
    { layer: "Hạ tầng", desc: "Cổng Kev :8009", ok: kevUp },
    { layer: "Hạ tầng", desc: "Cổng nhận tin :9210", ok: collectorUp },
  ];
  return { layers, lastWatchdogAt: lastWd, agentTurnsToday: turns, openClawUp, kevUp, collectorUp };
}

export type RulerHealth = {
  phuongWithRuler: number;
  totalPhuong: number;
  offersByTier: { tier: string; offers: number }[];
  sellers: number;
  gapOffers: number;
};

/** Độ dày thước P2 + phân bố tier (H3-P3 cho /ops/quality). */
export async function getRulerHealth(): Promise<RulerHealth> {
  const { rows } = await pool.query(`
    WITH r AS (
      SELECT count(DISTINCT area_id)::int n FROM (
        SELECT area_id FROM sale_offers
        WHERE source='S06' AND kind='sale' AND price_perm2 BETWEEN 5e6 AND 500e6
          AND area_id IS NOT NULL
        GROUP BY area_id HAVING count(*) >= 5) x)
    SELECT (SELECT n FROM r) AS ruler,
      (SELECT count(*)::int FROM areas WHERE region_type='submarket') AS total,
      (SELECT count(*)::int FROM sellers) AS sellers,
      (SELECT count(*)::int FROM sale_offers WHERE bait_gap_pct IS NOT NULL) AS gaps,
      (SELECT json_agg(t) FROM (
        SELECT price_tier AS tier, count(*)::int AS offers
        FROM sale_offers WHERE price_tier IS NOT NULL GROUP BY price_tier) t) AS tiers`);
  const r = rows[0] ?? {};
  return {
    phuongWithRuler: Number(r.ruler ?? 0),
    totalPhuong: Number(r.total ?? 0),
    offersByTier: (r.tiers ?? []) as { tier: string; offers: number }[],
    sellers: Number(r.sellers ?? 0),
    gapOffers: Number(r.gaps ?? 0),
  };
}
