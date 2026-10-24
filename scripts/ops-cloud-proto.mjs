#!/usr/bin/env node
/**
 * ops-cloud-proto.mjs — lược đồ «như cloud» cho bản bấm được và eval ảnh của ON3 `o-kpi-chi-do-local` (ADR-0014).
 * Dựng lược đồ `ops_cloud_proto` trong DB local: khuôn mọi bảng public (rỗng) TRỪ bảng tầng A / bảng thô mà cloud không có
 * (source_registry, review_queue, stg_*, airbnb_snapshots), chép dòng `users` để đăng nhập thử, và một bảng ops_heartbeat:
 *   --mode none   không có bản tin
 *   --mode fresh  bản tin do push-ops-facts THẬT dựng trên DB local (máy chủ thu tạm, không gửi lên cloud)
 *   --mode stale  cùng bản tin, mọi mốc lùi 46′
 * In ra DATABASE_URL (search_path = lược đồ) để chạy dev server:  DATABASE_URL=<url> npm run dev -- -p 3460
 * Dọn: --drop. Chỉ DB local; không đụng cloud.
 */
import { createRequire } from "node:module";


export const SCHEMA = "ops_cloud_proto";
const KHONG_LEN_CLOUD = /^(source_registry|review_queue|airbnb_snapshots|stg_.*)$/;

const shift = (iso, min) => new Date(Date.parse(iso) + min * 60_000).toISOString();

/** Lùi mọi mốc của bản tin `min` phút (pushedAt và measured_at từng khối). */
export function shiftPayload(p, min) {
  const out = structuredClone(p);
  out.pushedAt = shift(out.pushedAt, min);
  for (const b of Object.values(out.blocks ?? {})) if (b?.measured_at) b.measured_at = shift(b.measured_at, min);
  return out;
}

async function main() {
  const require = createRequire(new URL("../app/package.json", import.meta.url));
  const pg = require("pg");
  const { captureOpsFacts, localDbUrl } = await import("../pipeline/scripts/capture-ops-facts.mjs");
  const args = process.argv.slice(2);
  const mode = args.includes("--drop") ? "drop" : (args[args.indexOf("--mode") + 1] ?? "none");
  if (!["none", "fresh", "stale", "drop"].includes(mode)) throw new Error(`--mode phải là none|fresh|stale (được ${mode})`);
  const c = new pg.Client({ connectionString: localDbUrl() });
  await c.connect();
  try {
    await c.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    if (mode === "drop") return console.log(`đã xoá lược đồ ${SCHEMA}`);
    await c.query(`CREATE SCHEMA "${SCHEMA}"`);
    const { rows } = await c.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`);
    for (const { tablename: t } of rows) {
      if (KHONG_LEN_CLOUD.test(t)) continue;
      await c.query(`CREATE TABLE "${SCHEMA}"."${t}" (LIKE public."${t}" INCLUDING DEFAULTS INCLUDING CONSTRAINTS)`);
    }
    await c.query(`INSERT INTO "${SCHEMA}".users SELECT * FROM public.users`);
    await c.query(`CREATE TABLE IF NOT EXISTS "${SCHEMA}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`);
    if (mode !== "none") {
      const r = await captureOpsFacts({ env: { DATABASE_URL: localDbUrl() } });
      if (r.code !== 0 || !r.payload) throw new Error(`push-ops-facts thoát ${r.code}: ${r.stderr.slice(0, 300)}`);
      const p = mode === "stale" ? shiftPayload(r.payload, -46) : r.payload;
      await c.query(`INSERT INTO "${SCHEMA}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, $2)`, [p, p.pushedAt]);
    }
    const u = new URL(localDbUrl());
    u.searchParams.set("options", `-c search_path=${SCHEMA}`);
    console.log(`ops-cloud-proto: ${mode} — DATABASE_URL=${u.toString()}`);
  } finally {
    await c.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`ops-cloud-proto: ${e.message}`);
    process.exit(1);
  });
}
