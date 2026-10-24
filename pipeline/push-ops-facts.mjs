// push-ops-facts.mjs — C4 P2: máy thu đẩy "local facts" lên cloud để Ops
// Portal trên Vercel đầy đủ 3 tầng (Ống Zalo, Máy móc, funnel, rotation,
// nhóm Zalo — những thứ đọc file/CLI chỉ có ở máy này).
// Đi qua HTTPS (POST /api/v1/ops/ingest trên Vercel, Bearer cloud token).
// Gọi từ cloud-sync.sh sau mỗi lần sync dữ liệu (15'/lần).
import { readFile, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import pg from "pg";

import { maskSourceNames } from "./lib/mask-source-names.mjs";

import { tailLog } from "./lib/last-log-line.mjs";

const ROOT = process.env.ONEINVEST_ROOT ?? "/Users/manhphan/dev/one-invest";
const INGEST_URL = process.env.INGEST_URL ?? "https://onehub-invest.vercel.app/api/v1/ops/ingest";
const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function env() {
  const s = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
  return { token: s.match(/CLOUD_OPS_API_TOKEN=(\S+)/)?.[1] };
}

const EMPTY = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 };

// ---- 1. Funnel cổng + health từ hook log ----
function parseLog(text) {
  const lines = text.split("\n").filter(Boolean);
  const todayKey = new Date().toISOString().slice(0, 10);
  const cutoff = Date.now() - 7 * 86400000;
  const funnel = { today: { ...EMPTY }, last7: { ...EMPTY }, lastEventAt: null };
  const health = {
    connected: null, uptime24h: null, heartbeatAgeMin: null,
    lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false,
  };
  const groups = new Map();
  let up = 0, total = 0;
  for (const line of lines) {
    const ts = line.slice(0, 24);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(ts)) continue;
    const t = new Date(ts).getTime();
    if (line.includes(" heartbeat ")) {
      health.lastHeartbeatAt = ts;
      if (Date.now() - t <= 86400000) {
        total++;
        if (line.includes(" up ")) up++;
      }
    } else if (line.includes(" post 202")) {
      health.lastPostAt = ts;
    } else if (line.includes(" alert silent-gate") && Date.now() - t <= 86400000) health.silentAlert24h = true;
    else if (line.includes(" alert drift") && Date.now() - t <= 86400000) health.driftAlert24h = true;
    if (/ (heartbeat|alert) /.test(line)) continue;
    funnel.lastEventAt = ts;
    for (const b of [t >= cutoff ? funnel.last7 : null, ts.slice(0, 10) === todayKey ? funnel.today : null]) {
      if (!b) continue;
      b.messages++;
      if (line.includes(" post 202")) {
        b.passed++;
        b.accepted += Number(line.match(/"accepted":(\d+)/)?.[1] ?? 0);
      } else if (/ skip /.test(line)) b.skipped++;
      if (/media/i.test(line)) b.media++;
    }
    const g = line.match(/group=(.+?)(?:\s+p=|\s+account=|$)/)?.[1];
    const acc = line.match(/account=([a-z0-9-]+)/)?.[1];
    if (g) {
      const r = groups.get(g) ?? { name: g, seen: 0, passed: 0, skipped: 0, accepted: 0, ownerAccount: acc ?? null, lastEventAt: ts };
      r.seen++;
      if (line.includes(" post 202")) { r.passed++; r.ownerAccount = r.ownerAccount ?? acc ?? null; }
      else if (/ skip /.test(line)) r.skipped++;
      r.lastEventAt = ts;
      groups.set(g, r);
    }
  }
  health.uptime24h = total > 0 ? up / total : null;
  health.connected = health.lastHeartbeatAt
    ? lines.filter((l) => l.includes(" heartbeat ")).at(-1)?.includes(" up ") ?? false
    : null;
  health.heartbeatAgeMin = health.lastHeartbeatAt
    ? Math.round((Date.now() - new Date(health.lastHeartbeatAt).getTime()) / 60000)
    : null;
  return { funnel, health, groups: [...groups.values()] };
}

// ---- 2. Máy móc: launchd logs + probe ----
async function probe(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 800);
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    return r.status > 0 ? "yes" : "no";
  } catch {
    return "no";
  }
}
// ON7: nhãn nguồn «S0x · vai trò» (CONTEXT.md «Nhãn nguồn») — tên thật không lên cloud. main() nạp REG từ
// source_registry local trước khi gọi scheduler(); names chỉ dùng để che dòng log, không rời máy.
const REG = { roles: {}, names: [] };
const lab = (code) => (REG.roles[code] ? `${code} · ${REG.roles[code]}` : code);

async function scheduler() {
  const LOGS = path.join(ROOT, "pipeline/logs");
  let weekly = null;
  try {
    const files = (await readdir(LOGS)).filter((f) => /^weekly-.*\.log$/.test(f)).sort();
    weekly = files.length ? path.join(LOGS, files.at(-1)) : null;
  } catch {}
  const [kevAlive, apiAlive, airdnaLog, smokeLog, apiLog, weeklyTail] = await Promise.all([
    probe("http://127.0.0.1:8009/"),
    probe("http://127.0.0.1:9210/"),
    tailLog(path.join(LOGS, "airdna-daily.log")),
    tailLog(path.join(LOGS, "launchd-smoke.log")),
    tailLog(path.join(LOGS, "launchd-collector-api.log")),
    weekly ? tailLog(weekly) : Promise.resolve({ lastLogAt: null, lastLine: null }),
  ]);
  const jobs = [
    { id: "s02-daily", label: `${lab("S02")} — toàn quốc (rotation 6 market)`, schedule: "19:05 hằng ngày", alive: "unknown", ...airdnaLog },
    { id: "s01-weekly", label: `${lab("S01")} — Hà Nội`, schedule: "Chủ nhật 19:30 +jitter", alive: "unknown", ...weeklyTail },
    { id: "s01-smoke", label: `Smoke ${lab("S01")}`, schedule: "20:00 hằng ngày", alive: "unknown", ...smokeLog },
    { id: "collector-api", label: "Agent ingest :9210", schedule: "KeepAlive", alive: apiAlive, ...apiLog },
    { id: "kev", label: "Kev gate :8009", schedule: "KeepAlive", alive: kevAlive, lastLogAt: null, lastLine: null },
    { id: "cloud-sync", label: "Sync Supabase + ops facts", schedule: "mỗi 15 phút", alive: "unknown", ...(await tailLog(path.join(LOGS, "cloud-sync.log"))) },
  ];
  // dòng log cuối là dữ liệu chạy — che tên thật; danh sách tên rỗng → null (đóng chặt)
  return jobs.map((j) => ({ ...j, lastLine: maskSourceNames(j.lastLine, REG.names) }));
}

// ---- 3. Rotation preview ----
async function rotation(client) {
  let cursor = 0;
  try {
    const st = JSON.parse(await readFile(path.join(ROOT, "collector/state/airdna-rotation.json"), "utf8"));
    cursor = st.cursor ?? 0;
  } catch {}
  const { rows } = await client.query(
    "SELECT airdna_id, name, captured_at FROM airdna_markets WHERE country_code='vn' ORDER BY airdna_id::int",
  );
  const cutoff = Date.now() - 86400000;
  const next = [];
  let i = cursor;
  for (let step = 0; step < rows.length && next.length < 6; step++) {
    const r = rows[i % rows.length];
    const fresh = r.captured_at !== null && new Date(r.captured_at).getTime() > cutoff;
    if (!fresh) next.push({ id: String(r.airdna_id), name: r.name, lastCapturedAt: r.captured_at ?? null });
    i++;
  }
  return { cursor, total: rows.length, next };
}

// ---- 4. Nhóm Zalo (stg thật/mock + funnel + owner) + flow ngày ----
async function zaloExtras(client, funnelGroups) {
  const [postRows, offerRows] = await Promise.all([
    client.query(
      "SELECT group_name, count(*) FILTER (WHERE snapshot_id LIKE '%zalo-agent%' AND captured_at >= now() - interval '7 days')::int real7, max(captured_at) FILTER (WHERE snapshot_id LIKE '%zalo-agent%') last_real, bool_and(snapshot_id NOT LIKE '%zalo-agent%') mock_only FROM stg_zalo_posts WHERE group_name IS NOT NULL GROUP BY 1",
    ),
    client.query(
      "SELECT first_seen::date::text d, count(*)::int offers FROM sale_offers WHERE first_seen >= now() - interval '7 days' GROUP BY 1",
    ),
    client.query(
      "SELECT captured_at::date::text d, count(*) FILTER (WHERE snapshot_id LIKE '%zalo-agent%')::int real_posts FROM stg_zalo_posts WHERE captured_at >= now() - interval '7 days' GROUP BY 1",
    ),
  ]);
  // gộp: nhóm từ DB + nhóm chỉ có trong funnel log
  const byName = new Map();
  for (const r of postRows.rows) {
    byName.set(r.group_name, {
      name: r.group_name, isMockOnly: r.mock_only, realPosts7d: r.real7, mockPosts7d: 0,
      lastSeenAt: r.last_real ? new Date(r.last_real).toISOString() : null,
      seen: 0, passed: 0, skipped: 0, accepted: 0, lastEventAt: null, ownerAccount: null,
    });
  }
  for (const g of funnelGroups) {
    const row = byName.get(g.name) ?? { name: g.name, isMockOnly: false, realPosts7d: 0, mockPosts7d: 0, lastSeenAt: null, seen: 0, passed: 0, skipped: 0, accepted: 0, lastEventAt: null, ownerAccount: null };
    Object.assign(row, { seen: g.seen, passed: g.passed, skipped: g.skipped, accepted: g.accepted, lastEventAt: g.lastEventAt, ownerAccount: g.ownerAccount ?? row.ownerAccount, lastSeenAt: row.lastSeenAt ?? g.lastEventAt });
    byName.set(g.name, row);
  }
  const flow = {};
  for (const r of offerRows.rows) flow[r.d] = { offers: r.offers };
  for (const r of (await client.query("SELECT captured_at::date::text d, count(*)::int posts FROM stg_zalo_posts WHERE captured_at >= now() - interval '7 days' AND snapshot_id LIKE '%zalo-agent%' GROUP BY 1")).rows) {
    flow[r.d] = { ...(flow[r.d] ?? {}), posts: r.posts };
  }
  return { groups: [...byName.values()], flow };
}

async function sourceRunsQ(client) {
  // H3: feed health per nguồn cho cloud /ops (mọi lần chạy ghi snapshot)
  const { rows } = await client.query(`
    SELECT r.code, r.label_vi, r.status, s.last_run, s.items_24h,
           COALESCE(o.offers, 0) AS offers
    FROM source_registry r
    LEFT JOIN (
      SELECT source, max(collected_at) AS last_run,
             count(*) FILTER (WHERE collected_at >= now() - interval '24 hours') AS items_24h
      FROM airbnb_snapshots GROUP BY source
    ) s ON s.source = ANY (r.source_ids)
    LEFT JOIN (SELECT source, count(*) offers FROM sale_offers GROUP BY source) o ON o.source = r.code
    ORDER BY r.code`);
  return rows;
}

async function main() {
  const { token } = await env();
  if (!token) throw new Error("thiếu CLOUD_OPS_API_TOKEN trong ~/.oneinvest/cloud.env");
  const logText = await readFile(path.join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log"), "utf8").catch(() => "");
  const { funnel, health, groups } = parseLog(logText);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? LOCAL_URL });
  await client.connect();
  const { rows: reg } = await client.query("SELECT code, label_vi, real_name FROM source_registry");
  REG.roles = Object.fromEntries(reg.filter((r) => r.label_vi).map((r) => [r.code, r.label_vi]));
  REG.names = reg.filter((r) => r.real_name).map((r) => ({ code: r.code, realName: r.real_name }));
  const [jobs, rot, zalo, sourceRuns] = await Promise.all([
    scheduler(), rotation(client), zaloExtras(client, groups), sourceRunsQ(client),
  ]);
  await client.end();

  // Đọc danh sách tài khoản zalo từ config local (read-only cho cloud)
  let zaloAccounts = [];
  try {
    const zcfg = JSON.parse(await readFile(path.join(homedir(), ".openclaw/openclaw.json"), "utf8"));
    const z = zcfg?.channels?.zalouser ?? {};
    const ids = new Set(["default"]);
    for (const id of Object.keys(z.accounts ?? {})) ids.add(id);
    zaloAccounts = [...ids].map((id) => {
      const acc = id === "default" ? undefined : z.accounts?.[id];
      // Sau multi-account fix, default groups nằm ở accounts.default.groups
      // (top-level z.groups là bản cũ 4 nhóm — thiếu Duy Ka Masteri)
      const groups = id === "default"
        ? (z.accounts?.default?.groups ?? z.groups ?? {})
        : (acc?.groups ?? {});
      const enabled = Object.entries(groups).filter(([, v]) => v?.enabled !== false && v?.allow !== false).length;
      return { accountId: id, name: acc?.name ?? null, profile: acc?.profile ?? id, enabledGroups: Array.from(Object.keys(groups).filter((k) => groups[k]?.enabled !== false)) };
    });
  } catch { /* config không đọc được */ }

  const payload = {
    pushedAt: new Date().toISOString(),
    funnel, health, jobs, sourceRuns,
    rotation: { ...rot, updatedAt: rot.updatedAt ?? null },
    zaloGroups: zalo.groups,
    zaloFlow: zalo.flow,
    zaloAccounts,
  };
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`ingest ${res.status}: ${(await res.text()).slice(0, 200)}`);
  console.log(`ops-facts pushed: ${zalo.groups.length} nhóm, ${jobs.length} jobs, uptime ${(health.uptime24h ?? 0) * 100 | 0}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
