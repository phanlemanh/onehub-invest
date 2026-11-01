#!/usr/bin/env node
// ap-hai-lan.mjs — răng của hồ sơ can-theo-tin-khi-phan-xu-lai (AC-5, E5). Hai vế, mỗi vế một DB thử riêng của lần chạy,
// xoá trong finally:
//  (1) `oneinvest_p2_ct_mig_<pid>`: DB trống dựng từ ĐỦ chuỗi migration của nhánh (scripts/ci-db-init.mjs, gồm 066). Đối chứng
//      dương: gieo dòng cắt chuyển + một căn lệch (tin B chung bài đăng với tin A có đề xuất applied, căn của B trống ba ô
//      mà B mang) → phải đếm được lệch > 0; áp 066 lần hai: đúng MỘT dòng `can-theo-tin:sua-mot-lan-066` mới, ba ô, lệch
//      còn 0; áp lần ba: định nghĩa hai hàm và số dòng ops_audit `can-theo-tin:*` không đổi;
//  (2) `oneinvest_p2_ct_hai_<pid>`: bản chép `oneinvest` (db/db-thu.sh). Đếm độc lập số căn lệch; áp 066 lần một: dòng
//      `can-theo-tin:sua-mot-lan-066` mới = (lệch > 0 ? 1 : 0), căn lệch còn lại = 0; lần hai: không đổi gì.
// DB `oneinvest` không bị chạm: đếm `can-theo-tin:*` trước = sau = 0.
// Thoát 0 xanh · 1 lệch một vế (in vế) · 2 không dựng được DB thử.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const THU = `oneinvest_p2_ct_hai_${process.pid}`;   // riêng mỗi lần chạy: không giẫm DB của E1–E4 hay lượt chạy song song
const MIG_DB = `oneinvest_p2_ct_mig_${process.pid}`;
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

// Đối chứng dương cho vế (1): DB dựng từ migration không có dữ liệu và chưa cắt chuyển, khối sửa một lần không bao giờ chạy —
// gieo đúng một căn lệch để phép «áp lại không đổi nhật ký» có thể đỏ.
const GIEO = `INSERT INTO ops_audit (actor, action, env, detail) VALUES ('rang:can-theo-tin', 'phat-bieu:cat-chuyen', 'local', '{}');
  INSERT INTO sale_offer_records (offer_id, source, originating_system_key, post_ids, kind, first_seen, last_seen, bedrooms, bathrooms, street_raw)
  VALUES ('TST:rang-a', 'TST', 'rang-p', '{rang-p}', 'sale', now(), now(), NULL, NULL, NULL),
         ('TST:rang-b', 'TST', 'rang-b', '{rang-b,rang-p}', 'sale', now(), now(), 3, 2, 'Ngõ 5 Láng Hạ');
  INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, evidence)
  VALUES ('rang-can-theo-tin', 'TST:rang-a', 'bedrooms', '3', '3', 'e2_llm', 'direct', 'applied', '{}');
  WITH p AS (INSERT INTO properties (kind, property_type) VALUES ('sale', 'unknown') RETURNING id)
  INSERT INTO property_offers (property_id, offer_id) SELECT id, 'TST:rang-b' FROM p;`;
const SUA = "SELECT detail FROM ops_audit WHERE action = 'can-theo-tin:sua-mot-lan-066' ORDER BY id";

let ma = 0;
// (1) DB trống dựng từ đủ chuỗi migration
const tao = spawnSync("docker", ["exec", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "createdb", "-U", "oneinvest", "-h", "localhost", MIG_DB], { encoding: "utf8" });
if (tao.status !== 0) { console.error(`không tạo được ${MIG_DB}: ${tao.stderr}`); process.exit(2); }
try {
  const init = spawnSync(process.execPath, [path.join(ROOT, "scripts/ci-db-init.mjs")], {
    cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: `postgres://oneinvest:oneinvest@localhost:5433/${MIG_DB}` },
  });
  if (init.status !== 0) {
    console.error(`ci-db-init thoát ${init.status}: ${(init.stdout + init.stderr).slice(-800)}`);
    ma = 2;
  } else {
    const soMig = (init.stdout + init.stderr).match(/áp (\d+) migration/)?.[1] ?? "?";
    if (!/066/.test(psql(MIG_DB, "SELECT pg_get_functiondef('apply_enrichment(bigint[],text)'::regprocedure)"))) {
      lech.push("(1) apply_enrichment dựng từ chuỗi migration không phải bản 066");
    }
    psql(MIG_DB, null, GIEO);
    const lechGieo = Number(psql(MIG_DB, DEM_LECH));
    const m1 = { audit: demAudit(MIG_DB), ham: dinhNghia(MIG_DB) };
    psql(MIG_DB, null, MIG);
    const m2 = { audit: demAudit(MIG_DB), ham: dinhNghia(MIG_DB), conLech: Number(psql(MIG_DB, DEM_LECH)), sua: psql(MIG_DB, SUA) };
    psql(MIG_DB, null, MIG);
    const m3 = { audit: demAudit(MIG_DB), ham: dinhNghia(MIG_DB) };
    if (lechGieo !== 1) lech.push(`(1) đối chứng dương: gieo một căn lệch mà đếm được ${lechGieo}`);
    if (m2.audit - m1.audit !== 1) lech.push(`(1) áp 066 trên căn lệch đã gieo: ops_audit can-theo-tin:* thêm ${m2.audit - m1.audit} dòng, kỳ vọng 1`);
    if (m2.sua !== '{"cells": 3, "properties": 1}') lech.push(`(1) dòng sửa một lần ghi ${m2.sua || "(không có)"}, kỳ vọng {cells 3, properties 1}`);
    if (m2.conLech !== 0) lech.push(`(1) còn ${m2.conLech} căn lệch sau khối sửa`);
    if (m3.ham !== m2.ham) lech.push("(1) định nghĩa hai hàm đổi khi áp 066 lần nữa");
    if (m3.audit !== m2.audit) lech.push(`(1) ops_audit can-theo-tin:* ${m2.audit} → ${m3.audit} khi áp lần nữa`);
    console.log(`(1) ${MIG_DB}: dựng từ ${soMig} migration (gồm 066) · gieo ${lechGieo} căn lệch · áp lại: audit +${m2.audit - m1.audit} ${m2.sua} · lệch còn ${m2.conLech} · áp lần nữa: hàm ${m2.ham === m3.ham ? "giữ" : "ĐỔI"} · audit +${m3.audit - m2.audit}`);
  }
} finally {
  spawnSync("docker", ["exec", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", MIG_DB], { encoding: "utf8" });
}
if (ma) process.exit(ma);

// (2) bản chép oneinvest
const dung = spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), THU], { encoding: "utf8" });
if (dung.status !== 0) { console.error(`không dựng được DB thử: ${dung.stderr || dung.stdout}`); process.exit(2); }
// db-thu.sh chạy `pg_dump | psql` không pipefail: pg_dump chết giữa chừng (máy tải nặng) vẫn ra «dựng xong» với bản chép
// thiếu bảng — nhận ra ở đây, thoát 2 (không dựng được DB thử), không đổ lỗi cho 066.
const du = (() => { try { return psql(THU, "SELECT to_regclass('enrichment_proposals') IS NOT NULL AND to_regclass('property_offers') IS NOT NULL"); } catch { return "f"; } })();
if (du !== "t") {
  spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), THU, "--xoa"], { encoding: "utf8" });
  console.error(`bản chép ${THU} thiếu bảng (pg_dump dừng giữa chừng?) — chạy lại khi máy bớt tải`);
  process.exit(2);
}
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
  if (goc0 !== goc1 || goc0 !== 0) lech.push(`DB oneinvest bị chạm: can-theo-tin:* trước ${goc0}, sau ${goc1} (kỳ vọng 0 và 0)`);
  if (!/066/.test(psql(THU, "SELECT pg_get_functiondef('apply_enrichment(bigint[],text)'::regprocedure)"))) {
    lech.push("apply_enrichment trên DB thử không phải bản 066");
  }
  console.log(`(2) áp 066 hai lần trên ${THU}: căn lệch trước ${canLech} → sau lần một ${sau1.conLech} · audit +${sau1.audit - audit0} rồi +${sau2.audit - sau1.audit} · hàm ${sau1.ham === sau2.ham ? "giữ" : "ĐỔI"} · oneinvest can-theo-tin:* ${goc0} → ${goc1}`);
} finally {
  spawnSync("bash", [path.join(ROOT, "db/db-thu.sh"), THU, "--xoa"], { encoding: "utf8" });
}
if (lech.length) { for (const l of lech) console.error(`lệch: ${l}`); process.exit(1); }
