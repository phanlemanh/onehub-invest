import { readFile, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import { pool } from "./db";

/**
 * Queries + trạng thái máy cho /ops/collections "Thu Thập" (E2 tiếp theo,
 * ADR-0007 DCA): cùng dữ liệu cho GUI và /api/v1/ops/collections.
 *
 * Ba câu hỏi trang phải trả lời:
 *  1. Hôm nay chảy vào gì? (DB counts theo ngày)
 *  2. Qua cổng nào? (funnel gate Kev parse hook log)
 *  3. Máy móc có chạy không? (launchd logs + probe port)
 */

export type FlowDay = {
  day: string; // YYYY-MM-DD
  airdnaMarkets: number;
  airdnaListings: number;
  airbnbListingsSeen: number;
  airbnbSnapshots: number;
  zaloPosts: number;
  zaloOffers: number;
};

/** Luồng N ngày gần nhất theo nguồn (mỗi cột một truy vấn con trên generate_series). */
export async function getFlowDays(n = 7): Promise<FlowDay[]> {
  const { rows } = await pool.query(
    `SELECT d::date::text AS day,
            (SELECT count(*) FROM airdna_markets m WHERE m.captured_at::date = d)::int AS airdna_markets,
            (SELECT count(*) FROM airdna_listings al WHERE al.captured_at::date = d)::int AS airdna_listings,
            (SELECT count(*) FROM listings l WHERE l.last_seen::date = d)::int AS airbnb_listings_seen,
            (SELECT count(*) FROM airbnb_snapshots s WHERE s.collected_at::date = d)::int AS airbnb_snapshots,
            (SELECT count(*) FROM stg_zalo_posts z WHERE z.captured_at::date = d)::int AS zalo_posts,
            (SELECT count(*) FROM sale_offers o WHERE o.first_seen::date = d)::int AS zalo_offers
       FROM generate_series(current_date - ($1::int - 1), current_date, interval '1 day') d
      ORDER BY d DESC`,
    [n],
  );
  return rows.map((r) => ({
    day: r.day,
    airdnaMarkets: r.airdna_markets,
    airdnaListings: r.airdna_listings,
    airbnbListingsSeen: r.airbnb_listings_seen,
    airbnbSnapshots: r.airbnb_snapshots,
    zaloPosts: r.zalo_posts,
    zaloOffers: r.zalo_offers,
  }));
}

export type GateFunnel = {
  lastEventAt: string | null;
  today: { messages: number; passed: number; skipped: number; accepted: number; media: number };
  last7: { messages: number; passed: number; skipped: number; accepted: number; media: number };
};

const EMPTY = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 };

/** Funnel cổng Kev từ hook log (~/.openclaw/logs/oneinvest-zalo-pipe.log). */
export async function readGateFunnel(): Promise<GateFunnel> {
  const file = path.join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log");
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch {
    return { lastEventAt: null, today: { ...EMPTY }, last7: { ...EMPTY } };
  }
  const lines = text.split("\n").filter(Boolean);
  const todayKey = new Date().toISOString().slice(0, 10);
  const cutoff = Date.now() - 7 * 86400000;
  const today = { ...EMPTY };
  const last7 = { ...EMPTY };
  let lastEventAt: string | null = null;
  for (const line of lines) {
    const ts = line.slice(0, 24);
    const iso = /^\d{4}-\d{2}-\d{2}T/.test(ts) ? ts : null;
    const in7 = iso ? new Date(iso).getTime() >= cutoff : true; // dòng không timestamp: đếm vào 7 ngày
    const day = iso ? iso.slice(0, 10) : null;
    for (const bucket of [in7 ? last7 : null, day === todayKey ? today : null]) {
      if (!bucket) continue;
      bucket.messages++;
      if (line.includes(" post 202")) {
        bucket.passed++;
        const m = line.match(/"accepted":(\d+)/);
        bucket.accepted += m ? Number(m[1]) : 0;
      } else if (/ skip /.test(line)) bucket.skipped++;
      if (/media/i.test(line)) bucket.media++;
    }
    if (iso) lastEventAt = iso;
  }
  return { lastEventAt, today, last7 };
}

export type JobStatus = {
  id: string;
  label: string;
  schedule: string;
  alive: "yes" | "no" | "unknown"; // probe HTTP localhost
  lastLogAt: string | null;
  lastLine: string | null;
};

const ROOT = process.cwd().endsWith("/app") ? path.resolve(process.cwd(), "..") : process.cwd();
const LOGS = path.join(ROOT, "pipeline/logs");

async function tailFile(file: string): Promise<{ mtime: string | null; lastLine: string | null }> {
  try {
    const st = await stat(file);
    const text = await readFile(file, "utf8");
    const lines = text.split("\n").filter((l) => l.trim());
    return { mtime: st.mtime.toISOString(), lastLine: lines.at(-1)?.slice(0, 140) ?? null };
  } catch {
    return { mtime: null, lastLine: null };
  }
}

async function latestWeeklyLog(): Promise<string | null> {
  try {
    const files = (await readdir(LOGS)).filter((f) => /^weekly-.*\.log$/.test(f)).sort();
    return files.length ? path.join(LOGS, files.at(-1)!) : null;
  } catch {
    return null;
  }
}

async function probe(url: string): Promise<"yes" | "no"> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 800);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    return res.status > 0 ? "yes" : "no";
  } catch {
    return "no";
  }
}

/** Trạng thái 5 launchd agent + 2 dịch vụ KeepAlive. */
export async function readSchedulerStatus(): Promise<JobStatus[]> {
  const weekly = await latestWeeklyLog();
  const [kevAlive, apiAlive, airdnaLog, smokeLog, apiLog, weeklyTail] = await Promise.all([
    probe("http://127.0.0.1:8009/"),
    probe("http://127.0.0.1:9210/"),
    tailFile(path.join(LOGS, "airdna-daily.log")),
    tailFile(path.join(LOGS, "launchd-smoke.log")),
    tailFile(path.join(LOGS, "launchd-collector-api.log")),
    weekly ? tailFile(weekly) : Promise.resolve({ mtime: null, lastLine: null }),
  ]);
  return [
    {
      id: "airdna-daily",
      label: "AirDNA toàn quốc (rotation 6 market)",
      schedule: "19:05 hằng ngày",
      alive: "unknown",
      lastLogAt: airdnaLog.mtime,
      lastLine: airdnaLog.lastLine,
    },
    {
      id: "collector",
      label: "Airbnb tự thu Hà Nội (discovery + listing + finalize)",
      schedule: "Chủ nhật 19:30 +jitter ≤30′",
      alive: "unknown",
      lastLogAt: weeklyTail.mtime,
      lastLine: weeklyTail.lastLine,
    },
    {
      id: "smoke",
      label: "Smoke Airbnb (detect đổi markup)",
      schedule: "20:00 hằng ngày",
      alive: "unknown",
      lastLogAt: smokeLog.mtime,
      lastLine: smokeLog.lastLine,
    },
    {
      id: "collector-api",
      label: "Agent ingest :9210",
      schedule: "KeepAlive — chạy liên tục",
      alive: apiAlive,
      lastLogAt: apiLog.mtime,
      lastLine: apiLog.lastLine,
    },
    {
      id: "kev",
      label: "Kev gate :8009",
      schedule: "KeepAlive — chạy liên tục",
      alive: kevAlive,
      lastLogAt: null,
      lastLine: null,
    },
  ];
}

export type RotationPreview = {
  updatedAt: string | null;
  cursor: number;
  total: number;
  next: { id: string; name: string; lastCapturedAt: string | null }[];
};

/** Xem trước rotation kế tiếp: lặp logic airdna-rotate.mjs (skip fresh <24h). */
export async function readRotationPreview(): Promise<RotationPreview> {
  let cursor = 0;
  let updatedAt: string | null = null;
  try {
    const st = JSON.parse(
      await readFile(path.join(ROOT, "collector/state/airdna-rotation.json"), "utf8"),
    );
    cursor = st.cursor ?? 0;
    updatedAt = st.updatedAt ?? null;
  } catch {
    /* chưa chạy đêm nào */
  }
  const { rows } = await pool.query(
    `SELECT airdna_id, name, captured_at FROM airdna_markets
      WHERE country_code = 'vn' ORDER BY airdna_id::int`,
  );
  const cutoff = Date.now() - 86400000;
  const next: RotationPreview["next"] = [];
  let i = cursor;
  for (let step = 0; step < rows.length && next.length < 6; step++) {
    const r = rows[i % rows.length];
    const fresh = r.captured_at !== null && new Date(r.captured_at).getTime() > cutoff;
    if (!fresh) {
      next.push({
        id: String(r.airdna_id),
        name: r.name ?? r.airdna_id,
        lastCapturedAt: r.captured_at ? new Date(r.captured_at).toISOString() : null,
      });
    }
    i++;
  }
  return { updatedAt, cursor, total: rows.length, next };
}
