#!/usr/bin/env node
// ap-hai-lan.mjs — răng của hồ sơ can-theo-tin-khi-phan-xu-lai (AC-5, E5). Dựng DB thử riêng cho lần chạy
// `oneinvest_p2_ct_hai_<pid>` từ `oneinvest` (db/db-thu.sh), xoá trong finally. Đếm độc lập số ô lệch trước khi áp; áp 066
// lần một: số dòng ops_audit `can-theo-tin:sua-mot-lan-066` mới = (lệch > 0 ? 1 : 0) và ô lệch còn lại = 0; áp lần hai:
// thoát 0, không đổi định nghĩa hai hàm, không thêm dòng. DB `oneinvest` không bị chạm: đếm `can-theo-tin:*` trước = sau.
// Thoát 0 xanh · 1 lệch một vế (in vế) · 2 không dựng được DB thử.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const THU = `oneinvest_p2_ct_hai_${process.pid}`;   // riêng mỗi lần chạy: không giẫm DB của E1–E4 hay lượt chạy song song
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

// Ô lệch đếm độc lập (không dùng câu của 066): căn gắn tin chung chủ thể với tin có đề xuất applied, ô căn trống mà tin mang.
const DEM_LECH = `WITH s AS (SELECT array_agg(DISTINCT o.source || ':' || coalesce(o.originating_system_key, o.post_ids[1])) k
    FROM enrichment_proposals ep JOIN sale_offer_records o ON o.offer_id = ep.offer_id WHERE ep.status = 'applied'),
  t AS (SELECT o.offer_id FROM sale_offer_records o, s
         WHERE offer_subject_keys(o.source, o.originating_system_key, o.post_ids) && coalesce(s.k, '{}'))
  SELECT count(*) FROM (SELECT po.property_id,
      bool_or(p.bedrooms IS NULL AND o.bedrooms IS NOT NULL) a, bool_or(p.bathrooms IS NULL AND o.bathrooms IS NOT NULL) b,
      bool_or(p.street IS NULL AND o.street_raw IS NOT NULL) c
    FROM t JOIN property_offers po ON po.offer_id = t.offer_id JOIN properties p ON p.id = po.property_id
    JOIN sale_offer_records o ON o.offer_id = po.offer_id GROUP BY po.property_id) x WHERE a OR b OR c`;

const lech = [];
const goc0 = demAudit("oneinvest");
const dung = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), THU], { encoding: "utf8" });
if (dung.status !== 0) { console.error(`không dựng được DB thử: ${dung.stderr || dung.stdout}`); process.exit(2); }
try {
  const canLech = Number(psql(THU, DEM_LECH));
  const audit0 = demAudit(THU);
  psql(THU, null, MIG);
  const sau1 = { audit: demAudit(THU), ham: dinhNghia(THU), conLech: Number(psql(THU, DEM_LECH)) };
  psql(THU, null, MIG);
  const sau2 = { audit: demAudit(THU), ham: dinhNghia(THU) };
  const goc1 = demAudit("oneinvest");

  if (sau1.audit - audit0 !== (canLech > 0 ? 1 : 0)) lech.push(`lần một: ${canLech} căn lệch mà ops_audit thêm ${sau1.audit - audit0} dòng`);
  if (sau1.conLech !== 0) lech.push(`lần một: còn ${sau1.conLech} căn lệch sau khối sửa`);
  if (sau2.ham !== sau1.ham) lech.push("định nghĩa apply/revert_enrichment đổi sau lần áp hai");
  if (sau2.audit !== sau1.audit) lech.push(`ops_audit can-theo-tin:* lần một ${sau1.audit} → lần hai ${sau2.audit}`);
  if (goc0 !== goc1) lech.push(`DB oneinvest bị chạm: can-theo-tin:* trước ${goc0}, sau ${goc1}`);
  if (!/066/.test(psql(THU, "SELECT pg_get_functiondef('apply_enrichment(bigint[],text)'::regprocedure)"))) {
    lech.push("apply_enrichment trên DB thử không phải bản 066");
  }
  console.log(`áp 066 hai lần trên ${THU}: căn lệch trước ${canLech} → sau lần một ${sau1.conLech} · audit +${sau1.audit - audit0} rồi +${sau2.audit - sau1.audit} · hàm ${sau1.ham === sau2.ham ? "giữ" : "ĐỔI"} · oneinvest can-theo-tin:* ${goc0} → ${goc1}`);
} finally {
  spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), THU, "--xoa"], { encoding: "utf8" });
}
if (lech.length) { for (const l of lech) console.error(`lệch: ${l}`); process.exit(1); }
