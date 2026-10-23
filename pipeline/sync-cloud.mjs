// sync-cloud.mjs — C4 P0: đồng bộ outbound local → Supabase QUA HTTPS THUẦN.
//
// Bối cảnh mạng (2026-10-20): máy này KHÔNG có IPv6 (direct Supabase chết)
// và middlebox cắt TLS Postgres tới pooler (5432/6543 đều EOF). Kênh sống:
//   - Management API https://api.supabase.com (DDL, DELETE, gate) — cổng 443
//   - PostgREST https://<ref>.supabase.co/rest/v1 (INSERT hàng loạt) — 443
// Geometry: node-pg trả hex EWKB string → geometry parser cloud nhận trực tiếp
// (đã test round-trip 201).
//
// Nguyên tắc ADR-0007/0009 + portals.md: OUTBOUND-ONLY một chiều; tầng A
// (source_registry DATA, stg_*, airbnb_snapshots, raw) KHÔNG sync — gate
// kiểm 0 dòng sau mỗi lần chạy.
// Env: ~/.oneinvest/cloud.env (chmod 600): SUPABASE_SERVICE_KEY + SUPABASE_MGMT_TOKEN
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import pg from "pg";

const REF = "smqpqiigzulwpmrsrhci";
const REST = `https://${REF}.supabase.co/rest/v1`;
const MGMT = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const LOCAL_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// local → cloud: bảng airdna_* đổi tên trung tính ref_calib_* (C4 SPL —
// không tên nguồn tầng A trong DB chia sẻ; app đọc qua rewriter db.ts)
const RENAME = (t) => t.replace(/^airdna_/, "ref_calib_");
const FILL = [
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

const CHUNK = 500; // hàng/lần POST

async function creds() {
  const env = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
  const key = env.match(/SUPABASE_SERVICE_KEY=(\S+)/)?.[1];
  const token = process.env.SUPABASE_MGMT_TOKEN ?? env.match(/SUPABASE_MGMT_TOKEN=(\S+)/)?.[1];
  if (!key || !token) throw new Error("thiếu SUPABASE_SERVICE_KEY/SUPABASE_MGMT_TOKEN trong ~/.oneinvest/cloud.env");
  return { key, token };
}

async function mgmt(token, query) {
  const res = await fetch(MGMT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`mgmt ${res.status}: ${(await res.text()).slice(0, 200)} ← ${query.slice(0, 60)}`);
  return res.json();
}

async function restInsert(key, table, rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const res = await fetch(`${REST}/${table}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      throw new Error(`rest ${table} [${i}..]: ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
  }
}

// PII tầng A (nguyên tắc đã duyệt 2026-10-21, docs/research/
// investment-pipeline-4-stages.md): cloud CHỈ nhận seller_phone_hash +
// aggregate. SĐT thô / tên người bán không bao giờ rời máy local.
// Trước đây SELECT * — may mắn schema cloud thiếu cột mới nên PII chưa
// lọt, giờ chặn bằng danh sách cột loại bỏ tường minh.
const PII_EXCLUDE = {
  sale_offers: ["seller_phone", "seller_name"],
  sellers: ["name"], // sellers: hash + aggregate OK; name là PII tầng A
  // 031 thêm properties.seller_name (copy từ sale_offers). Cloud chưa có cột
  // này nên chưa lọt — chặn trước khi schema cloud bắt kịp 031.
  properties: ["seller_name"],
};

async function main() {
  const { key, token } = await creds();
  const local = new pg.Client({ connectionString: LOCAL_URL });
  await local.connect();

  // Một câu TRUNCATE cho cả 17 bảng — CASCADE tự xử thứ tự phụ thuộc FK
  // (DELETE từng bảng vướng FK khi chạy lại).
  const cloudFILL = FILL.map(RENAME);
  await mgmt(token, `TRUNCATE ${cloudFILL.join(", ")} RESTART IDENTITY CASCADE`);
  let total = 0;
  for (const table of FILL) {
    if (PII_EXCLUDE[table]?.includes("*")) {
      console.log(`  ${table}: SKIP (PII)`);
      continue;
    }
    const exclude = PII_EXCLUDE[table] ?? [];
    // Postgres không hỗ trợ "SELECT * EXCEPT" — lấy danh sách cột rồi loại PII
    let rows;
    if (exclude.length) {
      const { rows: cols } = await local.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
        [table],
      );
      const colList = cols
        .map((c) => c.column_name)
        .filter((c) => !exclude.includes(c))
        .map((c) => `"${c}"`)
        .join(", ");
      ({ rows } = await local.query(`SELECT ${colList} FROM ${table}`));
    } else {
      ({ rows } = await local.query(`SELECT * FROM ${table}`));
    }
    if (rows.length > 0) await restInsert(key, RENAME(table), rows);
    total += rows.length;
    console.log(`  ${table}: ${rows.length}${exclude.length ? ` (đã loại PII: ${exclude.join(",")})` : ""}`);
  }
  await local.end();

  // ---- Leak Gate: tầng A / thô phải 0 dòng ở cloud ----
  const checks = ["source_registry", "airbnb_snapshots"];
  const stg = await mgmt(
    token,
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'stg_%'`,
  );
  for (const { table_name } of stg) checks.push(table_name);
  const leaks = [];
  for (const t of checks) {
    // Bảng VẮNG MẶT ở cloud = sạch tuyệt đối (tốt hơn 0 dòng) — check
    // existence trước, tránh 42P01 khi đã drop (source_registry 2026-10-21).
    const ex = await mgmt(token, `SELECT to_regclass('${t}') AS r`);
    if (!ex[0].r) continue;
    const r = await mgmt(token, `SELECT count(*)::int AS n FROM ${t}`);
    if (r[0].n > 0) leaks.push(`${t}=${r[0].n}`);
  }
  const airdnaTables = await mgmt(
    token,
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'airdna%'`,
  );
  if (airdnaTables[0].n > 0) leaks.push(`còn ${airdnaTables[0].n} bảng airdna% ở cloud`);
  if (leaks.length) {
    console.error("LEAK GATE FAIL:", leaks.join(", "));
    process.exit(1);
  }
  console.log(`sync xong: ${total} dòng, ${FILL.length} bảng; leak gate PASS`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
