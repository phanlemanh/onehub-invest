#!/usr/bin/env node
// ap-hai-lan.mjs — răng của hồ sơ can-theo-tin-khi-phan-xu-lai (AC-5, E5). Dựng lại DB thử `oneinvest_p2_ct_hai` từ
// `oneinvest` (db/db-thu.sh), áp 066 lần một rồi lần hai: lần hai phải thoát 0, không đổi định nghĩa hai hàm và không thêm
// dòng ops_audit `can-theo-tin:*`. DB `oneinvest` dùng chung không bị chạm: đếm `can-theo-tin:*` trên nó = 0 trước và sau.
// Thoát 0 xanh · 1 lệch một vế (in vế) · 2 không dựng được DB thử.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const THU = "oneinvest_p2_ct_hai";   // tách khỏi DB thử của E1–E4 (oneinvest_p2_ct) để chạy song song không giẫm nhau
const MIG = readFileSync(path.join(ROOT, "db/migrations/066_can_theo_tin.sql"), "utf8");
const DX = ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest", "-h", "localhost", "-v", "ON_ERROR_STOP=1", "-At"];

const psql = (db, sql, input) => {
  const r = spawnSync("docker", [...DX, "-d", db, ...(sql ? ["-c", sql] : [])], { input, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql ${db}: ${r.stderr.trim()}`);
  return r.stdout.trim();
};
const demAudit = (db) => Number(psql(db, "SELECT count(*) FROM ops_audit WHERE action LIKE 'can-theo-tin:%'"));
const dinhNghia = (db) => psql(db, "SELECT md5(string_agg(pg_get_functiondef(p.oid), '' ORDER BY p.proname)) FROM pg_proc p " +
  "JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('apply_enrichment', 'revert_enrichment')");

const lech = [];
const goc0 = demAudit("oneinvest");
const dung = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), THU], { encoding: "utf8" });
if (dung.status !== 0) { console.error(`không dựng được DB thử: ${dung.stderr || dung.stdout}`); process.exit(2); }

psql(THU, null, MIG);
const sau1 = { audit: demAudit(THU), ham: dinhNghia(THU) };
psql(THU, null, MIG);
const sau2 = { audit: demAudit(THU), ham: dinhNghia(THU) };
const goc1 = demAudit("oneinvest");

if (sau2.ham !== sau1.ham) lech.push("định nghĩa apply/revert_enrichment đổi sau lần áp hai");
if (sau2.audit !== sau1.audit) lech.push(`ops_audit can-theo-tin:* lần một ${sau1.audit} → lần hai ${sau2.audit}`);
if (goc0 !== 0 || goc1 !== 0) lech.push(`DB oneinvest bị chạm: can-theo-tin:* trước ${goc0}, sau ${goc1}`);
if (!/066/.test(psql(THU, "SELECT pg_get_functiondef('apply_enrichment(bigint[],text)'::regprocedure)"))) {
  lech.push("apply_enrichment trên DB thử không phải bản 066");
}

console.log(`áp 066 hai lần trên ${THU}: lần hai thoát 0 · hàm ${sau1.ham === sau2.ham ? "giữ" : "ĐỔI"} · ops_audit can-theo-tin:* ${sau1.audit} → ${sau2.audit} · oneinvest can-theo-tin:* ${goc0} → ${goc1}`);
if (lech.length) { for (const l of lech) console.error(`lệch: ${l}`); process.exit(1); }
