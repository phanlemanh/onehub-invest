import { readFile, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import { pool } from "./db";
import { VN_TZ, vnDayKey, vnDayStart } from "./format";
import { lastMeaningfulLine } from "./last-log-line";
import { logsDir, treeRoot } from "./log-root";
import { maskSourceNames, type SourceNameEntry } from "./mask-source-names";
import { sourceLabel, type SourceRoles } from "./source-labels";
import {
  directoryCacheIsFresh,
  effectiveEnabledGroups,
  listZaloAccounts,
  readCachedDirectory,
  refreshZaloGroupDirectoryInBackground,
} from "./zalo-admin";

/**
 * Queries + trạng thái máy cho /ops/collections "Thu Thập" (E2 tiếp theo,
 * ADR-0007 DCA): cùng dữ liệu cho GUI và /api/v1/ops/collections.
 *
 * Ba câu hỏi trang phải trả lời:
 *  1. Hôm nay chảy vào gì? (DB counts theo ngày)
 *  2. Qua cổng nào? (funnel gate Kev parse hook log)
 *  3. Máy móc có chạy không? (launchd logs + probe port)
 */

// ---- C4 P2: trên cloud (Vercel), các hàn local-bound (đọc log/file/CLI)
// lấy dữ liệu từ ops_heartbeat do máy thu đẩy mỗi 15 phút ----

type LocalFacts = {
  pushedAt: string;
  funnel: GateFunnel;
  health: ZaloHealth;
  jobs: JobStatus[];
  rotation: { cursor: number; total: number; next: { id: string; name: string; lastCapturedAt: string | null }[]; updatedAt?: string | null };
  zaloGroups: ZaloGroupRow[];
  zaloFlow: Record<string, { posts?: number; offers?: number }>;
  zaloAccounts?: { accountId: string; name: string | null; profile: string; enabledGroups: string[] }[];
  sourceRuns?: { code: string; label_vi: string | null }[];
};

/** Cloud: danh sách tài khoản Zalo từ ops-heartbeat (read-only). */
export async function getZaloAccountsFromFacts(): Promise<LocalFacts["zaloAccounts"]> {
  const f = await getLocalFacts();
  return f?.zaloAccounts ?? [];
}

const isCloud = () => process.env.VERCEL === "1";

let factsCache: { at: number; facts: LocalFacts | null } | null = null;
async function getLocalFacts(): Promise<LocalFacts | null> {
  if (!isCloud()) return null;
  if (factsCache && Date.now() - factsCache.at < 30_000) return factsCache.facts;
  try {
    const { rows } = await pool.query<{ payload: LocalFacts }>(
      `SELECT payload FROM ops_heartbeat WHERE id = 'primary'`,
    );
    factsCache = { at: Date.now(), facts: rows[0]?.payload ?? null };
  } catch {
    factsCache = { at: Date.now(), facts: null };
  }
  return factsCache.facts;
}

/** Cloud: vai trò nguồn (code, label_vi) máy thu đã đẩy — nguồn của nhãn «S0x · vai trò» khi không có source_registry. */
export async function getFactsSourceRuns(): Promise<{ code: string; label_vi: string | null }[]> {
  const f = await getLocalFacts();
  return f?.sourceRuns ?? [];
}

/** Test: bỏ bộ nhớ đệm facts 30″ giữa các ca (lược đồ khác nhau trong cùng tiến trình). */
export function resetFactsCache(): void {
  factsCache = null;
}

export async function getFactsPushedAt(): Promise<string | null> {
  const f = await getLocalFacts();
  return f?.pushedAt ?? null;
}

export type FlowDay = {
  day: string; // YYYY-MM-DD
  airbnbListingsSeen: number;
  airbnbSnapshots: number;
  zaloPosts: number;
  zaloOffers: number;
};

// Hai cột S03 (ON5): CHÉP NGUYÊN VĂN S03_POSTS_SQL / S03_OFFERS_SQL của pipeline/lib/ops-flow.mjs — bên ghi khối `luong7`
// dùng bản đó; app/tests/luong-7-ngay-dung-so.test.tsx (ON5-AC-4) đối chiếu hai bên trên cùng lược đồ. Bài S03 thật
// (đúng tập transform S03 đọc — loadStgPosts + testMarker: không snapshot mock/thử, không bài S05 `apify-facebook`, không bài thử) theo ngày đăng; tin rao chỉ
// nguồn S03 theo first_seen (= giờ đăng bài sớm nhất).
const S03_POSTS_SQL = `SELECT (posted_at AT TIME ZONE '${VN_TZ}')::date::text d, count(*)::int n FROM stg_zalo_posts WHERE posted_at >= $1 AND split_part(snapshot_id, '__', 2) <> 'example' AND split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)' AND coalesce(agent_id, '') <> 'apify-facebook' AND coalesce(agent_id, '') !~* '^(e2e|test|mock)' AND btrim(coalesce(group_name, '')) !~* '^test($|[^[:alpha:]])' GROUP BY 1`;
const S03_OFFERS_SQL = `SELECT (first_seen AT TIME ZONE '${VN_TZ}')::date::text d, count(*)::int n FROM sale_offers WHERE first_seen >= $1 AND source = 'S03' GROUP BY 1`;

/** Luồng N ngày gần nhất theo nguồn. Perf-audit: từng là 42 subquery
 * non-sargable (col::date = d, 250ms, tăng theo bảng) — nay mỗi nguồn MỘT
 * GROUP BY có lọc khoảng ngày, gộp bằng JS. */
export async function getFlowDays(n = 7, opts: { now?: number } = {}): Promise<FlowDay[]> {
  // Ngày theo giờ VN (ON8): mốc `since` là 00:00 giờ VN của ngày cũ nhất; cột timestamptz gom bằng AT TIME ZONE
  // (DB chạy UTC); listings.last_seen là kiểu date nên giữ nguyên.
  const now = opts.now ?? Date.now();
  const oldest = vnDayKey(now - (n - 1) * 86400000);
  const since = vnDayStart(oldest);
  const vnDay = (col: string) => `(${col} AT TIME ZONE '${VN_TZ}')::date::text`;
  // ON6 (luật 5): trang Thu thập không có số S02 — không đếm airdna_* ở đây; số S02 chỉ ở /ops/quality.
  const [li, sn, zp, of] = await Promise.all([
    pool.query(`SELECT last_seen::date::text d, count(*)::int n FROM listings WHERE last_seen >= $1::date GROUP BY 1`, [oldest]),
    pool.query(`SELECT ${vnDay("collected_at")} d, count(*)::int n FROM airbnb_snapshots WHERE collected_at >= $1 GROUP BY 1`, [since]),
    pool.query(S03_POSTS_SQL, [since]),
    pool.query(S03_OFFERS_SQL, [since]),
  ]);
  const pick = (rows: { d: string; n: number }[]) => new Map(rows.map((r) => [r.d, r.n]));
  const [L, S, Z, O] = [pick(li.rows), pick(sn.rows), pick(zp.rows), pick(of.rows)];
  const days: FlowDay[] = [];
  for (let i = 0; i < n; i++) {
    const d = vnDayKey(now - i * 86400000);
    days.push({
      day: d,
      airbnbListingsSeen: L.get(d) ?? 0,
      airbnbSnapshots: S.get(d) ?? 0,
      zaloPosts: Z.get(d) ?? 0,
      zaloOffers: O.get(d) ?? 0,
    });
  }
  return days; // từ mốc `since` trở đi; đủ n ngày gần nhất
}

/** Một ngày của «Luồng 7 ngày» trên máy chủ (ON5): S03 từ khối `luong7` của bản tin (null = khối vắng/lỗi hoặc ngày
 * ngoài khối), listing tươi S01 từ bảng `listings` đã đồng bộ. Snapshot S01 (bảng thô) và S02 (luật 5) không có ở đây. */
export type CloudFlowDay = { day: string; airbnbListingsSeen: number; zaloPosts: number | null; zaloOffers: number | null };

/** «Luồng 7 ngày» trên máy chủ: 7 ngày VN tới `now`, mới → cũ như `getFlowDays`. Không đọc bảng nào chỉ có ở máy thu
 * (ADR-0014 §4) — `listings` là bảng đã đồng bộ. */
export async function getCloudFlowDays(
  luong7: { day: string; s03Posts: number; s03Offers: number }[] | null,
  opts: { now?: number; n?: number } = {},
): Promise<CloudFlowDay[]> {
  const now = opts.now ?? Date.now();
  const n = opts.n ?? 7;
  const oldest = vnDayKey(now - (n - 1) * 86400000);
  const { rows } = await pool.query<{ d: string; n: number }>(
    `SELECT last_seen::date::text d, count(*)::int n FROM listings WHERE last_seen >= $1::date GROUP BY 1`,
    [oldest],
  );
  const L = new Map(rows.map((r) => [r.d, r.n]));
  const B = new Map((luong7 ?? []).map((d) => [d.day, d]));
  const days: CloudFlowDay[] = [];
  for (let i = 0; i < n; i++) {
    const d = vnDayKey(now - i * 86400000);
    const b = B.get(d);
    days.push({ day: d, airbnbListingsSeen: L.get(d) ?? 0, zaloPosts: b?.s03Posts ?? null, zaloOffers: b?.s03Offers ?? null });
  }
  return days;
}

export type GateFunnel = {
  lastEventAt: string | null;
  today: { messages: number; passed: number; skipped: number; accepted: number; media: number };
  last7: { messages: number; passed: number; skipped: number; accepted: number; media: number };
};

const EMPTY = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 };

/** Funnel cổng Kev từ hook log (~/.openclaw/logs/oneinvest-zalo-pipe.log). */
export async function readGateFunnel(opts: { now?: number } = {}): Promise<GateFunnel> {
  {
    const f = await getLocalFacts();
    if (f) return f.funnel;
  }
  const file = path.join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log");
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch {
    return { lastEventAt: null, today: { ...EMPTY }, last7: { ...EMPTY } };
  }
  const lines = text.split("\n").filter(Boolean);
  // «Hôm nay» theo ngày VN (ON8) — hook ghi mốc ISO «Z» (collector/openclaw/handler.js).
  const now = opts.now ?? Date.now();
  const todayKey = vnDayKey(now);
  const cutoff = now - 7 * 86400000;
  const today = { ...EMPTY };
  const last7 = { ...EMPTY };
  let lastEventAt: string | null = null;
  for (const line of lines) {
    if (/ (heartbeat|alert) /.test(line)) continue; // gióng máy, không phải tin
    const ts = line.slice(0, 24);
    const iso = /^\d{4}-\d{2}-\d{2}T/.test(ts) ? ts : null;
    const in7 = iso ? new Date(iso).getTime() >= cutoff : true; // dòng không timestamp: đếm vào 7 ngày
    const day = iso && Number.isFinite(Date.parse(iso)) ? vnDayKey(Date.parse(iso)) : null;
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
  alive: "yes" | "no" | "unknown" | "unchecked"; // probe HTTP localhost; "unchecked" = máy chủ không có số cho cổng (ON23)
  lastLogAt: string | null;
  lastLine: string | null;
  /** Máy chủ: trạng thái là lần đo cuối của khối cũ quá 45′ (ON23) — không tô xanh. */
  stale?: boolean;
};


async function tailFile(file: string): Promise<{ mtime: string | null; lastLine: string | null }> {
  try {
    const st = await stat(file);
    // Dòng có nghĩa cuối — bỏ cảnh báo Node in sau dòng kết quả (OPS-19).
    const line = lastMeaningfulLine(await readFile(file, "utf8"));
    return { mtime: st.mtime.toISOString(), lastLine: line?.slice(0, 140) ?? null };
  } catch {
    return { mtime: null, lastLine: null };
  }
}

async function latestWeeklyLog(): Promise<string | null> {
  try {
    const dir = logsDir();
    const files = (await readdir(dir)).filter((f) => /^weekly-.*\.log$/.test(f)).sort();
    return files.length ? path.join(dir, files.at(-1)!) : null;
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

/** Local: vai trò (cho nhãn) + tên thật (chỉ để che dòng log, không rời hàm) từ source_registry; DB lỗi → rỗng. */
async function registryForJobs(): Promise<{ roles: SourceRoles; names: SourceNameEntry[] }> {
  try {
    const { rows } = await pool.query<{ code: string; label_vi: string | null; real_name: string | null }>(
      "SELECT code, label_vi, real_name FROM source_registry",
    );
    return {
      roles: Object.fromEntries(rows.filter((r) => r.label_vi).map((r) => [r.code, r.label_vi as string])),
      names: rows.filter((r) => r.real_name).map((r) => ({ code: r.code, realName: r.real_name as string })),
    };
  } catch {
    return { roles: {}, names: [] };
  }
}

/** Trạng thái 5 launchd agent + 2 dịch vụ KeepAlive. */
export async function readSchedulerStatus(): Promise<JobStatus[]> {
  {
    const f = await getLocalFacts();
    if (f) return f.jobs;
  }
  // ON7: nhãn «S0x · vai trò», dòng log cuối che tên thật; danh sách tên rỗng (DB lỗi) → lastLine null (đóng chặt).
  const { roles, names } = await registryForJobs();
  const weekly = await latestWeeklyLog();
  const logs = logsDir(); // ON16: log ở checkout chính khi app chạy từ worktree, tính khi gọi
  const [kevAlive, apiAlive, airdnaLog, smokeLog, apiLog, weeklyTail] = await Promise.all([
    probe("http://127.0.0.1:8009/"),
    probe("http://127.0.0.1:9210/"),
    tailFile(path.join(logs, "airdna-daily.log")),
    tailFile(path.join(logs, "launchd-smoke.log")),
    tailFile(path.join(logs, "launchd-collector-api.log")),
    weekly ? tailFile(weekly) : Promise.resolve({ mtime: null, lastLine: null }),
  ]);
  const jobs: JobStatus[] = [
    {
      id: "s02-daily",
      label: `${sourceLabel("S02", roles)} — toàn quốc (vòng 6 thị trường)`,
      schedule: "19:05 hằng ngày",
      alive: "unknown",
      lastLogAt: airdnaLog.mtime,
      lastLine: airdnaLog.lastLine,
    },
    {
      id: "s01-weekly",
      label: `${sourceLabel("S01", roles)} — Hà Nội (dò + listing + chốt số)`,
      schedule: "Chủ nhật 19:30, lệch ngẫu nhiên ≤30′",
      alive: "unknown",
      lastLogAt: weeklyTail.mtime,
      lastLine: weeklyTail.lastLine,
    },
    {
      id: "s01-smoke",
      label: `Thử nhanh ${sourceLabel("S01", roles)} (phát hiện đổi khuôn trang)`,
      schedule: "20:00 hằng ngày",
      alive: "unknown",
      lastLogAt: smokeLog.mtime,
      lastLine: smokeLog.lastLine,
    },
    {
      id: "collector-api",
      label: "Cổng nhận tin :9210",
      schedule: "Chạy liên tục",
      alive: apiAlive,
      lastLogAt: apiLog.mtime,
      lastLine: apiLog.lastLine,
    },
    {
      id: "kev",
      label: "Cổng Kev :8009",
      schedule: "Chạy liên tục",
      alive: kevAlive,
      lastLogAt: null,
      lastLine: null,
    },
  ];
  return jobs.map((j) => ({ ...j, lastLine: maskSourceNames(j.lastLine, names) }));
}

export type RotationPreview = {
  updatedAt: string | null;
  cursor: number;
  total: number;
  next: { id: string; name: string; lastCapturedAt: string | null }[];
};

/** Xem trước rotation kế tiếp: lặp logic airdna-rotate.mjs (skip fresh <24h). */
export async function readRotationPreview(): Promise<RotationPreview> {
  {
    const f = await getLocalFacts();
    if (f) return { updatedAt: f.rotation.updatedAt ?? f.pushedAt, cursor: f.rotation.cursor, total: f.rotation.total, next: f.rotation.next };
  }
  let cursor = 0;
  let updatedAt: string | null = null;
  try {
    const st = JSON.parse(
      await readFile(path.join(treeRoot(), "collector/state/airdna-rotation.json"), "utf8"),
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

// ---------- Zalo: tầng Nhóm + tách thật/mock (V1 nhóm-metrics) ----------

export type ZaloGroupRow = {
  name: string;
  isMockOnly: boolean; // nhóm chỉ xuất hiện trong snapshot zalo-mock
  realPosts7d: number;
  mockPosts7d: number;
  lastSeenAt: string | null;
  // funnel từ hook log (chỉ nhóm thật); null = nhật ký cổng không đọc được (ON4)
  seen: number | null;
  passed: number | null;
  skipped: number | null;
  /** «Vào bảng thô»: null = nhóm đã qua cổng mà nhật ký không mang số tin vào, hoặc nhật ký không đọc được (ON4) — không 0. */
  accepted: number | null;
  lastEventAt: string | null;
  ownerAccount: string | null; // account đang sở hữu nhóm (config/directory)
};

export type ZaloAllowlistEntry = { groupId: string; enabled: boolean };

/** Allowlist đọc runtime từ ~/.openclaw/openclaw.json — KHÔNG commit id vào
 * repo/migration (SPL ADR-0007: định danh nguồn thật ở tầng A, máy local). Nhóm bật = hợp nhóm bật hiệu dụng của mọi
 * tài khoản (ON4, `effectiveEnabledGroups`) — không đọc khoá `groups` cấp ngoài cũ. */
export async function readZaloAllowlist(): Promise<ZaloAllowlistEntry[] | null> {
  // ON4: cấu hình không đọc được (vắng, hỏng, thiếu channels.zalouser) → null — trang ghi «—», không «0 nhóm».
  try {
    const cfg = JSON.parse(
      await readFile(path.join(homedir(), ".openclaw/openclaw.json"), "utf8"),
    );
    const z = cfg?.channels?.zalouser;
    if (!z) return null;
    return effectiveEnabledGroups(z).union.map((groupId) => ({ groupId, enabled: true }));
  } catch {
    return null;
  }
}

/** Funnel cổng Kev theo nhóm từ hook log (dòng có tag group=). */
export function gateByGroup(text: string): Map<string, ZaloGroupRow> {
  const m = new Map<string, ZaloGroupRow>();
  const acceptedSeen = new Set<string>();
  for (const line of text.split("\n")) {
    // Cùng khuôn với parseLog của bên ghi: tên nhóm dừng ở p= hoặc account= (dòng skip thật không có p=).
    const g = line.match(/group=(.+?)(?:\s+p=|\s+account=|$)/)?.[1];
    if (!g) continue;
    const row =
      m.get(g) ??
      ({
        name: g,
        isMockOnly: false,
        realPosts7d: 0,
        mockPosts7d: 0,
        lastSeenAt: null,
        seen: 0,
        passed: 0,
        skipped: 0,
        accepted: 0,
        lastEventAt: null,
        ownerAccount: null,
      } satisfies ZaloGroupRow);
    // dòng log mới có tag account= (handler ≥2026-10-20 chiều) — attribution chính xác
    const acc = line.match(/\baccount=([a-z0-9-]+)/)?.[1];
    if (acc && acc !== "?") row.ownerAccount = acc;
    row.seen = (row.seen ?? 0) + 1;
    if (line.includes(" post 202")) {
      row.passed = (row.passed ?? 0) + 1;
      const n = line.match(/"accepted":(\d+)/)?.[1];
      if (n != null) {
        row.accepted = (row.accepted ?? 0) + Number(n);
        acceptedSeen.add(g);
      }
    } else if (/ skip /.test(line)) row.skipped = (row.skipped ?? 0) + 1;
    const ts = line.slice(0, 24);
    if (/^\d{4}-\d{2}-\d{2}T/.test(ts)) row.lastEventAt = ts;
    m.set(g, row);
  }
  for (const [g, row] of m) if ((row.passed ?? 0) > 0 && !acceptedSeen.has(g)) row.accepted = null;
  return m;
}

/** Bảng nhóm Zalo: nhóm thật (stg posts snapshot zalo-agent + hook log) và
 * nhóm mock tách riêng để không tô hồng số thật. */
export async function getZaloGroups(): Promise<ZaloGroupRow[]> {
  {
    const f = await getLocalFacts();
    if (f) return f.zaloGroups;
  }
  const [postRows, logText] = await Promise.all([
    pool.query(
      `SELECT group_name,
              count(*) FILTER (WHERE snapshot_id LIKE '%zalo-agent%'
                 AND captured_at >= now() - interval '7 days')::int AS real7,
              count(*) FILTER (WHERE snapshot_id NOT LIKE '%zalo-agent%'
                 AND captured_at >= now() - interval '7 days')::int AS mock7,
              max(captured_at) FILTER (WHERE snapshot_id LIKE '%zalo-agent%') AS last_real,
              bool_and(snapshot_id NOT LIKE '%zalo-agent%') AS mock_only
         FROM stg_zalo_posts
        WHERE group_name IS NOT NULL
        GROUP BY group_name`,
    ),
    // ON4: nhật ký cổng không đọc được → null (cột đọc từ nhật ký ghi «—»), khác nhật ký rỗng thật.
    readFile(path.join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log"), "utf8").catch(
      () => null,
    ),
  ]);
  const byLog = gateByGroup(logText ?? "");
  // Nhật ký đọc được mà nhóm không có dòng nào → 0 thật; không đọc được → null (không biết).
  const fromLog = logText === null ? null : 0;
  const rows = new Map<string, ZaloGroupRow>();
  for (const r of postRows.rows) {
    rows.set(r.group_name, {
      name: r.group_name,
      isMockOnly: r.mock_only,
      realPosts7d: r.real7,
      mockPosts7d: r.mock7,
      lastSeenAt: r.last_real ? new Date(r.last_real).toISOString() : null,
      seen: fromLog,
      passed: fromLog,
      skipped: fromLog,
      accepted: fromLog,
      lastEventAt: null,
      ownerAccount: null,
    });
  }
  // Attribution từ config: tên nhóm → account. Perf-audit: KHÔNG bao giờ chờ
  // CLI ~8s trong render — chỉ dùng cache tươi; cache lạnh thì kick refresh
  // ngầm song song (song song mọi account) → render sau có owner.
  try {
    const accounts = await listZaloAccounts();
    const dirs = new Map<string, string>(); // groupName → accountId
    const staleAccounts: string[] = [];
    for (const a of accounts) {
      if (directoryCacheIsFresh(a.accountId)) {
        for (const g of readCachedDirectory(a.accountId)) dirs.set(g.name, a.accountId);
      } else {
        staleAccounts.push(a.accountId);
      }
    }
    for (const id of staleAccounts) refreshZaloGroupDirectoryInBackground(id);
    for (const row of rows.values()) {
      if (!row.ownerAccount) row.ownerAccount = dirs.get(row.name) ?? null;
    }
  } catch {
    /* directory chưa sẵn sàng — để owner null, lần load sau có */
  }
  for (const [name, funnel] of byLog) {
    const row = rows.get(name) ?? {
      name,
      isMockOnly: false,
      realPosts7d: 0,
      mockPosts7d: 0,
      lastSeenAt: null,
      seen: 0,
      passed: 0,
      skipped: 0,
      accepted: 0,
      lastEventAt: null,
      ownerAccount: null,
    };
    Object.assign(row, {
      seen: funnel.seen,
      passed: funnel.passed,
      skipped: funnel.skipped,
      accepted: funnel.accepted,
      lastEventAt: funnel.lastEventAt,
      lastSeenAt: row.lastSeenAt ?? funnel.lastEventAt,
    });
    rows.set(name, row);
  }
  return [...rows.values()].sort((a, b) => {
    if (a.isMockOnly !== b.isMockOnly) return a.isMockOnly ? 1 : -1; // thật trước
    return (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "");
  });
}

export type ZaloHealth = {
  connected: boolean | null; // null = chưa có heartbeat nào
  uptime24h: number | null; // 0-1, chia theo dòng heartbeat 24h qua
  heartbeatAgeMin: number | null; // dòng heartbeat cuối cách bao lâu (probe chết?)
  lastHeartbeatAt: string | null;
  lastPostAt: string | null; // dòng " post 202" cuối
  silentAlert24h: boolean;
  driftAlert24h: boolean; // allowlist lệch membership / vi phạm 1-1
};

/** Tầng Ống V2: sức khoẻ ống Zalo từ dòng heartbeat trong log hook. */
export async function readZaloHealth(): Promise<ZaloHealth> {
  {
    const f = await getLocalFacts();
    if (f) return f.health;
  }
  let text = "";
  try {
    text = await readFile(path.join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log"), "utf8");
  } catch {
    return {
      connected: null, uptime24h: null, heartbeatAgeMin: null,
      lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false,
      driftAlert24h: false,
    };
  }
  const now = Date.now();
  let up = 0, total = 0, lastHb: string | null = null, lastPost: string | null = null,
      silentAlert = false, driftAlert = false;
  // Alert là tín hiệu MỘT THỜI ĐIỂM — phải tự hạ khi có bằng chứng hồi phục:
  //   silent-gate: có post 202 SAU alert cuối → cổng đã chảy lại
  //   drift: drift-check chạy cùng nhịp heartbeat (1h) và chỉ log khi còn lệch
  //          → heartbeat SAU alert cuối mà không alert lại = đã hết lệch
  // (bug bắt 22/10 tối: ống chảy 118 tin/ngày nhưng 2 badge đỏ treo từ alert cũ)
  let silentAlertTs: number | null = null;
  let driftAlertTs: number | null = null;
  let lastPostTs: number | null = null;
  let lastHbTs: number | null = null;
  for (const line of text.split("\n")) {
    const ts = line.slice(0, 24);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(ts)) continue;
    const t = new Date(ts).getTime();
    if (line.includes(" heartbeat ")) {
      lastHb = ts;
      lastHbTs = t;
      if (now - t <= 86400000) {
        total++;
        if (line.includes(" up ")) up++;
      }
    } else if (line.includes(" post 202")) {
      lastPost = ts;
      lastPostTs = Math.max(lastPostTs ?? 0, t);
    } else if (line.includes(" alert silent-gate") && now - t <= 86400000) {
      silentAlertTs = Math.max(silentAlertTs ?? 0, t);
    } else if (line.includes(" alert drift") && now - t <= 86400000) {
      driftAlertTs = Math.max(driftAlertTs ?? 0, t);
    }
  }
  silentAlert =
    silentAlertTs != null && (lastPostTs == null || lastPostTs < silentAlertTs);
  driftAlert =
    driftAlertTs != null && (lastHbTs == null || lastHbTs <= driftAlertTs);
  const age = lastHb ? Math.round((now - new Date(lastHb).getTime()) / 60000) : null;
  return {
    connected: lastHb ? lastLinesUp(text) : null,
    uptime24h: total > 0 ? up / total : null,
    heartbeatAgeMin: age,
    lastHeartbeatAt: lastHb,
    lastPostAt: lastPost,
    silentAlert24h: silentAlert,
    driftAlert24h: driftAlert,
  };
}

// connected = trạng thái của dòng heartbeat CUỐI (không phải any-line)
function lastLinesUp(text: string): boolean {
  const hb = text.split("\n").filter((l) => l.includes(" heartbeat "));
  const last = hb.at(-1) ?? "";
  return last.includes(" up ");
}
