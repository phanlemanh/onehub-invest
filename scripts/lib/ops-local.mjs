/**
 * ops-local.mjs — số tổng hợp Ops chỉ đo được ở máy local (ON22 `ops-facts-so-tong-hop`, ADR-0014). Bên ghi
 * `pipeline/push-ops-facts.mjs` dùng để đẩy năm khối lên cloud; trang local vẫn tính bằng hàm app.
 *
 * Hai hàm là BẢN .mjs của hàm app, giữ khớp bằng `app/tests/ops-facts-so-tong-hop.test.tsx` (cùng lược đồ, cùng cây
 * log, đòi từng hàng bằng nhau) — sửa một bên thì sửa cả bên kia, như cặp freshness.mjs ↔ freshness.ts (AU6):
 *   readRecords24h  ↔ getSourceFeedHealth().items24h   (app/src/lib/ops-queries.ts)
 *   readLockdown    ↔ getLockdownStatus()               (app/src/lib/ops-queries.ts, ON2)
 *   readS03Allowlist ↔ effectiveEnabledGroups()        (app/src/lib/zalo-admin.ts, ON4 — app/tests/nhom-s03-tren-cloud.test.tsx)
 *   readS03Groups ↔ effectiveEnabledGroups() (tập bật)   (PL12 — app/tests/so-nhom.test.tsx SN-AC-5b)
 * Mọi hàm nhận phụ thuộc qua tham số (client pg, thư mục, lệnh) và NÉM khi không đo được — bên gọi ghi `error`,
 * không bao giờ thay bằng 0 hay «Ổn». An toàn Zalo: chỉ đọc log và probe GET, không phương thức ghi nào.
 */
import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { maskSourceNames } from "../../pipeline/lib/mask-source-names.mjs";

/** Luồng thu (airbnb_snapshots.source) của từng mã — chép nguyên bảng SNAP_OF trong getSourceFeedHealth. */
const SNAP_OF = {
  S01: ["airbnb-discovery", "airbnb-listing"],
  S02: ["airdna-research"],
  S03: ["zalo-agent"],
  S05: ["zalo-agent"], // FB qua cùng collector (agent_id phân biệt trong stg)
  S06: ["chotot-ads"],
};

/** Bản ghi 24 giờ theo mã: mọi mã trong source_registry, theo thứ tự mã. Bảng vắng → ném. */
export async function readRecords24h(client) {
  const { rows: reg } = await client.query(`SELECT code FROM source_registry ORDER BY code`);
  const { rows: snaps } = await client.query(
    `SELECT source, max(collected_at) AS last, count(*) FILTER (
       WHERE collected_at >= now() - interval '24 hours') AS n24
     FROM airbnb_snapshots WHERE source IS NOT NULL GROUP BY source`,
  );
  const bySource = new Map(snaps.map((s) => [s.source, Number(s.n24)]));
  return reg.map(({ code }) => ({
    code,
    n: (SNAP_OF[code] ?? []).reduce((sum, s) => sum + (bySource.get(s) ?? 0), 0),
  }));
}

/** Thẻ chờ duyệt: chỉ số đếm `pending` theo `item_type` (nội dung thẻ là tầng A). Bảng vắng → ném. */
export async function readReviewQueue(client) {
  const { rows } = await client.query(
    `SELECT item_type AS type, count(*)::int AS n FROM review_queue WHERE status = 'pending'
     GROUP BY item_type ORDER BY item_type`,
  );
  return { byType: rows.map((r) => ({ type: r.type, n: r.n })), total: rows.reduce((s, r) => s + r.n, 0) };
}

/** Watchdog ghi `<ISO> ok — …` mỗi 5′; dòng `ok` cũ hơn 3 chu kỳ = watchdog dừng hoặc đang báo sự cố (ON2). */
const WATCHDOG_FRESH_MS = 15 * 60_000;

async function probeGet(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return r.status > 0 && r.status < 500;
  } catch {
    return false;
  }
}

async function pgrepOpenClaw() {
  try {
    await promisify(execFile)("pgrep", ["-f", "openclaw"]);
    return true;
  } catch {
    return false;
  }
}

/** Bảy lớp lockdown Zalo + hạ tầng thu. `ok: null` = không kiểm được (không bao giờ «Ổn» thay). */
export async function readLockdown({ root, agentLogDir = "/tmp/openclaw", now = new Date(), probe = probeGet, pgrep = pgrepOpenClaw } = {}) {
  let lastWd = null;
  let wdFresh = false;
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
  const p2 = (n) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  let turns = null;
  try {
    const text = await readFile(path.join(agentLogDir, `openclaw-${day}.log`), "utf8");
    turns = text.split("\n").filter((l) => l.includes("auto-reply/agent-turn-timing")).length;
  } catch {
    /* tệp vắng hoặc không đọc được */
  }
  const [openClawUp, kevUp, collectorUp] = await Promise.all([
    pgrep(),
    probe("http://127.0.0.1:8009/v1/models"),
    probe("http://127.0.0.1:9210/agent-report"),
  ]);
  const layers = [
    { layer: "L1", desc: "Chỉ đọc — không có API gửi tin", ok: wdFresh ? true : null },
    { layer: "L2", desc: "Không gắn máy trả lời vào kênh nào", ok: wdFresh ? true : null },
    { layer: "L3", desc: "Tắt kênh tài khoản chính thức, nhóm phải nhắc tên mới trả lời", ok: wdFresh ? true : null },
    { layer: "L4", desc: "Bộ canh 5′ đang chạy", ok: wdFresh },
    { layer: "L4b", desc: "Lượt máy tự trả lời hôm nay = 0", ok: turns === null ? null : turns === 0 },
    { layer: "Hạ tầng", desc: "OpenClaw đang chạy", ok: openClawUp },
    { layer: "Hạ tầng", desc: "Cổng Kev :8009", ok: kevUp },
    { layer: "Hạ tầng", desc: "Cổng nhận tin :9210", ok: collectorUp },
  ];
  return { layers, lastWatchdogAt: lastWd, agentTurnsToday: turns };
}

/** Nhãn + tệp log của mọi plist trong `cronDir` (`__ROOT__` thay bằng `root`, như scripts/install-*.sh). */
async function cronJobs(cronDir, root) {
  const out = [];
  for (const f of (await readdir(cronDir)).filter((n) => n.endsWith(".plist")).sort()) {
    const xml = await readFile(path.join(cronDir, f), "utf8");
    const label = xml.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
    const log = xml.match(/<key>StandardOutPath<\/key>\s*<string>([^<]+)<\/string>/)?.[1]?.replaceAll("__ROOT__", root);
    if (label) out.push({ label, log: log ?? null });
  }
  return out;
}

/**
 * Job launchd của kho (Hỏi-1 = A: mọi nhãn khai trong pipeline/cron có mặt trong `launchctl list`). `run(cmd, args)`
 * trả stdout; nhãn che tên nguồn thật bằng mã S0x (`names` = [{code, realName}]). launchctl không chạy được → ném.
 */
export async function readLaunchdJobs({ cronDir, root, names, launchctl = "launchctl", run = defaultRun } = {}) {
  const declared = await cronJobs(cronDir, root);
  const listing = await run(launchctl, ["list"]);
  const live = new Map();
  for (const line of listing.split("\n")) {
    const [pid, status, label] = line.split("\t");
    if (!label || pid === "PID") continue;
    live.set(label.trim(), { pid: pid === "-" ? null : Number(pid), lastExit: Number(status) });
  }
  const jobs = [];
  for (const { label, log } of declared) {
    const l = live.get(label);
    if (!l) continue;
    let lastLogAt = null;
    if (log) {
      try {
        lastLogAt = (await stat(log)).mtime.toISOString();
      } catch {
        /* tệp log vắng */
      }
    }
    jobs.push({ id: maskSourceNames(label, names), pid: l.pid, lastExit: Number.isFinite(l.lastExit) ? l.lastExit : null, running: l.pid !== null, lastLogAt });
  }
  return jobs;
}

async function defaultRun(cmd, args) {
  const { stdout } = await promisify(execFile)(cmd, args, { maxBuffer: 1 << 20 });
  return stdout;
}

/** «Nhóm bật» (ON4, Hỏi-2 = A) — bản .mjs của `effectiveEnabledGroups`: nhóm bật hiệu dụng từng tài khoản theo luật kế
 * thừa của OpenClaw (`default` đọc `accounts.default.groups`, thiếu thì `groups` cấp ngoài; tài khoản không khai `groups`
 * kế thừa cấp ngoài), bỏ `enabled: false` và `allow: false`; `union` = hợp, trùng mã đếm một lần. Nhận `channels.zalouser`. */
export function readS03Allowlist(z) {
  const ids = ["default", ...Object.keys(z?.accounts ?? {}).filter((id) => id !== "default")];
  const groupsOf = (id) => {
    if (!z) return {};
    if (id === "default") return z.accounts?.default?.groups ?? z.groups ?? {};
    return z.accounts?.[id]?.groups ?? z.groups ?? {};
  };
  const enabled = (groups) => Object.entries(groups).filter(([, v]) => v?.allow !== false && v?.enabled !== false).map(([k]) => k);
  const byAccount = new Map(ids.map((id) => [id, enabled(groupsOf(id))]));
  return { byAccount, union: [...new Set([...byAccount.values()].flat())] };
}

/** PL12 sổ đơn vị thu — mọi nhóm S03 có hiệu lực ở ít nhất một tài khoản, cùng luật kế thừa với `readS03Allowlist`
 * (`default` đọc `accounts.default.groups`, thiếu thì cấp ngoài; tài khoản không khai `groups` kế thừa cấp ngoài). Khoá
 * bỏ tiền tố `group:` (một nhóm một đơn vị dù cấu hình viết hai kiểu); `enabled` = bật ở ít nhất một tài khoản; theo thứ
 * tự khoá. Chỉ đọc đối tượng đã parse — không chạm tệp hay lệnh nào. Nhận `channels.zalouser`. Khớp tập bật với
 * `effectiveEnabledGroups` của app đo ở app/tests/so-nhom.test.tsx (SN-AC-5b). */
export function readS03Groups(z) {
  if (!z) return [];
  const taiKhoan = ["default", ...Object.keys(z.accounts ?? {}).filter((id) => id !== "default")];
  const nhom = new Map();
  for (const id of taiKhoan) {
    const groups = (id === "default" ? z.accounts?.default?.groups : z.accounts?.[id]?.groups) ?? z.groups ?? {};
    for (const [k, v] of Object.entries(groups)) {
      const key = k.replace(/^group:/, "");
      nhom.set(key, (nhom.get(key) ?? false) || (v?.allow !== false && v?.enabled !== false));
    }
  }
  return [...nhom].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, enabled]) => ({ key, enabled }));
}
