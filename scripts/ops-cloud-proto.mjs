#!/usr/bin/env node
/**
 * ops-cloud-proto.mjs — lược đồ «như cloud» cho bản bấm được và eval ảnh của ON3 `o-kpi-chi-do-local` (ADR-0014).
 * Dựng lược đồ `ops_cloud_proto` trong DB local: khuôn mọi bảng public (rỗng) TRỪ bảng tầng A / bảng thô mà cloud không có
 * (source_registry, review_queue, stg_*, airbnb_snapshots), chép dòng `users` để đăng nhập thử, và một bảng ops_heartbeat:
 *   --mode none   không có bản tin
 *   --mode fresh  bản tin do push-ops-facts THẬT dựng trên DB local (máy chủ thu tạm, không gửi lên cloud)
 *   --mode stale  cùng bản tin, mọi mốc lùi 46′
 *   --mode mixed  cùng bản tin tươi, khối lockdown đặt đủ ok true / false / null (ON23 ST-lockdown-mixed — chỉ đổi `ok`)
 * Bản tin mang khối s03 dựng từ HOME giả (`demoHome`, ON4): 3 nhóm bật, nhật ký cổng giả.
 * In ra biến môi trường để chạy dev server như cloud:  VERCEL=1 DATABASE_URL=<url> npm run dev -- -p 3460
 * (`VERCEL=1` bật nhánh cloud của app: trang thu thập đọc bản tin ops_heartbeat, bảng thô vắng là rỗng).
 * Dọn: --drop. Chỉ DB local; không đụng cloud.
 */
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const SCHEMA = "ops_cloud_proto";
const KHONG_LEN_CLOUD = /^(source_registry|review_queue|airbnb_snapshots|stg_.*)$/;

const shift = (iso, min) => new Date(Date.parse(iso) + min * 60_000).toISOString();

/** Khối lockdown mang đủ ba giá trị lớp — L1…L4b, OpenClaw, Kev, collector (ON23). Giữ lớp + mô tả của bên ghi. */
export const MIXED_OKS = [true, null, true, true, false, null, true, false];
export function mixedLockdown(p) {
  const out = structuredClone(p);
  const layers = out.blocks?.lockdown?.layers;
  if (!Array.isArray(layers)) throw new Error("bản tin không có khối lockdown — không dựng được --mode mixed");
  out.blocks.lockdown.layers = layers.map((l, i) => ({ ...l, ok: MIXED_OKS[i] ?? null }));
  return out;
}

/** Lùi mọi mốc của bản tin `min` phút (pushedAt và measured_at từng khối). */
export function shiftPayload(p, min) {
  const out = structuredClone(p);
  out.pushedAt = shift(out.pushedAt, min);
  for (const b of Object.values(out.blocks ?? {})) if (b?.measured_at) b.measured_at = shift(b.measured_at, min);
  return out;
}

/** HOME tạm của bên ghi (ON4): cấu hình OpenClaw giả 3 nhóm bật và nhật ký cổng giả — khối s03 đo được, có một nhóm chỉ
 * ghi được mã (bảng hiện «Nhóm chưa có tên»). Mã nhóm giả, không đọc ~/.openclaw. */
export function demoHome(now = Date.now()) {
  const t = (s) => new Date(now - 600_000 + s * 1000).toISOString();
  const g = (n) => `group:20000000000000000${n}`;
  const cfg = { channels: { zalouser: { accounts: { default: { groups: { [g(1)]: { enabled: true }, [g(2)]: { enabled: true }, [g(3)]: { enabled: true }, [g(4)]: { enabled: false } } } } } } };
  const log = [
    `${t(1)} post 202 {"accepted":3,"duplicates":0} group=Nhóm minh hoạ A p=0.99 account=default`,
    `${t(2)} post 202 {"accepted":2,"duplicates":0} group=Nhóm minh hoạ A p=0.97 account=default`,
    `${t(3)} skip (rỗng) group=Nhóm minh hoạ B account=default`,
    `${t(4)} post 202 {} group=Nhóm minh hoạ B p=0.95 account=default`,
    `${t(5)} post 202 {"accepted":1,"duplicates":0} group=9000000000000000003 p=0.93 account=default`,
  ].join("\n") + "\n";
  return { ".openclaw/openclaw.json": JSON.stringify(cfg), ".openclaw/logs/oneinvest-zalo-pipe.log": log };
}

async function main() {
  const require = createRequire(new URL("../app/package.json", import.meta.url));
  const pg = require("pg");
  const { captureOpsFacts, localDbUrl } = await import("../pipeline/scripts/capture-ops-facts.mjs");
  const args = process.argv.slice(2);
  const mode = args.includes("--drop") ? "drop" : (args[args.indexOf("--mode") + 1] ?? "none");
  if (!["none", "fresh", "stale", "mixed", "drop"].includes(mode)) throw new Error(`--mode phải là none|fresh|stale|mixed (được ${mode})`);
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
      const r = await captureOpsFacts({ env: { DATABASE_URL: localDbUrl() }, home: demoHome() });
      if (r.code !== 0 || !r.payload) throw new Error(`push-ops-facts thoát ${r.code}: ${r.stderr.slice(0, 300)}`);
      const p = mode === "stale" ? shiftPayload(r.payload, -46) : mode === "mixed" ? mixedLockdown(r.payload) : r.payload;
      await c.query(`INSERT INTO "${SCHEMA}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, $2)`, [p, p.pushedAt]);
    }
    const u = new URL(localDbUrl());
    u.searchParams.set("options", `-c search_path=${SCHEMA}`);
    console.log(`ops-cloud-proto: ${mode} — VERCEL=1 DATABASE_URL=${u.toString()}`);
  } finally {
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`ops-cloud-proto: ${e.message}`);
    process.exit(1);
  });
}
