import { pool } from "./db";
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

/** /ops (+ /api/v1/ops/coverage): từng ô nguồn × thành phố theo định nghĩa chung (lib/freshness, AU6).
 * Mã active chưa khai SLO không có ô — nó hiện ở /ops/collections là «Chưa khai SLO». */
export async function getCoverageOverview(): Promise<CoverageRow[]> {
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

/** Trạng thái 7 lớp lockdown Zalo + hạ tầng thu (H3-P2). Đọc watchdog log
 * (đã có cấu trúc) + check sống thực tại chỗ. null = không kiểm được. */
export async function getLockdownStatus(): Promise<{
  layers: LockdownLayer[];
  lastWatchdogAt: string | null;
  agentTurnsToday: number;
  openClawUp: boolean;
  kevUp: boolean;
  collectorUp: boolean;
}> {
  const { readFile } = await import("node:fs/promises");
  const { execFile } = await import("node:child_process");
  const promisify = (await import("node:util")).promisify;
  const run = promisify(execFile);

  let lastWd: string | null = null;
  let wdOk = false;
  try {
    const log = await readFile("pipeline/logs/zalo-watchdog.log", "utf8");
    const lines = log.trim().split("\n");
    const last = lines[lines.length - 1] ?? "";
    lastWd = last.slice(0, 25);
    wdOk = last.includes(" ok ");
  } catch {
    /* chưa có log */
  }

  let turns = 0;
  try {
    const { stdout } = await run("grep", [
      "-c",
      "auto-reply/agent-turn-timing",
      `/tmp/openclaw/openclaw-${new Date().toISOString().slice(0, 10)}.log`,
    ]);
    turns = Number(stdout.trim()) || 0;
  } catch {
    /* grep exit 1 khi 0 match hoặc file không tồn tại */
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
    { layer: "L1", desc: "Hook read-only (không API gửi tin)", ok: wdOk ? true : null },
    { layer: "L2", desc: "Bindings = [] (agent không bị kích từ kênh)", ok: wdOk ? true : null },
    { layer: "L3", desc: "Kênh bot OA tắt + mọi nhóm requireMention", ok: wdOk ? true : null },
    { layer: "L4", desc: "Watchdog 5′ đang canh", ok: wdOk },
    { layer: "L4b", desc: "Agent-turn hôm nay = 0", ok: turns === 0 },
    { layer: "Hạ tầng", desc: "OpenClaw chạy", ok: openClawUp },
    { layer: "Hạ tầng", desc: "Kev gate :8009", ok: kevUp },
    { layer: "Hạ tầng", desc: "Collector :9210", ok: collectorUp },
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
