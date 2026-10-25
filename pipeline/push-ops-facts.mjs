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
import { guardValues } from "./lib/tier-a-guard.mjs";

import { tailLog } from "./lib/last-log-line.mjs";
import { luong7, parseLog, zaloFlow } from "./lib/ops-flow.mjs";
import { readFreshness } from "../scripts/lib/freshness.mjs";
import { readLaunchdJobs, readLockdown, readRecords24h, readReviewQueue, readS03Allowlist } from "../scripts/lib/ops-local.mjs";

const ROOT = process.env.ONEINVEST_ROOT ?? "/Users/manhphan/dev/one-invest";
const INGEST_URL = process.env.INGEST_URL ?? "https://onehub-invest.vercel.app/api/v1/ops/ingest";
const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function env() {
  const s = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
  return { token: s.match(/CLOUD_OPS_API_TOKEN=(\S+)/)?.[1] };
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
  const [postRows] = await Promise.all([
    client.query(
      "SELECT group_name, count(*) FILTER (WHERE snapshot_id LIKE '%zalo-agent%' AND captured_at >= now() - interval '7 days')::int real7, max(captured_at) FILTER (WHERE snapshot_id LIKE '%zalo-agent%') last_real, bool_and(snapshot_id NOT LIKE '%zalo-agent%') mock_only FROM stg_zalo_posts WHERE group_name IS NOT NULL GROUP BY 1",
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
  // ON8: số Zalo theo ngày VN — cùng khoá ngày với các cột khác của «Luồng 7 ngày» trên cloud.
  const flow = await zaloFlow(client);
  return { groups: [...byName.values()], flow };
}

async function sourceRunsQ(client) {
  // H3: feed health per nguồn cho cloud /ops (mọi lần chạy ghi snapshot). ON22: bảng snapshot đọc không được thì vẫn
  // trả vai trò từng mã, số lần chạy để null (chưa đo) — không 0, không làm sập cả bản tin (khối records24h báo lỗi).
  try {
    return await sourceRunsFull(client);
  } catch {
    const { rows } = await client.query(
      `SELECT code, label_vi, status, NULL::timestamptz AS last_run, NULL::bigint AS items_24h, NULL::bigint AS offers
       FROM source_registry ORDER BY code`,
    );
    return rows;
  }
}

async function sourceRunsFull(client) {
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

/** ON22 (ADR-0014): một khối số = `{measured_at, ...dữ liệu}`; đo không được → `{measured_at, error}` — không bao giờ
 * thay bằng 0, mảng rỗng hay «Ổn». Thông điệp lỗi đi qua bộ che tên (rỗng/không che được → câu chung). */
async function measure(fn) {
  try {
    const data = await fn();
    return { measured_at: new Date().toISOString(), ...data };
  } catch (e) {
    const msg = maskSourceNames(String(e?.message ?? e).split("\n")[0].slice(0, 200), REG.names);
    return { measured_at: new Date().toISOString(), error: msg ? `không đo được: ${msg}` : "không đo được" };
  }
}

/** Dòng chặn của bộ soát tầng A cho bản tin (rỗng = được gửi). Tên nhóm S03 là tầng C (miễn); tên tài khoản thu tầng A. */
export function factsChan(payload, names) {
  if (!names?.length) return ["FACTS CHẶN [tầng A] không có danh sách tên để soát (source_registry) — không gửi"];
  const out = guardValues(payload, names, { exempt: [/^zaloGroups\[\d+\]\.name$/, /^blocks\.s03\.groups\[\d+\]\.name$/] }).map((h) => `FACTS CHẶN [tầng A] ${h.path} ${h.code}`);
  (payload.zaloAccounts ?? []).forEach((a, i) => {
    if (a?.name != null) out.push(`FACTS CHẶN [tầng A] zaloAccounts[${i}].name tên tài khoản thu`);
  });
  return out;
}

async function main() {
  // --kho: chế độ khô — dựng bản tin, soát tầng A, in đường JSON + mã; không cần token, không gửi.
  const kho = process.argv.includes("--kho");
  const { token } = kho ? {} : await env();
  if (!kho && !token) throw new Error("thiếu CLOUD_OPS_API_TOKEN trong ~/.oneinvest/cloud.env");
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
  // ON22: năm khối số tổng hợp (ADR-0014). OPS_FACTS_NOW / OPENCLAW_LOG_DIR / ONEINVEST_CRON_DIR / LAUNCHCTL chỉ để
  // phép đo trỏ mốc giờ và thư mục tạm — plist launchd không đặt chúng.
  const now = process.env.OPS_FACTS_NOW ? new Date(process.env.OPS_FACTS_NOW) : new Date();
  const freshnessBlock = await measure(async () => ({ rows: await readFreshness(client, { now }) }));
  const records24hBlock = await measure(async () => ({ bySource: await readRecords24h(client) }));
  const reviewQueueBlock = await measure(() => readReviewQueue(client));
  // ON5: hai cột S03 của «Luồng 7 ngày» — đúng 7 ngày VN tính tới mốc đo, ngày rỗng = 0 (định nghĩa ở lib/ops-flow.mjs).
  const luong7Block = await measure(async () => ({ days: await luong7(client, { now: now.getTime() }) }));
  await client.end();
  const [lockdownBlock, jobsBlock] = await Promise.all([
    measure(() => readLockdown({ root: ROOT, agentLogDir: process.env.OPENCLAW_LOG_DIR ?? "/tmp/openclaw", now })),
    measure(async () => ({
      items: await readLaunchdJobs({
        cronDir: process.env.ONEINVEST_CRON_DIR ?? path.join(ROOT, "pipeline/cron"),
        root: ROOT,
        names: REG.names,
        launchctl: process.env.LAUNCHCTL ?? "launchctl",
      }),
    })),
  ]);

  // Đọc danh sách tài khoản zalo từ config local (read-only cho cloud). ON4 (Hỏi-2 = A): nhóm bật từng tài khoản theo
  // cùng một định nghĩa với trang Thu thập và khối s03 (`readS03Allowlist`) — kế thừa cấp ngoài, bỏ allow:false.
  let zaloAccounts = [];
  let zaloCfg = null;
  try {
    zaloCfg = JSON.parse(await readFile(path.join(homedir(), ".openclaw/openclaw.json"), "utf8"));
    const z = zaloCfg?.channels?.zalouser ?? {};
    const { byAccount } = readS03Allowlist(z);
    zaloAccounts = [...byAccount].map(([id, enabledGroups]) => {
      const acc = id === "default" ? undefined : z.accounts?.[id];
      // NT2 Hỏi-1 = A: tên tài khoản thu là tầng A — không rời máy; cloud hiện mã tài khoản.
      return { accountId: id, name: null, profile: acc?.profile ?? id, enabledGroups };
    });
  } catch { /* config không đọc được */ }

  // ON4 (ADR-0014, Hỏi-1 = A): khối s03 — N nhóm bật theo `readS03Allowlist` và số đếm từng nhóm; CHỈ tên nhóm (tầng C),
  // không mã nhóm, không tài khoản. Handler thiếu tên kênh thì ghi mã nhóm vào group= → tên ấy thành null.
  const s03Block = await measure(async () => {
    const z = zaloCfg?.channels?.zalouser;
    if (!z) throw new Error("cấu hình OpenClaw không đọc được hoặc thiếu channels.zalouser");
    const { union } = readS03Allowlist(z);
    const ids = new Set(union.map((k) => k.replace(/^group:/, "")));
    const isId = (name) => /^\d{15,}$/.test(name) || ids.has(name) || name.startsWith("group:");
    return {
      allowlistEnabled: union.length,
      groups: zalo.groups.map((g) => ({
        name: g.name && !isId(g.name) ? g.name : null,
        seen: g.seen, passed: g.passed, skipped: g.skipped, accepted: g.accepted,
        realPosts7d: g.realPosts7d, mockPosts7d: g.mockPosts7d, isMockOnly: g.isMockOnly,
        lastSeenAt: g.lastSeenAt, lastEventAt: g.lastEventAt,
      })),
    };
  });

  const payload = {
    pushedAt: new Date().toISOString(),
    funnel, health, jobs, sourceRuns,
    rotation: { ...rot, updatedAt: rot.updatedAt ?? null },
    zaloGroups: zalo.groups,
    zaloFlow: zalo.flow,
    zaloAccounts,
    blocks: {
      freshness: freshnessBlock,
      jobs: jobsBlock,
      lockdown: lockdownBlock,
      records24h: records24hBlock,
      reviewQueue: reviewQueueBlock,
      luong7: luong7Block,
      s03: s03Block,
    },
  };
  // NT2: bộ soát tầng A chung (pipeline/lib/tier-a-guard.mjs) — còn tên nguồn thật thì dừng trước khi gửi.
  const chan = factsChan(payload, REG.names);
  if (kho) {
    for (const l of chan) console.error(l);
    console.log(`khối: ${Object.entries(payload.blocks).map(([k, b]) => `${k} ${b.error ? "không đo được" : "đo được"}`).join(" · ")}`);
    console.log(chan.length ? `ops-facts khô: ${chan.length} chỗ chặn` : "ops-facts khô: sạch, 0 chỗ chặn");
    process.exitCode = chan.length ? 1 : 0;
    return;
  }
  if (chan.length) {
    for (const l of chan) console.error(l);
    process.exitCode = 1;
    return;
  }
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
