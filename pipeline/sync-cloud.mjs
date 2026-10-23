// sync-cloud.mjs — C4: đồng bộ outbound local → Supabase QUA HTTPS THUẦN, NGUYÊN TỬ.
//
// Bối cảnh mạng (2026-10-20): máy này KHÔNG có IPv6 (direct Supabase chết)
// và middlebox cắt TLS Postgres tới pooler (5432/6543 đều EOF). Kênh sống:
// Management API https://api.supabase.com/.../database/query (cổng 443) —
// MỘT kết nối mỗi lời gọi, thân > ~2,5MB bị 413.
//
// Cách tráo (cloud-sync-atomic, 2026-10-23 — docs/superpowers/specs/2026-10-23-cloud-sync-atomic-design.md):
//   1. đọc catalog cloud (cột, khoá chính, FK) → kế hoạch topo
//   2. đọc local trong MỘT snapshot REPEATABLE READ (pipeline có thể đang ghi)
//   3. soát tên nguồn thật trong payload bảng người bán, chặn tụt
//   4. nạp vào sync_stage.rows (migration 038 — schema riêng, anon không đọc được)
//   5. MỘT lời gọi chứa BEGIN … COMMIT: DELETE bảng thay-trọn → UPSERT bảng giữ-chỗ
//      (bảng FILL bị bảng ngoài FILL tham chiếu, vd areas ← saved_markets) → INSERT
//      → xoá dòng giữ-chỗ không còn ở local. Prod đọc thấy bản cũ tới đúng lúc COMMIT.
// KHÔNG còn TRUNCATE (TRUNCATE CASCADE areas từng xoá sạch saved_markets mỗi 15').
// Script không gửi DDL nào lên cloud; schema cloud đổi qua migration do Mạnh áp.
//
// Ranh giới dữ liệu (ADR-0007, luật Mạnh chốt 2026-10-23 — AGENTS.md luật 6): định danh
// người bán trên tin rao (tên, SĐT, ID tài khoản) là TẦNG C — công khai. Tầng A chỉ còn:
// tên nguồn thật (kể cả lẫn trong giá trị cột), hồ sơ người dùng app, user_events/
// user_profile, review_queue. Vì vậy:
//   - bảng thô/registry (source_registry, stg_*, airbnb_snapshots, raw) KHÔNG sync — chúng
//     mang tên nguồn thật (mapping S0x↔nguồn, payload gốc theo nguồn) nên là tầng A, không phải
//     vì SĐT/tên người bán; leak gate kiểm 0 dòng sau mỗi lần chạy; airdna_* lên dưới tên
//     trung tính ref_calib_*;
//   - bảng người bán chỉ gửi cột trong CLOUD_ALLOW (cột mới mặc định ở lại máy);
//   - seller_ref lên dạng «<mã S0x>:<dãy số cuối>» — giá trị gốc mang tiền tố/tên nguồn;
//   - payload bảng người bán được soát ở local với tên + định danh nguồn đọc từ
//     source_registry local (danh sách này không rời máy) — trúng là dừng, không gửi;
//   - PII_EXCLUDE (SĐT, tên người bán) GIỮ nguyên: luật mới không bắt loại, nhưng mở các
//     cột đó là việc sản phẩm riêng chưa được xác nhận — không phải vì tầng A.
// Env: ~/.oneinvest/cloud.env (chmod 600): SUPABASE_MGMT_TOKEN
import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const REF = "smqpqiigzulwpmrsrhci";
const MGMT = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const LOCAL_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// local → cloud: bảng airdna_* đổi tên trung tính ref_calib_* (C4 SPL —
// không tên nguồn tầng A trong DB chia sẻ; app đọc qua rewriter db.ts)
export const RENAME = (t) => t.replace(/^airdna_/, "ref_calib_");
export const FILL = [
  "areas",
  "listings",
  "market_metrics",
  "listing_stats",
  "area_breakdowns",
  "market_asset_stats",
  "nights",
  "sale_offers",
  "sellers",
  "asset_nodes",
  "properties",
  "property_offers",
  "area_sources",
  "dq_check_results",
  "airdna_markets",
  "airdna_scores",
  "airdna_market_metrics",
  "airdna_sub_monthly",
  "airdna_future_daily",
  "airdna_listings",
  "airdna_submarket_metrics",
];

// Cột loại tường minh (nguyên tắc 2026-10-21, docs/research/investment-pipeline-4-stages.md).
// Luật 2026-10-23 xếp định danh người bán vào tầng C nhưng các cột này vẫn ở lại máy
// trong đợt này — mở chúng là quyết định sản phẩm riêng.
export const PII_EXCLUDE = {
  sale_offers: ["seller_phone", "seller_name"],
  sellers: ["name"], // sellers: hash + aggregate lên cloud; name ở lại máy
  // 031 thêm properties.seller_name (copy từ sale_offers) — ở lại máy như sale_offers.
  properties: ["seller_name"],
};

// Cột mà GIÁ TRỊ mang tên miền nguồn thật (tầng A theo .claude/rules/pii-spl.md: «listing_url
// theo domain nguồn») — ở lại máy dù định danh người bán là tầng C. Hiện rỗng ở local.
export const SOURCE_EXCLUDE = {
  sale_offers: ["listing_url"],
  properties: ["photos"], // URL ảnh trỏ CDN của nguồn
};

// Cột CHO PHÉP của bảng người bán: cột local mới mặc định KHÔNG lên cloud (chặn tên nguồn
// lọt qua cột mới) — thêm vào đây là một quyết định có người duyệt.
export const CLOUD_ALLOW = {
  sale_offers: [
    "offer_id", "area_id", "kind", "price_vnd", "area_m2", "price_perm2", "bedrooms",
    "phuong_raw", "confidence", "first_seen", "last_seen", "n_reposts", "post_ids", "source",
    "price_tier", "district_raw", "seller_phone_hash", "seller_ref", "bait_gap_pct",
    "property_type", "street_raw", "block_raw", "floor_raw", "bathrooms",
  ],
  sellers: ["phone_hash", "sources", "n_ads", "first_seen", "last_seen", "flags"],
  properties: [
    "id", "geo", "area_id", "project_node", "property_type", "kind", "cluster_key",
    "n_evidence", "first_seen", "last_seen", "created_at", "resolved_by", "verification",
    "verified_by", "verified_at", "bedrooms", "bathrooms", "street", "current_price_vnd",
    "price_history", "seller_phone_hash", "features", "enrichment_log",
    "confidence", "n_sources", "stable_key",
  ],
};
for (const [t, allow] of Object.entries(CLOUD_ALLOW)) {
  const both = allow.filter((c) => [...(PII_EXCLUDE[t] ?? []), ...(SOURCE_EXCLUDE[t] ?? [])].includes(c));
  if (both.length) throw new Error(`CLOUD_ALLOW giao danh sách loại ở ${t}: ${both.join(",")}`);
}

export const CHUNK_BYTES = 1_800_000; // thân yêu cầu mỗi mẻ nạp (413 đo ở ~2,5–4MB)
export const SHRINK_MIN = 0.5; // local < 50% số dòng đang có trên cloud → dừng (local đang dựng dở)
export const STALE_STAGE_HOURS = 2; // staging của lượt chết quá ngần này thì dọn
export const ADVISORY_KEY = 74210231; // hai lượt tráo chồng nhau xếp hàng
export const SELLER_REF_RE = "^S0[1-9]:[0-9]+$";
const STAGE_PARALLEL = 3;

// seller_ref gốc mang tiền tố nguồn (vd «ct:<id>», «author-<id>», hằng tên nguồn) →
// cloud chỉ nhận mã S0x của dòng + dãy số cuối; không có số → NULL.
const SELLER_REF_EXPR = `CASE WHEN substring("seller_ref" from '([0-9]+)$') IS NULL THEN NULL
  ELSE "source" || ':' || substring("seller_ref" from '([0-9]+)$') END AS "seller_ref"`;

// Mọi kiểu thời gian (và mảng của chúng) giữ nguyên chuỗi Postgres: mặc định node-pg dựng
// Date theo giờ máy (+07) rồi JSON hoá sang UTC → cột date lùi một ngày; Date của JS
// cũng cắt micro-giây của timestamptz.
// date 1082/1182 · timestamp 1114/1115 · timestamptz 1184/1185 · time 1083/1183 · timetz 1266/1270
const RAW_OIDS = new Set([1082, 1182, 1114, 1115, 1184, 1185, 1083, 1183, 1266, 1270]);
export const localTypes = {
  getTypeParser: (oid, format) => (RAW_OIDS.has(oid) ? (v) => v : pg.types.getTypeParser(oid, format)),
};

const q = (id) => `"${String(id).replace(/"/g, '""')}"`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const SAFE = /^[A-Za-z0-9_-]+$/;

/** Danh sách biểu thức SELECT cho một bảng local: loại PII_EXCLUDE/SOURCE_EXCLUDE, chỉ
 * CLOUD_ALLOW với bảng người bán, chuẩn hoá seller_ref, cột geometry/geography → hex EWKB
 * (`geoCols`). `unapproved` = cột local chưa duyệt lên cloud. */
export function selectList(table, localCols, geoCols = []) {
  const exclude = [...(PII_EXCLUDE[table] ?? []), ...(SOURCE_EXCLUDE[table] ?? [])];
  const allow = CLOUD_ALLOW[table];
  const cols = localCols.filter((c) => !exclude.includes(c) && (!allow || allow.includes(c)));
  const unapproved = allow ? localCols.filter((c) => !allow.includes(c) && !exclude.includes(c)) : [];
  const sql = cols
    .map((c) =>
      table === "sale_offers" && c === "seller_ref"
        ? SELLER_REF_EXPR
        : geoCols.includes(c)
          ? `${q(c)}::text AS ${q(c)}`
          : q(c),
    )
    .join(", ");
  return { sql, cols, unapproved };
}

/** Kế hoạch tráo trên tên cloud: thứ tự INSERT cha trước con, DELETE ngược lại; `keep` =
 * bảng FILL bị một bảng NGOÀI FILL tham chiếu → UPSERT theo khoá chính + xoá dòng thừa. */
export function planTables({ fill, fks, pks }) {
  const inFill = new Set(fill);
  const parents = new Map(fill.map((t) => [t, new Set()]));
  const keep = {};
  for (const { src, dst } of fks) {
    if (!inFill.has(dst)) continue;
    if (!inFill.has(src)) {
      if (!pks[dst]?.length) throw new Error(`bảng giữ-chỗ ${dst} không có khoá chính`);
      keep[dst] = pks[dst];
    } else if (src !== dst) {
      parents.get(src).add(dst);
    }
  }
  const insertOrder = [];
  const done = new Set();
  while (insertOrder.length < fill.length) {
    const next = fill.find((t) => !done.has(t) && [...parents.get(t)].every((p) => done.has(p)));
    if (!next) {
      const left = fill.filter((t) => !done.has(t));
      throw new Error(`vòng FK giữa các bảng sync: ${left.join(", ")}`);
    }
    insertOrder.push(next);
    done.add(next);
  }
  return { insertOrder, deleteOrder: [...insertOrder].reverse(), keep };
}

/** Chia dòng (chuỗi JSON hoặc object) thành các mảng JSON sao cho thân yêu cầu (SQL đã
 * JSON hoá) ≤ maxBytes. */
export function chunkRows(rows, maxBytes) {
  const out = [];
  let cur = [];
  let size = 2;
  for (const row of rows) {
    const s = typeof row === "string" ? row : JSON.stringify(row);
    const b = Buffer.byteLength(JSON.stringify(s)) + 1;
    if (b + 2 > maxBytes) throw new Error(`dòng quá lớn: ${b} byte > ${maxBytes}`);
    if (size + b > maxBytes && cur.length) {
      out.push(`[${cur.join(",")}]`);
      cur = [];
      size = 2;
    }
    cur.push(s);
    size += b;
  }
  if (cur.length) out.push(`[${cur.join(",")}]`);
  return out;
}

export const dollarTag = (runId) => `$sync_${runId.replace(/[^A-Za-z0-9]/g, "")}$`;
export function assertNoTag(text, tag) {
  if (text.includes(tag)) throw new Error(`dữ liệu chứa thẻ dollar-quote ${tag} — dừng`);
}

export function stageInsertSql(runId, tbl, json, tag) {
  if (!SAFE.test(runId) || !SAFE.test(tbl)) throw new Error(`run_id/tbl không hợp lệ: ${runId} ${tbl}`);
  assertNoTag(json, tag);
  return `INSERT INTO sync_stage.rows (run_id, tbl, payload)
SELECT ${lit(runId)}, ${lit(tbl)}, x FROM jsonb_array_elements(${tag}${json}${tag}::jsonb) x`;
}

/** MỘT chuỗi BEGIN … COMMIT tráo toàn bộ bảng sync (tên cloud). `columns[t]` = cột chung
 * local∩cloud đã gửi; `counts[t]` = số dòng đã nạp; `pause` > 0 = móc thử giữ giao dịch mở. */
export function buildSwapSql({ runId, readAt, plan, counts, columns, pause = 0 }) {
  if (!SAFE.test(runId)) throw new Error(`run_id không hợp lệ: ${runId}`);
  const src = (t) =>
    `FROM sync_stage.rows s, jsonb_populate_record(NULL::public.${q(t)}, s.payload) r
     WHERE s.run_id = ${lit(runId)} AND s.tbl = ${lit(t)}`;
  const lines = [
    "BEGIN;",
    "SET LOCAL statement_timeout = '120s';",
    `SELECT pg_advisory_xact_lock(${ADVISORY_KEY});`,
  ];
  const checks = plan.insertOrder
    .map(
      (t) => `  SELECT count(*) INTO n FROM sync_stage.rows WHERE run_id = ${lit(runId)} AND tbl = ${lit(t)};
  IF n <> ${Number(counts[t] ?? 0)} THEN RAISE EXCEPTION 'staging lệch ${t}: % ≠ ${Number(counts[t] ?? 0)}', n; END IF;`,
    )
    .join("\n");
  lines.push(`DO $chk$ DECLARE n bigint; BEGIN
  IF EXISTS (SELECT 1 FROM sync_stage.swaps WHERE read_at > ${lit(readAt)}::timestamptz) THEN
    RAISE EXCEPTION 'lượt ${runId} cũ hơn lượt đã tráo — bỏ';
  END IF;
${checks}
END $chk$;`);
  for (const t of plan.deleteOrder) if (!plan.keep[t]) lines.push(`DELETE FROM public.${q(t)};`);
  if (pause > 0) lines.push(`SELECT pg_sleep(${Number(pause)});`);
  for (const t of plan.insertOrder) {
    const cols = columns[t];
    if (!cols?.length) continue;
    const list = cols.map(q).join(", ");
    const sel = cols.map((c) => `r.${q(c)}`).join(", ");
    let stmt = `INSERT INTO public.${q(t)} (${list}) SELECT ${sel} ${src(t)}`;
    const pk = plan.keep[t];
    if (pk) {
      const rest = cols.filter((c) => !pk.includes(c));
      stmt += ` ON CONFLICT (${pk.map(q).join(", ")}) DO ${
        rest.length ? `UPDATE SET ${rest.map((c) => `${q(c)} = EXCLUDED.${q(c)}`).join(", ")}` : "NOTHING"
      }`;
    }
    lines.push(`${stmt};`);
  }
  for (const t of plan.insertOrder) {
    const pk = plan.keep[t];
    if (!pk) continue;
    const match = pk.map((c) => `r.${q(c)} = d.${q(c)}`).join(" AND ");
    lines.push(`DELETE FROM public.${q(t)} d WHERE NOT EXISTS (SELECT 1 ${src(t)} AND ${match});`);
  }
  lines.push(
    `INSERT INTO sync_stage.swaps (run_id, read_at) VALUES (${lit(runId)}, ${lit(readAt)}::timestamptz);`,
    "DELETE FROM sync_stage.swaps WHERE swapped_at < now() - interval '7 days';",
    `DELETE FROM sync_stage.rows WHERE run_id = ${lit(runId)};`,
    "COMMIT;",
  );
  return lines.join("\n");
}

/** Token định danh nguồn đầu tiên xuất hiện trong text (không phân biệt hoa thường), hoặc null.
 * Token ngắn (< 4 ký tự, vd tên nguồn ba chữ) so theo ranh giới từ để không trúng nhầm giữa từ. */
export function scanSourceNames(text, tokens) {
  const low = text.toLowerCase();
  for (const t of tokens) {
    if (!t) continue;
    const k = t.toLowerCase();
    if (k.length >= 4) {
      if (low.includes(k)) return t;
    } else {
      const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(low)) return t;
    }
  }
  return null;
}

class PhaseError extends Error {
  constructor(phase, message) {
    super(message);
    this.phase = phase;
  }
}

/** exec(sql) qua Management API. Thử lại 429/502/503/504 có lùi; `{ retry: false }` cho
 * lời gọi không lặp được (tráo — đã COMMIT mà lặp lại sẽ báo lỗi giả). */
export function mgmtExec(token, { fetchImpl = fetch, retries = 4, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  return async (query, { retry = true } = {}) => {
    for (let attempt = 0; ; attempt++) {
      const res = await fetchImpl(MGMT, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) return res.json();
      const body = (await res.text()).slice(0, 300);
      if (retry && [429, 502, 503, 504].includes(res.status) && attempt < retries) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      throw new Error(`mgmt ${res.status}: ${body}`);
    }
  };
}

const newRunId = () =>
  `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomBytes(3).toString("hex")}`;

/** Chạy fn trên items với n worker. Một job lỗi → mọi worker ngừng lấy job mới; chỉ trả về
 * (ném lỗi đầu tiên) khi MỌI worker đã dừng — để dọn staging sau đó không bị mẻ muộn ghi đè. */
export async function pool(items, n, fn) {
  let i = 0;
  let failed = null;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (!failed && i < items.length) {
      const k = i++;
      try {
        await fn(items[k], k);
      } catch (e) {
        failed ??= e;
      }
    }
  });
  await Promise.allSettled(workers);
  if (failed) throw failed;
}

/** Leak gate — tầng A / thô phải vắng hoặc 0 dòng ở cloud; seller_ref chỉ dạng S0x;
 * anon/authenticated không vào được sync_stage. Trả danh sách vi phạm (rỗng = PASS). */
export async function leakGate(exec) {
  const leaks = [];
  const checks = ["source_registry", "airbnb_snapshots"];
  const stg = await exec(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'stg_%'`,
  );
  for (const { table_name } of stg) checks.push(table_name);
  for (const t of checks) {
    // Bảng VẮNG MẶT ở cloud = sạch tuyệt đối — check existence trước (tránh 42P01).
    const ex = await exec(`SELECT to_regclass(${lit(t)})::text AS r`);
    if (!ex[0].r) continue;
    const r = await exec(`SELECT count(*)::int AS n FROM public.${q(t)}`);
    if (r[0].n > 0) leaks.push(`${t}=${r[0].n}`);
  }
  const airdna = await exec(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'airdna%'`,
  );
  if (airdna[0].n > 0) leaks.push(`còn ${airdna[0].n} bảng airdna% ở cloud`);
  const ref = await exec(
    `SELECT count(*)::int AS n FROM public.sale_offers WHERE seller_ref IS NOT NULL AND seller_ref !~ ${lit(SELLER_REF_RE)}`,
  );
  if (ref[0].n > 0) leaks.push(`sale_offers.seller_ref chưa chuẩn hoá S0x: ${ref[0].n} dòng`);
  const acl = await exec(`SELECT count(*)::int AS n FROM pg_roles r
    WHERE r.rolname IN ('anon','authenticated') AND has_schema_privilege(r.rolname, 'sync_stage', 'USAGE')`);
  if (acl[0].n > 0) leaks.push("anon/authenticated có USAGE trên sync_stage");
  return leaks;
}

/** Một lượt đồng bộ. `local`: pg.Client tới DB local (dựng với `types: localTypes`).
 * `exec(sql, opts)` → mảng dòng của câu cuối. Ném PhaseError (`err.phase`) khi gãy. */
export async function syncOnce({ local, exec, log = console.log, runId = newRunId(), swapPause = 0, sourceTokens } = {}) {
  const timings = {};
  const warnings = [];
  const warn = (m) => {
    warnings.push(m);
    log(`  WARN ${m}`);
  };
  let t0 = Date.now();
  const lap = (k) => {
    timings[k] = (Date.now() - t0) / 1000;
    t0 = Date.now();
  };
  const cloudOf = new Map(FILL.map((t) => [t, RENAME(t)]));
  const cloudNames = [...cloudOf.values()];
  const arr = `ARRAY[${cloudNames.map(lit).join(",")}]`;

  // 1. catalog
  let cloudCols, plan, cloudCounts;
  try {
    const [reg] = await exec(`SELECT to_regclass('sync_stage.rows')::text AS r, to_regclass('sync_stage.swaps')::text AS s`);
    if (!reg?.r || !reg?.s) {
      throw new Error("cloud chưa có sync_stage — Mạnh áp migration 038 trước (docs/ops/cloud-sync-atomic.md)");
    }
    const cols = await exec(`SELECT table_name AS t, column_name AS c,
        (is_generated = 'ALWAYS' OR identity_generation = 'ALWAYS') AS gen
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY(${arr})
      ORDER BY table_name, ordinal_position`);
    cloudCols = new Map();
    for (const r of cols) {
      if (!cloudCols.has(r.t)) cloudCols.set(r.t, []);
      if (!r.gen) cloudCols.get(r.t).push(r.c);
    }
    const missing = cloudNames.filter((t) => !cloudCols.has(t));
    if (missing.length) throw new Error(`cloud thiếu bảng: ${missing.join(", ")}`);
    const fks = await exec(`SELECT conrelid::regclass::text AS src, confrelid::regclass::text AS dst
      FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace`);
    const pkRows = await exec(`SELECT c.relname AS t, a.attname AS c
      FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indisprimary AND c.relnamespace = 'public'::regnamespace AND c.relname = ANY(${arr})
      ORDER BY c.relname, array_position(i.indkey::int2[], a.attnum)`);
    const pks = {};
    for (const r of pkRows) (pks[r.t] ??= []).push(r.c);
    const strip = (s) => s.replace(/^public\./, "").replace(/^"(.*)"$/, "$1");
    plan = planTables({ fill: cloudNames, fks: fks.map((f) => ({ src: strip(f.src), dst: strip(f.dst) })), pks });
    const counts = await exec(cloudNames.map((t) => `SELECT ${lit(t)} AS t, count(*)::bigint AS n FROM public.${q(t)}`).join(" UNION ALL "));
    cloudCounts = Object.fromEntries(counts.map((r) => [r.t, Number(r.n)]));
    await exec(`DELETE FROM sync_stage.rows WHERE staged_at < now() - interval '${STALE_STAGE_HOURS} hours'`);
  } catch (e) {
    throw new PhaseError("catalog", e.message);
  }
  lap("catalog");

  // 2. đọc local — một snapshot
  const data = new Map();
  const columns = {};
  let readAt;
  let tokens = sourceTokens;
  try {
    await local.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    readAt = (await local.query("SELECT transaction_timestamp()::text AS t")).rows[0].t;
    if (!tokens) {
      const { rows } = await local.query(
        `SELECT DISTINCT x FROM (SELECT real_name AS x FROM source_registry
           UNION ALL SELECT unnest(source_ids) FROM source_registry) s WHERE length(x) > 0`,
      );
      tokens = rows.map((r) => r.x);
    }
    // Không có gì để soát = bộ chặn tầng A đang mở → dừng thay vì cho qua (fail-closed).
    if (!tokens.length) throw new PhaseError("scan", "không đọc được tên/định danh nguồn nào từ source_registry local — không soát được, không gửi");
    const { rows: lc } = await local.query(
      `SELECT table_name AS t, column_name AS c, udt_name AS u FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name, ordinal_position`,
      [FILL],
    );
    const localCols = new Map();
    const geo = new Map();
    for (const r of lc) {
      (localCols.get(r.t) ?? localCols.set(r.t, []).get(r.t)).push(r.c);
      if (r.u === "geometry" || r.u === "geography") (geo.get(r.t) ?? geo.set(r.t, []).get(r.t)).push(r.c);
    }
    for (const t of FILL) {
      const ct = cloudOf.get(t);
      const sel = selectList(t, localCols.get(t) ?? []);
      for (const c of sel.unapproved) warn(`cột chưa duyệt lên cloud, ở lại máy: ${t}.${c}`);
      const cloudSet = new Set(cloudCols.get(ct));
      const drift = sel.cols.filter((c) => !cloudSet.has(c));
      for (const c of drift) warn(`lệch schema: cloud thiếu cột ${ct}.${c} — cột này không gửi`);
      const send = sel.cols.filter((c) => cloudSet.has(c));
      columns[ct] = send;
      // Dòng dạng JSON do Postgres sinh: số thập phân trong jsonb, micro-giây, ngày giữ
      // nguyên (JSON.parse của node-pg làm tròn số jsonb về double).
      const list = selectList(t, send, geo.get(t) ?? []).sql;
      const { rows } = await local.query(`SELECT row_to_json(x)::text AS j FROM (SELECT ${list || "1 AS _"} FROM ${q(t)}) x`);
      data.set(ct, send.length ? rows.map((r) => r.j) : []);
    }
    await local.query("COMMIT");
  } catch (e) {
    await local.query("ROLLBACK").catch(() => {});
    if (e instanceof PhaseError) throw e;
    throw new PhaseError("read", e.message);
  }
  lap("read");

  // 3. soát tên nguồn (bảng người bán) + chặn tụt
  for (const t of Object.keys(CLOUD_ALLOW)) {
    for (const j of data.get(RENAME(t)) ?? []) {
      if (!scanSourceNames(j, tokens)) continue;
      const col = Object.entries(JSON.parse(j)).find(([, v]) => v != null && scanSourceNames(JSON.stringify(v), tokens))?.[0];
      throw new PhaseError(
        "scan",
        `giá trị mang định danh nguồn (tầng A) ở ${t}.${col ?? "?"} — dừng trước khi gửi, không dòng nào rời máy`,
      );
    }
  }
  const counts = Object.fromEntries([...data].map(([t, rows]) => [t, rows.length]));
  for (const t of cloudNames) {
    const have = cloudCounts[t] ?? 0;
    if (have > 0 && counts[t] < SHRINK_MIN * have) {
      throw new PhaseError(
        "shrink",
        `local tụt ${t}: ${counts[t]} < ${SHRINK_MIN * 100}% của ${have} dòng trên cloud — local đang dựng dở? không tráo`,
      );
    }
  }

  // 4. nạp staging
  const tag = dollarTag(runId);
  const cleanup = () => exec(`DELETE FROM sync_stage.rows WHERE run_id = ${lit(runId)}`).catch(() => {});
  try {
    const jobs = [];
    for (const t of plan.insertOrder) for (const json of chunkRows(data.get(t) ?? [], CHUNK_BYTES)) jobs.push([t, json]);
    await pool(jobs, STAGE_PARALLEL, ([t, json]) => exec(stageInsertSql(runId, t, json, tag)));
  } catch (e) {
    await cleanup();
    throw new PhaseError("stage", e.message);
  }
  lap("stage");

  // 5. tráo — một giao dịch
  try {
    await exec(buildSwapSql({ runId, readAt, plan, counts, columns, pause: swapPause }), { retry: false });
  } catch (e) {
    await cleanup();
    throw new PhaseError("swap", e.message);
  }
  lap("swap");

  // 6. leak gate
  let leaks;
  try {
    leaks = await leakGate(exec);
  } catch (e) {
    throw new PhaseError("gate", e.message);
  }
  lap("gate");
  if (leaks.length) throw new PhaseError("gate", `LEAK GATE FAIL: ${leaks.join(", ")}`);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { runId, total, counts, timings, warnings };
}

async function main() {
  const env = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
  const token = process.env.SUPABASE_MGMT_TOKEN ?? env.match(/SUPABASE_MGMT_TOKEN=(\S+)/)?.[1];
  if (!token) throw new Error("thiếu SUPABASE_MGMT_TOKEN trong ~/.oneinvest/cloud.env");
  const local = new pg.Client({ connectionString: LOCAL_URL, types: localTypes });
  await local.connect();
  const started = new Date();
  console.log(`sync bắt đầu ${started.toISOString()}`);
  try {
    const r = await syncOnce({ local, exec: mgmtExec(token) });
    for (const [t, n] of Object.entries(r.counts)) console.log(`  ${t}: ${n}`);
    const tm = Object.entries(r.timings).map(([k, v]) => `${k} ${v.toFixed(1)}s`).join(" · ");
    console.log(
      `sync xong ${new Date().toISOString()} (run ${r.runId}): ${r.total} dòng, ${FILL.length} bảng; ${tm}; tổng ${((Date.now() - started) / 1000).toFixed(1)}s; leak gate PASS`,
    );
  } catch (e) {
    console.error(`SYNC FAIL [${e.phase ?? "?"}] ${new Date().toISOString()}: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await local.end();
  }
}

// Chỉ chạy khi gọi trực tiếp (test import FILL/PII_EXCLUDE không được đụng mạng).
// So realpath vì launchd gọi qua symlink ~/dev/one-invest.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
